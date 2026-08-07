# Status

Ærlig oversigt over hvad der er fuldt bygget og testet vs. forberedt (skema
klar, ikke UI) vs. ikke startet — holdt op mod den oprindelige brief.

**Live:** https://casa-vega-portfolio.vercel.app (Vercel, kørende mod et
rigtigt Supabase-projekt — ikke længere dev-fallback-tilstand i produktion).

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
  spam-heuristik, like), favorit-hjerte, del (link/QR/download), Light Table-
  tilføj-knap, print-bestilling.
- Global søgning + avancerede filtre (rating, kamera, objektiv, år,
  lokation, farve/S-H, keywords, collection) + sortering (6 muligheder).
- Favoritter-side (localStorage, ingen konto krævet).
- **Light Table** (`/light-table`) — søg og tilføj op til 8 billeder,
  sammenlign side om side med rating/EXIF, huskes i localStorage.
- **Smart Collections** — regelbaserede auto-udfyldte collections (rating,
  keyword, kamera, år, sort/hvid, lokation), evalueres live mod alle
  billeder. Rule-builder i `/admin/collections`. Verificeret: en "rating ≥ 4"
  smart collection matchede korrekt 88/220 billeder.
- **Klientgallerier** (`/gallery/[slug]`) — adgangskode-beskyttede kunde-
  gallerier bygget af en eller flere collections, oprettes/administreres i
  `/admin/client-galleries`, delbart link, ikke indekseret
  (`noindex` + `robots.txt`). Verificeret end-to-end.
- **Print-bestilling** — "Bestil print"-dialog i lightboxen (størrelse,
  materiale, kontaktinfo) opretter en `print_orders`-forespørgsel;
  `/admin/print-orders` viser og opdaterer status (inquiry → confirmed →
  shipped → cancelled). Ægte betaling/checkout er bevidst ikke bygget —
  det kræver en betalingsudbyder, som ikke var en del af opgaven.
  Verificeret end-to-end mod Supabase.
- **AI-genererede keywords/beskrivelser** — `lib/ai-keywords.ts` kalder nu
  rigtigt Anthropics Messages API (vision) og beder om dansk beskrivelse +
  8-12 keywords som JSON. ✨-knap pr. billede i `/admin/images` henter
  forslag og foreslår dem i de redigerbare felter (admin skal stadig trykke
  Gem). **Kræver `ANTHROPIC_API_KEY`** i miljøvariablerne — ikke sat i dette
  miljø, så selve AI-kaldet er ikke testet live, kun fejl-håndteringen ved
  manglende nøgle (bekræftet: giver en klar fejlbesked, ikke et crash).
- **Offline-cache** — en service worker (`public/sw.js`) cacher billed-
  requests (lokale `/seed/`-derivater og Supabase Storage) med
  stale-while-revalidate, så nyligt viste billeder er tilgængelige offline.
  Registreres kun i produktion (springes over i dev for ikke at genere
  Turbopack's HMR). Rører aldrig navigation/HTML/API-requests.
- Admin-dashboard: login (Supabase Auth eller dev-fallback), oversigt m.
  statistik, drag&drop batch-upload med automatisk EXIF/thumbnail/WebP,
  billed-liste med batch- og enkelt-redigering (titel, keywords, rating,
  collection, synlighed, featured, download-politik, AI-forslag),
  collections-CRUD (titel/beskrivelse redigerbar, adgangskode-beskyttelse,
  smart rules), klientgallerier, print-bestillinger, kommentar-moderation,
  indstillinger.
- Cinematic View (`/cinematic`) — ét billede ad gangen, næsten usynligt UI.
- Verdenskort (`/map`) — billeder med GPS-data, Leaflet/OpenStreetMap.
- Adgangskode-beskyttede collections.
- Before/After-slider (komponent klar: `components/before-after/`).
- Tastaturgenveje i lightbox (←/→/Esc/I/?).
- SEO: metadata, OpenGraph, Twitter Cards, JSON-LD (ImageObject) på
  billedsider, `sitemap.xml`, `robots.txt`.
- Responsivt design, dark/light mode, `prefers-reduced-motion` respekteret.

## 🟡 Forberedt / kendte begrænsninger

- **Lightroom-integration** — ingen plugin, men EXIF/metadata-skemaet er
  struktureret så en fremtidig eksport/import kan mappe direkte til
  Lightroom-felter (title, rating, keywords, GPS).
- Klientgalleriers `allowFavorites`/`allowDownload`-flag er gemt og vist i
  admin, men **ikke håndhævet** endnu i selve galleri-visningen (favorit-
  knappen og download-politikken er stadig de samme for alle besøgende,
  uanset flagget). Kræver at flaget sendes ned til `Lightbox`/`ShareMenu`.
- Zoom i lightbox bruger `large`-derivatet (2200px) som "original" — ægte
  fuld opløsning kræver at admin-uploaderen gemmer det oprindelige RAW/
  fuld-opløsnings-filformat (i øjeblikket bruges samme WebP-pipeline som
  seed-scriptet for alt indhold, inkl. det migrerede seed-datasæt).
- Watermarking (download-politik `watermark`) er modelleret i skemaet, men
  selve vandmærke-påføringen ved download-tidspunkt er ikke implementeret.
- Print-bestilling er kun en forespørgsels-flow (ingen betaling/checkout).
- AI-generering er kodet og fejlhåndteret, men ikke testet med en rigtig
  API-nøgle i denne session — sæt `ANTHROPIC_API_KEY` og prøv ✨-knappen.
- Ingen automatiseret test-suite endnu (Playwright/Vitest) — al verificering
  er sket manuelt gennem browseren og direkte Supabase-scripts i denne
  session.

## Anbefalet næste skridt

1. Sæt `ANTHROPIC_API_KEY` i Vercel og test AI-generering live.
2. Håndhæv `allowFavorites`/`allowDownload` i klientgalleri-visningen.
3. Overvej Playwright-tests for lightbox-interaktion (zoom/pan/nav) før
   videre UI-ændringer, da det er den mest komplekse del af kodebasen.
