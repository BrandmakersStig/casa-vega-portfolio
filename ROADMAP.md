# Status

Ærlig oversigt over hvad der er fuldt bygget og testet vs. forberedt (skema
klar, ikke UI) vs. ikke startet — holdt op mod den oprindelige brief.

## ✅ Fuldt bygget og verificeret

- Forside: hero (billede/slideshow/video-tilstand med Ken Burns-crossfade),
  intro, udvalgte collections, seneste billeder.
- Sticky navigation: logo, Portfolio, Collections, About, Contact, søgning
  (⌘K command palette), dark/light mode.
- Collections: cards, 4 layouts (justified / klassisk grid / masonry /
  pinterest) med live-switcher, infinite scroll.
- Fullscreen lightbox: dyb sort baggrund, zoom (scroll/dobbeltklik/pinch),
  pan, original-opløsning, tastatur+swipe+klik-navigation, 3
  info-panel-tilstande (huskes), EXIF, klikbare keyword-chips (filtrerer),
  rating (kun-læsning for besøgende), kommentarsystem (navn+tekst, moderation,
  spam-heuristik, like), favorit-hjerte, del (link/QR/download).
- Global søgning + avancerede filtre (rating, kamera, objektiv, år,
  lokation, farve/S-H, keywords, collection) + sortering (6 muligheder).
- Favoritter-side (localStorage, ingen konto krævet).
- Admin-dashboard: login (Supabase Auth eller dev-fallback), oversigt m.
  statistik, drag&drop batch-upload med automatisk EXIF/thumbnail/WebP,
  billed-liste med batch- og enkelt-redigering (titel, keywords, rating,
  collection, synlighed, featured, download-politik), collections-CRUD
  (inkl. adgangskode-beskyttelse), kommentar-moderation, indstillinger.
- Cinematic View (`/cinematic`) — ét billede ad gangen, næsten usynligt UI.
- Verdenskort (`/map`) — billeder med GPS-data, Leaflet/OpenStreetMap.
- Adgangskode-beskyttede collections.
- Before/After-slider (komponent klar: `components/before-after/`).
- Tastaturgenveje i lightbox (←/→/Esc/I/?).
- SEO: metadata, OpenGraph, Twitter Cards, JSON-LD (ImageObject) på
  billedsider, `sitemap.xml`, `robots.txt`.
- Responsivt design, dark/light mode, `prefers-reduced-motion` respekteret.

## 🟡 Forberedt (skema/arkitektur klar, UI ikke bygget)

- **Klientgallerier** — `client_galleries`-tabel findes i migrationen, ingen
  UI endnu. Ville følge samme mønster som adgangskode-beskyttede
  collections.
- **Print-bestilling** — `print_orders`-tabel findes (status: inquiry →
  confirmed → shipped), ingen bestillingsflow. Brief tillod eksplicit at
  dette kun skulle "klargøres".
- **AI-genererede keywords/beskrivelser** — pluggable funktion i
  `lib/ai-keywords.ts` med udfyldt eksempel til Anthropic/OpenAI, men ingen
  API-nøgle er tilknyttet (kræver `AI_PROVIDER_API_KEY`).
- **Lightroom-integration** — ingen plugin, men EXIF/metadata-skemaet er
  struktureret så en fremtidig eksport/import kan mappe direkte til
  Lightroom-felter (title, rating, keywords, GPS).
- **Light Table** (side-om-side sammenligning af flere billeder) og
  **Offline-cache af nyligt viste billeder** — nævnt i briefen, ikke bygget
  pga. tidsbegrænsning i denne session. Naturlig næste-fase.
- **Smart Collections** (automatisk regelbaserede mapper) —
  `is_smart`/`smart_rules`-felter findes i skemaet og typerne
  (`SmartCollectionRule`), men reglerne evalueres ingen steder endnu.

## Kendte begrænsninger

- Zoom i lightbox bruger `large`-derivatet (2200px) som "original" i
  dev-fallback-tilstand — ægte fuld opløsning kræver Supabase Storage med
  de rigtige RAW/fuld-opløsnings-filer.
- Watermarking (download-politik `watermark`) er modelleret i skemaet, men
  selve vandmærke-påføringen ved download-tidspunkt er ikke implementeret.
- Ingen automatiseret test-suite endnu (Playwright/Vitest) — al verificering
  i denne session skete manuelt gennem browseren.

## Anbefalet næste skridt

1. Opret et Supabase-projekt (se README.md) og migrér væk fra
   dev-fallback-data.
2. Byg Light Table og Klientgallerier — begge følger etablerede mønstre i
   kodebasen (se `components/lightbox/` hhv.
   `components/collections/collection-gate.tsx`).
3. Overvej Playwright-tests for lightbox-interaktion (zoom/pan/nav) før
   videre UI-ændringer, da det er den mest komplekse del af kodebasen.
