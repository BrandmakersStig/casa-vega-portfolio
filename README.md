# Portfolio

Et eksklusivt fotografi-portfolio. Next.js 16 (App Router) + TypeScript +
Tailwind v4 + shadcn/ui + Framer Motion, med Supabase (Postgres + Storage +
Auth) som backend.

Separat projekt fra `casa-vega` — deployes for sig selv og kobles til
`casa-vega.dk/portfolio` via en rewrite i casa-vega-projektet (se nederst).

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

## Kobl til casa-vega.dk/portfolio

Dette projekt kører på sit eget Vercel-domæne (fx
`casa-vega-portfolio.vercel.app`). For at vise det på
`casa-vega.dk/portfolio` tilføjes en rewrite i **casa-vega**-projektet
(`casa-vega/next.config.ts`):

```ts
async rewrites() {
  return [
    { source: '/portfolio', destination: 'https://casa-vega-portfolio.vercel.app' },
    { source: '/portfolio/:path*', destination: 'https://casa-vega-portfolio.vercel.app/:path*' },
  ]
}
```

Dette er en ændring i det andet repo og bør kun laves når portfolio-sitet
er klar til produktion (spørg før du deployer den ændring).

## Scripts

| Kommando | Beskrivelse |
|---|---|
| `npm run dev` | Dev-server (Turbopack) |
| `npm run build` | Produktionsbuild |
| `npm run seed -- [sti]` | Generér/opdater demo-indhold fra en billedmappe |
| `npm run lint` | ESLint |
