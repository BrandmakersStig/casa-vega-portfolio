# Portfolio

Et eksklusivt fotografi-portfolio. Next.js 16 (App Router) + TypeScript +
Tailwind v4 + shadcn/ui + Framer Motion, med Supabase (Postgres + Storage +
Auth) som backend.

Separat projekt fra `casa-vega`, deployes for sig selv.

**Live:** https://portfolio.casa-vega.dk (og https://casa-vega-portfolio.vercel.app)

## Kom i gang

```bash
npm install
npm run seed          # genererer demo-indhold fra en mappe med billeder (se nedenfor)
npm run dev
```

Åbn <http://localhost:3000>. Ingen Supabase-projekt eller `.env`-opsætning
er nødvendig for at komme i gang — sitet kører i **dev-fallback-tilstand**
og læser/skriver til `lib/data/fallback/*.json` + `public/seed/` i stedet.
Admin-login: gå til `/admin`, adgangskode er `portfolio-admin`
(`ADMIN_FALLBACK_PASSWORD` i `.env.local`).

### Seed dine egne billeder

```bash
npm run seed -- /sti/til/en/mappe/med/undermapper
```

Hver undermappe bliver én collection; hvert billede i den får automatisk
EXIF udtrukket, WebP-thumbnails genereret (thumb/medium/large),
blurhash og en farvepalet. Standardstien er `~/Desktop/portfolio`.

## Supabase (produktion)

1. Opret et projekt på [supabase.com](https://supabase.com).
2. Kør migrationen: `supabase/migrations/0001_init.sql` (SQL editor, eller
   `supabase db push` med Supabase CLI).
3. Opret to Storage buckets: `images-original` og `images-derived` (begge
   public read).
4. Opret en admin-bruger under Authentication → Users.
5. Kopiér `.env.example` til `.env.local` og udfyld:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
   - `NEXT_PUBLIC_SITE_URL` (din rigtige URL).
6. Genstart dev-serveren — sitet skifter automatisk til Supabase-tilstand
   så snart env-variablerne er sat.

Se `CLAUDE.md` for arkitektur-detaljer og `ROADMAP.md` for hvad der er
bygget vs. forberedt.

## Deploy (Vercel)

```bash
npx vercel --prod
```

Sæt de samme env-variabler som ovenfor i Vercel's projekt-settings, plus
`ADMIN_SESSION_SECRET` (kun relevant i dev-fallback — kan udelades i
produktion når Supabase er konfigureret, men skader ikke at sætte).

## Domæne

Kører på `portfolio.casa-vega.dk` — et subdomæne, ikke en sti under
casa-vega.dk/portfolio. Det blev valgt bevidst: en sti-baseret proxy
(`casa-vega.dk/portfolio` → dette projekt) ville kræve at alle interne
links, `fetch()`-kald og navigation i denne app kendte til sit eget
subpath (Next.js `basePath`) — en større, mere skrøbelig ændring for
ingen reel gevinst. Subdomænet virkede med det samme uden nogen
kodeændring, arvet direkte fra casa-vega.dk's eksisterende DNS/Vercel-
opsætning (tilføjet via `vercel domains add portfolio.casa-vega.dk
casa-vega-portfolio`).

Vercel anbefaler (valgfrit, ikke nødvendigt lige nu — domænet virker fint)
at opdatere DNS til en dedikeret CNAME i stedet for at arve fra apex-
domænets A-record:

```
Type: CNAME
Name: portfolio
Value: 6d6203b9eeba1bc1.vercel-dns-017.com.
```

## Scripts

| Kommando | Beskrivelse |
|---|---|
| `npm run dev` | Dev-server (Turbopack) |
| `npm run build` | Produktionsbuild |
| `npm run seed -- [sti]` | Generér/opdater demo-indhold fra en billedmappe |
| `npm run lint` | ESLint |
