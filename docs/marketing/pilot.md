# Marketing pilot: Instagram and YouTube (4 weeks)

Assets made by the app itself, so the pipeline can run every week:
- **Route videos** (`node scripts/media/make-video.mjs <journey-id> vertical|horizontal`): title card, the route drawing
  itself on the globe, a card at each main stop, end card with "link in bio". 9:16 for Reels/Shorts, 16:9 for YouTube.
- **Demos** (`node scripts/media/make-demo.mjs moto|bike|hike --outro <clip.mp4>`): the real app recorded while it
  plans a trip from one sentence, with step captions, the waiting cut short, and a 5 s outro clip. Outro clips are
  free Pexels videos (commercial use, no credit needed), kept in `marketing/out/stock/`: 4606789 (motorcycle, forest
  road), 31053314 (cyclist, mountains ahead), 13008673 (hiker at a waterfall). Demos live in `make-demo.mjs`.
- **Carousels** (`node scripts/media/make-carousel.mjs <deck>`): 1080×1350 slides with mini-maps; decks live in
  `scripts/media/carousel.ts`.
- Both need the dev server (`npx vite --port 5179`). Files go to `marketing/out/` (not in git).
- No music is baked in: add a trending sound from the Instagram/YouTube library when posting (free to use there).
- Add your own voice where a script is given: a voice builds trust faster than captions alone.

Rules: our own maps and summaries; photos only from Wikimedia with the credit shown; never suggest the travellers
endorse us; safety posts always say "summary only, read the official advice".

## Pilot assets (ready)

| Asset | File | Platform |
|---|---|---|
| Long Way Round, route reveal | `marketing/out/long-way-round-vertical.mp4` | Reel + Short |
| Paris–Dakar 1979, route reveal | `marketing/out/dakar-1979-vertical.mp4` | Reel + Short |
| Até Lá Abaixo, route reveal (PT) | `marketing/out/ate-la-abaixo-2010-vertical-pt.mp4` | Reel + Short (PT) |
| Planned in 60 s: EN2 by motorcycle | `marketing/out/demo-moto.mp4` | Reel + Short |
| Planned in 60 s: Porto → Lisbon by bike | `marketing/out/demo-bike.mp4` | Reel + Short |
| Planned in 60 s: Fishermen's Trail on foot | `marketing/out/demo-hike.mp4` | Reel + Short |
| 7 classic overland routes in Africa | `marketing/out/carousel-africa/` (9 slides) | Carousel (EN) |
| Até Lá Abaixo: 3 amigos, 1 jipe, 21 países | `marketing/out/carousel-ate-la-abaixo/` (6 slides) | Carousel (PT) |

## Week by week

Post at about 19:00–21:00 Lisbon time (Portugal and Brazil evening, US afternoon). Batch everything on one day.

| Week | Mon | Wed | Thu | Sat | Sun |
|---|---|---|---|---|---|
| 1 | Reel: Long Way Round | Carousel: 7 Africa routes | Reel: Dakar 1979 | Carousel: Até Lá Abaixo (PT) | Reel: Até Lá Abaixo (PT) |
| 2 | Reel: Planned in 60 s, EN2 by motorcycle | Carousel: Women who rode the world first | Reel: Mongol Rally | Carousel: EuroVelo in the south of France | Reel: Motorcycle Diaries · YouTube long: *Long Way Round, the real route* |
| 3 | Reel: Planned in 60 s, Porto → Lisbon by bike | Carousel: Overland safety this week (first bulletin) | Reel: Rickshaw Run | Carousel: Estrada Nacional 2 em 10 paragens (PT) | Reel: Transamazônica (PT-BR) |
| 4 | Reel: Planned in 60 s, Fishermen's Trail | Carousel: Bikepacking the Pyrenees and the Alps | Reel: Lois on the Loose | Carousel: Rotas épicas do Brasil (PT-BR) | Reel: Capelo & Ivens (PT) · YouTube long: *Paris–Dakar 1979, stage by stage* |

Every Reel also goes up as a YouTube Short the same day. Stories daily: repost, a poll ("Would you ride this?"), a
question box ("Which journey next?"): the answers pick next week's videos.

## Captions and scripts for the pilot

### 1. Long Way Round (Reel / Short)
- **Hook on screen (first 2 s):** "London to New York. The long way."
- **Voiceover (≈ 35 s):** "In 2004 Ewan McGregor and Charley Boorman rode from London to New York the long way: east.
  Through Europe and Ukraine, across Kazakhstan, Mongolia's tracks, Siberia's Road of Bones to Magadan, then Alaska, Canada and the US: about
  30,000 km in under four months. Here's every stop. Want to follow it, or plan your own? Link in bio."
- **Caption (EN):** The Long Way Round, mapped stop by stop 🌍 London → New York, heading east: about 30,000 km in under four
  months. Which stretch would you ride? 👇 Every stop, photo and story: link in bio.
- **Caption (PT):** Long Way Round, paragem a paragem 🌍 Londres → Nova Iorque pelo lado mais longo. Que troço farias tu? 👇
- **Hashtags:** #longwayround #adventuremotorcycle #overland #motorcycletravel #roadofbones #mongolia #advrider

