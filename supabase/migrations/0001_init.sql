-- Casa Vega Portfolio — initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)
-- Storage buckets (images-original, images-derived) are created separately,
-- see supabase/README.md.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Collections (folders). Can be manual or "smart" (rule-based, auto-populated
-- client-side / by a scheduled function from smart_rules).
-- ---------------------------------------------------------------------------
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_image_id uuid, -- fk added after images table exists
  featured boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'unlisted', 'private')),
  password_hash text,
  is_smart boolean not null default false,
  smart_rules jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Images
-- ---------------------------------------------------------------------------
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  slug text not null,
  title text not null default 'Untitled',
  description text, -- markdown
  keywords text[] not null default '{}',
  rating smallint not null default 0 check (rating between 0 and 5),
  location text,
  gps_lat double precision,
  gps_lng double precision,
  exif jsonb not null default '{}',
  width integer not null,
  height integer not null,
  is_black_and_white boolean not null default false,
  dominant_colors text[] not null default '{}',
  blurhash text,
  visibility text not null default 'public' check (visibility in ('public', 'unlisted', 'private')),
  featured boolean not null default false,
  download_policy text not null default 'none' check (download_policy in ('none', 'low', 'original', 'watermark')),
  ai_keywords text[],
  ai_description text,
  ai_generated_at timestamptz,
  storage_path text not null, -- path within images-original bucket
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, slug)
);

alter table collections
  add constraint collections_cover_image_fk
  foreign key (cover_image_id) references images(id) on delete set null;

create index if not exists images_collection_idx on images (collection_id);
create index if not exists images_rating_idx on images (rating);
create index if not exists images_keywords_idx on images using gin (keywords);
create index if not exists images_created_idx on images (created_at desc);
-- Note: no composite full-text index across title/description/location/
-- keywords — lib/data/images.ts currently only searches the `title` column
-- (.textSearch('title', ...)), which Postgres can already do efficiently
-- without a dedicated index at this data size. Add one (with an IMMUTABLE
-- wrapper function around to_tsvector, which is only STABLE) if/when the
-- search query is expanded to cover multiple columns.

-- ---------------------------------------------------------------------------
-- Comments (threaded, moderated)
-- ---------------------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references images(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author_name text not null,
  author_email text,
  body text not null,
  like_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  pinned boolean not null default false,
  ip_hash text, -- for basic spam/rate-limit heuristics, never store raw IP
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_image_idx on comments (image_id);

-- ---------------------------------------------------------------------------
-- Favorites — anonymous visitors identified by a client-generated UUID
-- stored in a first-party cookie (see lib/favorites.ts), no account needed.
-- ---------------------------------------------------------------------------
create table if not exists favorites (
  visitor_id uuid not null,
  image_id uuid not null references images(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (visitor_id, image_id)
);

-- ---------------------------------------------------------------------------
-- Stats: append-only events, aggregated via views. Keeps writes cheap and
-- avoids row-lock contention on hot images.
-- ---------------------------------------------------------------------------
create table if not exists image_events (
  id bigint generated always as identity primary key,
  image_id uuid not null references images(id) on delete cascade,
  kind text not null check (kind in ('view', 'download', 'share')),
  created_at timestamptz not null default now()
);

create index if not exists image_events_image_idx on image_events (image_id, kind);

create or replace view image_stats as
select
  i.id as image_id,
  coalesce(v.n, 0) as views,
  coalesce(f.n, 0) as favorites,
  coalesce(d.n, 0) as downloads,
  coalesce(s.n, 0) as shares,
  coalesce(c.n, 0) as comments
from images i
left join (select image_id, count(*) n from image_events where kind = 'view' group by image_id) v on v.image_id = i.id
left join (select image_id, count(*) n from favorites group by image_id) f on f.image_id = i.id
left join (select image_id, count(*) n from image_events where kind = 'download' group by image_id) d on d.image_id = i.id
left join (select image_id, count(*) n from image_events where kind = 'share' group by image_id) s on s.image_id = i.id
left join (select image_id, count(*) n from comments where status = 'approved' group by image_id) c on c.image_id = i.id;

-- ---------------------------------------------------------------------------
-- Client galleries — password-protected shareable sets for individual clients
-- ---------------------------------------------------------------------------
create table if not exists client_galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  client_name text,
  collection_ids uuid[] not null default '{}',
  image_ids uuid[] not null default '{}',
  password_hash text,
  expires_at timestamptz,
  allow_favorites boolean not null default true,
  allow_download boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site-wide settings — single row, key/value style for flexibility.
-- ---------------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Print orders (schema prepared for future e-commerce; no checkout flow yet)
-- ---------------------------------------------------------------------------
create table if not exists print_orders (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references images(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  size text not null,
  material text,
  status text not null default 'inquiry' check (status in ('inquiry', 'confirmed', 'shipped', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- Atomic like-count increment, callable by anon via supabase.rpc(...).
-- security definer: anon has no UPDATE policy on comments (moderation is
-- service-role only), so this narrowly-scoped function runs as its owner to
-- allow just the counter bump.
create or replace function increment_comment_like(comment_id uuid) returns void as $$
  update comments set like_count = like_count + 1 where id = comment_id;
$$ language sql security definer set search_path = public;

revoke all on function increment_comment_like(uuid) from public;
grant execute on function increment_comment_like(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists images_updated_at on images;
create trigger images_updated_at before update on images
  for each row execute function set_updated_at();

drop trigger if exists collections_updated_at on collections;
create trigger collections_updated_at before update on collections
  for each row execute function set_updated_at();

drop trigger if exists comments_updated_at on comments;
create trigger comments_updated_at before update on comments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table collections enable row level security;
alter table images enable row level security;
alter table comments enable row level security;
alter table favorites enable row level security;
alter table image_events enable row level security;
alter table client_galleries enable row level security;
alter table settings enable row level security;
alter table print_orders enable row level security;

-- Public read of public, non-password-protected collections/images.
-- Admin (any authenticated Supabase user — this project has a single
-- admin account, see supabase/README.md) gets full access via service role
-- in server-only code paths instead of broad authenticated policies.
create policy "public read public collections" on collections
  for select using (visibility = 'public' and password_hash is null);

create policy "public read public images" on images
  for select using (
    visibility = 'public'
    and exists (
      select 1 from collections c
      where c.id = images.collection_id
        and c.visibility = 'public'
        and c.password_hash is null
    )
  );

create policy "public read approved comments" on comments
  for select using (status = 'approved');

create policy "public insert comments" on comments
  for insert with check (status = 'pending');

create policy "public manage own favorites" on favorites
  for all using (true) with check (true);

create policy "public insert events" on image_events
  for insert with check (true);

create policy "public read settings" on settings
  for select using (true);

-- All writes to collections/images/client_galleries/print_orders/settings and
-- comment moderation happen through server routes using the Supabase
-- service-role key (lib/supabase/admin.ts), which bypasses RLS. No public
-- write policies are defined for those tables/actions.
