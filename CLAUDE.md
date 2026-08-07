@AGENTS.md

# Projektnoter til Claude / AI-agenter

Portfolio-website for [en fotografs] arbejde. Bygget som et **helt separat
GitHub/Vercel-projekt** fra casa-vega — det er IKKE en del af casa-vega's
kodebase. Live på `portfolio.casa-vega.dk` — et **subdomæne** (ikke en sti
under casa-vega.dk/portfolio, se "Domain routing" nedenfor for hvorfor).

## Arkitektur

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4 +
  shadcn/ui (Base UI-baseret, IKKE Radix — se "Base UI, ikke Radix" nedenfor)
  + Framer Motion.
- **Backend: Supabase** (Postgres + Storage + Auth) — se
  `supabase/migrations/0001_init.sql` for det fulde skema.
- **Dev-fallback uden Supabase**: hvis `NEXT_PUBLIC_SUPABASE_URL` ikke er
  sat, læser/skriver hele appen i stedet til `lib/data/fallback/*.json` +
  `public/seed/` (billeder). Se `lib/supabase/config.ts`
  (`isSupabaseConfigured()`) — næsten hver funktion i `lib/data/*` har to
  grene, én for hver tilstand. Dette er IKKE en midlertidig stub — det er
  hvordan sitet er fuldt browsbart og demonstrerbart uden nogensinde at
  oprette et Supabase-projekt.
- **Seed-data**: `npm run seed` scanner en mappe med undermapper (hver
  undermappe = én collection) og genererer thumb/medium/large WebP +
  EXIF + blurhash + farvepalet. Kør den igen når som helst — se
  `scripts/seed.ts`. `public/seed/` er gitignored (regenerér lokalt);
  `lib/data/fallback/*.json` er trackeded med tomme defaults, og
  `npm run seed` overskriver den lokalt.

## Kritiske arkitektur-fakta

1. **Next.js 16, ikke 15** — `middleware.ts` hedder `proxy.ts` og
   eksporterer `proxy`, ikke `middleware` (se `proxy.ts`). Params/
   searchParams/cookies er altid async. Læs
   `node_modules/next/dist/docs/` før du render noget nyt routing-relateret
   — se `AGENTS.md` ovenfor.
2. **Base UI, ikke Radix.** `components/ui/*` (shadcn-genereret) importerer
   fra `@base-ui/react`, ikke `@radix-ui/*`. Der er INGEN `asChild`-prop —
   brug `render={<Button ... />}` i stedet, eller spread props direkte på
   Trigger-komponenten (den renderer selv et rigtigt `<button>`). Se
   `components/collections/layout-switcher.tsx` og
   `components/lightbox/share-menu.tsx` for eksempler. At bruge `asChild`
   giver indlejrede `<button>`-tags og en React-hydration-fejl.
3. **`proxy.ts`'s matcher fanger `/api/admin/:path*`** — login/logout-
   endpoints (`/api/admin/login`, `/api/admin/logout`) er eksplicit
   undtaget (`isAuthEndpoint`), ellers kan man aldrig logge ind (guard
   blokerer selve login-kaldet). Hvis du tilføjer nye ugated admin-API-
   ruter, husk denne faldgrube.
4. **Lightbox bruger IKKE parallel/intercepting routes.** Bevidst valg —
   Next 16's nye routing-motor + parallel-routes kræver `default.js` alle
   vegne og er stadig relativt uafprøvet i denne kodebase. I stedet: klik
   på et billede sætter Zustand-state (`store/lightbox-store.ts`) og
   opdaterer URL'en via `window.history.pushState` (ikke `router.push` —
   undgår en full RSC-refetch). Direkte links til
   `/collections/[slug]/[imageSlug]` virker separat via en rigtig
   server-renderet side der åbner lightboxen med det samme
   (`initialImageId`-prop på `PhotoGrid`).
5. **`next/image` er `unoptimized: true`** (se `next.config.ts`) — vi
   genererer selv thumb/medium/large WebP (seed-script og
   `lib/data/admin-images.ts` upload-pipeline), så Next's egen
   billedoptimering er overflødig og ville koste ekstra latency/cost uden
   fordel.
6. **`PhotoThumb`-komponenten bruger IKKE en `onLoad`-baseret fade-in.**
   Prøvet og forkastet — hvis et billede allerede er cached/loaded (meget
   almindeligt her, samme foto optræder ofte i flere grids på én side),
   fyrer `<img onLoad>` aldrig, og billedet sad fast usynligt
   (`opacity-0`). Blurhash ligger i stedet permanent bagved i
   stacking-rækkefølgen; billedet maler ovenpå så snart det har pixels.
   Se kommentaren i `components/shared/photo-thumb.tsx` før du "forbedrer"
   den med en loading-state igen.
7. **Adgangskode-beskyttede collections har et RLS-hul du skal kende.**
   Den offentlige RLS-policy for `images`/`collections` ekskluderer
   password-beskyttede rækker helt (`password_hash is null`-betingelse).
   Så snart en besøgende har låst op (cookie sat af
   `lib/auth/collection-access.ts`), skal siden hente data igen med
   service-role klienten (`includeAll`/`includeProtected`-flag) for
   overhovedet at kunne se indholdet — den almindelige anon-klient kan
   det aldrig, uanset cookien. Se `app/collections/[slug]/page.tsx`.

## Genbrugelige mønstre

- **`lib/data/*.ts`**: læse-funktioner, altid med `isSupabaseConfigured()`-
  gren. Skriv nye på samme måde.
- **`lib/data/admin-*.ts`**: skrive-funktioner (kun kaldt fra
  `/api/admin/*`-routes, som er gated af `proxy.ts`). Samme to-grenet
  mønster.
- **`store/*.ts`**: Zustand, `persist`-middleware til localStorage for
  besøger-præferencer (favoritter, lightbox info-panel-tilstand,
  grid-layout). Ingen server-session for almindelige besøgende.
- Se `lib/auth/require-admin.ts` / `lib/auth/fallback-session.ts` for
  admin-auth-mønsteret (Supabase Auth i prod, HMAC-signeret cookie i
  dev-fallback).

## Kendte begrænsninger / ikke bygget endnu

Se `ROADMAP.md` for en ærlig status over hvad der er fuldt bygget vs.
forberedt-men-ikke-implementeret (i skrivende stund kun: Lightroom-
integration, klientgalleriers allow-favorites/allow-download-håndhævelse).

## Domain routing

Live på `portfolio.casa-vega.dk` — et **subdomæne**, bevidst IKKE en sti
under casa-vega.dk/portfolio. En sti-baseret proxy ville kræve at hele
appen (alle `fetch()`-kald, `window.history.pushState`, interne links)
kendte sit eget subpath (Next.js `basePath`) — en større, skrøbelig
ændring for ingen reel gevinst. Subdomænet virkede med det samme uden
kodeændringer, tilføjet via `vercel domains add portfolio.casa-vega.dk
casa-vega-portfolio` (arver DNS fra casa-vega.dk's eksisterende
Vercel-opsætning). Rør ikke `casa-vega`-repoet fra denne kodebase.

## Når du er i tvivl

Kør `npm run dev` og tjek at dev-fallback-tilstanden virker uden nogen
`.env`-opsætning udover `.env.local` (allerede tilstede med trygge
defaults). Spørg Stig før du rører Supabase-skemaet på en måde der taber
data, eller før du deployer.
