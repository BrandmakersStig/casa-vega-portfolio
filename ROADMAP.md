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
  tilføj-knap.
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
- Admin-dashboard: login (Supabase Auth eller dev-fallback), oversigt m.
  statistik, drag&drop batch-upload med automatisk EXIF/thumbnail/WebP,
  billed-liste med batch- og enkelt-redigering (titel, keywords, rating,
  collection, synlighed, featured, download-politik), collections-CRUD
  (titel/beskrivelse redigerbar, adgangskode-beskyttelse, smart rules),
  klientgallerier, kommentar-moderation, indstillinger.
- Cinematic View (`/cinematic`) — ét billede ad gangen, næsten usynligt UI.
- Verdenskort (`/map`) — billeder med GPS-data, Leaflet/OpenStreetMap.
- Adgangskode-beskyttede collections.
- Before/After-slider (komponent klar: `components/before-after/`).
- Tastaturgenveje i lightbox (←/→/Esc/I/?).
- SEO: metadata, OpenGraph, Twitter Cards, JSON-LD (ImageObject) på
  billedsider, `sitemap.xml`, `robots.txt`.
- Responsivt design, dark/light mode, `prefers-reduced-motion` respekteret.

## 🟡 Forberedt (skema/arkitektur klar, UI ikke bygget)

- **Print-bestilling** — `print_orders`-tabel findes (status: inquiry →
  confirmed → shipped), ingen bestillingsflow. Brief tillod eksplicit at
  dette kun skulle "klargøres".
- **AI-genererede keywords/beskrivelser** — pluggable funktion i
  `lib/ai-keywords.ts` med udfyldt eksempel til Anthropic/OpenAI, men ingen
  API-nøgle er tilknyttet (kræver `AI_PROVIDER_API_KEY`).
- **Lightroom-integration** — ingen plugin, men EXIF/metadata-skemaet er
  struktureret så en fremtidig eksport/import kan mappe direkte til
  Lightroom-felter (title, rating, keywords, GPS).
- **Offline-cache af nyligt viste billeder** — nævnt i briefen, ikke bygget.
- Klientgalleriers `allowFavorites`/`allowDownload`-flag er gemt og vist i
  admin, men **ikke håndhævet** endnu i selve galleri-visningen (favorit-
  knappen og download-politikken er stadig de samme for alle besøgende,
  uanset flagget). Kræver at flaget sendes ned til `Lightbox`/`ShareMenu`.

## Kendte begrænsninger

- Zoom i lightbox bruger `large`-derivatet (2200px) som "original" — ægte
  fuld opløsning kræver at admin-uploaderen gemmer det oprindelige RAW/
  fuld-opløsnings-filformat (i øjeblikket bruges samme WebP-pipeline som
  seed-scriptet for alt indhold, inkl. det migrerede seed-datasæt).
- Watermarking (download-politik `watermark`) er modelleret i skemaet, men
  selve vandmærke-påføringen ved download-tidspunkt er ikke implementeret.
- Ingen automatiseret test-suite endnu (Playwright/Vitest) — al verificering
  er sket manuelt gennem browseren og direkte Supabase-scripts i denne
  session.

## Anbefalet næste skridt

1. Håndhæv `allowFavorites`/`allowDownload` i klientgalleri-visningen.
2. Byg print-bestillingsflow eller AI-keyword-generering, hvis relevant.
3. Overvej Playwright-tests for lightbox-interaktion (zoom/pan/nav) før
   videre UI-ændringer, da det er den mest komplekse del af kodebasen.