### 2. Paris–Dakar 1979 (Reel / Short)
- **Hook:** "The first Paris–Dakar. No GPS. Just the Sahara."
- **Voiceover:** "December 1978: the first Paris–Dakar leaves Paris. Marseille, the boat to Algiers, then Tamanrasset,
  Agadez, Niamey, Bamako and on to Dakar: France, Algeria, Niger, Mali and Senegal. Alain Génestier's Range Rover won
  the cars, Cyril Neveu's Yamaha XT500 the bikes. This is the route they drove."
- **Caption (EN):** The very first Paris–Dakar (1978–79), drawn on the map 🏜️ Paris → Algiers → the Sahara → Dakar.
  Would you have started? Link in bio for every stage.
- **Caption (PT):** O primeiro Paris–Dakar (1978–79), no mapa 🏜️ Terias alinhado à partida?
- **Hashtags:** #dakar #parisdakar #dakarrally #sahara #rallyraid #yamahaxt500 #overlanding

### 3. Até Lá Abaixo (Reel / Short, PT)
- **Hook:** "3 amigos. 1 jipe. 21 países. Destino: o Mundial."
- **Voz (≈ 35 s):** "Em 2010, o Tiago, o João e o João largaram os empregos e foram de jipe de Lisboa a Joanesburgo
  para ver o Mundial. Trinta mil quilómetros, cinco meses, vinte e um países. No Zimbabué, uns miúdos de rua
  furaram-lhes um pneu. Deu um livro e um documentário. O percurso está no link da bio."
- **Legenda (PT):** Lisboa → Joanesburgo de jipe para ver o Mundial 2010 ⚽🚙 30 000 km, 150 dias, 21 países.
  Farias isto com os teus amigos? Marca-os 👇 Livro: "Até Lá Abaixo", de Tiago Carrasco.
- **Caption (EN):** Three friends, one jeep, Lisbon to Johannesburg for the 2010 World Cup ⚽ 30,000 km. Tag your crew.
- **Hashtags:** #atelaabaixo #overlandafrica #mundial2010 #viagem #jipe #africa #roadtrip #portugal
- Ask the authors before posting (tag them): a repost from them is worth more than any ad.

### 4. Carousel: 7 classic overland routes in Africa
- **Caption (EN):** 7 classic overland routes in Africa 🌍 Save this for your next trip. 1 Lisbon → Dakar 2 West
  Africa coast 3 Atlas to Sahara 4 Skeleton Coast & Kaokoland 5 Okavango to Chobe 6 Sani Pass & Lesotho 7 Congo Nile
  Trail. Which one first? 👇 (Check the official travel advice: the map shows it.)
- **Hashtags:** #overlandafrica #africaoverland #4x4adventure #overlanding #skeletoncoast #sanipass #namibia #morocco

### 5. Carousel: Até Lá Abaixo (PT)
- **Legenda:** 3 amigos, 1 jipe, 21 países: a viagem até ao Mundial 2010, paragem a paragem 🗺️ Guarda para mais tarde.
  Livro "Até Lá Abaixo" (Oficina do Livro, 2011) e documentário de João Fontes.

## YouTube long videos (every 2 weeks, 8–12 min)
Built from the horizontal render (`make-video.mjs <id> horizontal`) slowed down, plus your voice and the stop cards
as chapters. Chapters in the description = one per main stop. Description: the sources, the book links (affiliate,
with the disclosure line), "plan your own" link. Thumbnail: the map frame with the route + a 3-word title.

## Measuring (weekly, 10 minutes)
Per post: reach, saves, shares, profile visits, link clicks (UTM: `?utm_source=instagram&utm_campaign=<post>`).
Keep what gets saves and shares; drop formats under the account average after 3 tries. Goal for the 4 weeks: find
the 2 formats that beat the average and double them.

## Captions for the "Planned in 60 seconds" demos

### EN2 by motorcycle
- **Caption (EN):** The Estrada Nacional 2, Chaves → Faro, planned from one sentence 🏍️ Route, 4 days, guesthouses,
  weather and budget in about a minute. What's your dream ride? Type it in: link in bio.
- **Legenda (PT):** A EN2 de Chaves a Faro, planeada com uma frase 🏍️ Rota, 4 dias, alojamento, meteorologia e
  orçamento num minuto. Qual é a tua viagem de sonho? Link na bio.
- **Hashtags:** #en2 #estradanacional2 #motorcycletravel #mototurismo #portugal #roadtrip #advrider

### Porto → Lisbon by bike
- **Caption (EN):** Porto to Lisbon along the Atlantic by gravel bike: 5 days, 437 km, campsites every night,
  planned in 60 seconds 🚲 Where would you ride? Link in bio.
- **Legenda (PT):** Porto → Lisboa pela costa, de gravel: 5 dias, 437 km, campismo, planeado em 60 segundos 🚲
- **Hashtags:** #bikepacking #gravelbike #cycletouring #eurovelo1 #portugal #bicicleta

### The Fishermen's Trail on foot
- **Caption (EN):** The Fishermen's Trail, Porto Covo → Odeceixe, planned in 60 seconds 🥾 Stages, guesthouses,
  weather and costs. Save it for spring. Link in bio.
- **Legenda (PT):** O Trilho dos Pescadores, da Rota Vicentina, planeado em 60 segundos 🥾 Guarda para a primavera.
- **Hashtags:** #rotavicentina #fishermenstrail #hiking #trekking #alentejo #caminhadas #portugal
