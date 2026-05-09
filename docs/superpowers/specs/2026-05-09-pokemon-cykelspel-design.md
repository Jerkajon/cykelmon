# Pokémon Cykelspel — Design

**Datum:** 2026-05-09
**Författare:** Erik + Claude (brainstorming)
**Status:** Spec — väntar på godkännande innan implementationsplan

## Syfte

Endless runner-spel för Eriks 3-åring att spela på familjens iPad. En karaktär cyklar genom Pokémon-fyllda biomer; barnet samlar Pokémon i en klistermärkesbok som persisteras lokalt. **Inga förlustskärmar.** All interaktion via en finger-tap.

Spelet är ett privat familjeprojekt — distribueras inte publikt (löser Pokémon-licensfrågan).

## Bakgrund och kontext

- Erik har en sprite-pipeline (FLUX.2 [klein] + Limbicnation pixel-art LoRA via Draw Things på `127.0.0.1:7860`) i Familjespelet. Pipelinen är top-down, men kan justeras med ny trigger-prompt för side-view.
- 3-åring → ETT input (en finger-tap), inget tidskritiskt, ingen text, generös felmarginal.
- iPad i Safari → "Add to Home Screen" → fungerar som app utan App Store.

## Spelloop

En "run" pågår tills barnet trycker "hem". 30s+ förväntad sessionstid.

1. Spelet startar → cykeln rullar automatiskt åt höger
2. Hinder dyker upp på marken (sten, pöl, stalagmit) — barnet **tappar för att hoppa**
3. Pokémon dyker upp på marken — **automatisk pickup** när cykeln åker förbi (tap behövs inte, för enkelt)
4. Vid kollision med hinder: mjuk bonk-animation, kort paus (~0.5s), fortsätter
5. Efter ~30s eller efter X möten: biom byts via övergångsanimation (cykeln rullar in i en tunnel) → annan parallax + andra Pokémon
6. När barnet trycker "hem" → tillbaka till startskärm
7. Startskärm: klistermärkesbok + stor "Spela!"-knapp

**Designval:** automatisk pickup istället för "tap = pickup" eller "tap = jump+pickup". Anledning: en 3-åring ska inte behöva välja mellan två betydelser för samma gest. Hopp är spel-momentet, samlandet sker passivt.

## Klistermärkesbok

Persisteras i `localStorage` under `pokemoncykelspel.stickers`.

**Schema:**
```json
{
  "version": 1,
  "pokemon": {
    "1":  {"seen": true,  "shiny": false, "firstSeenAt": 1715000000000},
    "25": {"seen": true,  "shiny": true,  "firstSeenAt": 1715000050000}
  }
}
```

**UI:**
- En sida per biom (Skog, Strand, Grotta) + en sida för shinies
- Tom slot = grå silhuett. Sett = färglagd sprite med liten skutt-animation när bok bläddras
- Bläddra med swipe vänster/höger eller pilar
- Ingen "fullbordan"-skärm — bara organisk samling

## Biomer

Tre biomer, slumpvis rotation. Varje har 8 Pokémon (~24 totalt) + 1-2 hindertyper + parallax-bakgrund + musikslinga.

| Biom    | Pokémon (gen 1, ~8 st)                                                  | Hinder              | Stämning                  |
|---------|-------------------------------------------------------------------------|---------------------|---------------------------|
| Skog    | Bulbasaur, Caterpie, Pidgey, Oddish, Pikachu, Eevee, Bellsprout, Nidoran♀ | Sten, fallen stock  | Lummigt grönt             |
| Strand  | Squirtle, Krabby, Psyduck, Staryu, Slowpoke, Tentacool, Horsea, Goldeen   | Vattenpöl, snäcka   | Hav i bakgrunden, sand    |
| Grotta  | Geodude, Zubat, Onix, Diglett, Machop, Sandshrew, Cubone, Gastly          | Stalagmit, sten     | Stenväggar, fackeleld     |

**Shiny-variant:** Varje Pokémon har 1/50 chans att vara shiny vid spawn. Shinies har egen klistermärke-plats (24 + 24 = 48 möjliga klistermärken totalt).

## Hastighet & spawning

- Startfart: cykeln åker ~2 karaktärsbredder per sekund (lugnt)
- Ökar med 5 % per 30 sekunder, max 3× startfart (sedan platå)
- Hinder: minst 1 sekund mellanrum, **aldrig direkt efter ett hopp** (tarmminimum 0.7s reaktion)
- Pokémon: spawnas i mellanrummen mellan hinder, **aldrig samtidigt** med hinder (tvingar inget val)
- Slumpvis biom-rotation efter ~30s spel; visuell övergång maskerar bytet

## Interaktion

- **ETT input:** en-finger tap någonstans på skärmen
- **Tap medan på marken** → hopp
- **Tap medan i luften** → ignoreras (inget dubbelhopp, för svårt)
- **Pokémon-pickup** → automatisk när cykeln passerar
- Inga andra inputs (inga menyer mid-game, inga gester)

## Ljud

- Bakgrundsmusik: tre korta loopar, en per biom (royalty-free, t.ex. Kevin MacLeod eller AI-genererad)
- Ljudeffekter:
  - Hopp: kort "woosh"
  - Pokémon-pickup: glad chime
  - Shiny-pickup: extra glittrig chime
  - Hinder-bonk: mjuk komisk "boink"

**Fasning:** Ljud kan läggas till efter att gameplay verifierats. v1 kan vara tyst.

## Asset-pipeline

| Asset             | Källa                                                                  |
|-------------------|------------------------------------------------------------------------|
| Pokémon-sprites   | PokéAPI (`https://pokeapi.co/api/v2/pokemon/<id>` → `sprites.front_default`) — gen 1, hämtas via build-script |
| Cykel + barn      | FLUX.2-pipeline, side-view prompt (justering av befintlig pipeline)    |
| Hinder            | FLUX.2-pipeline, side-view eller PokéAPI-liknande sprites              |
| Bakgrunder        | FLUX.2-pipeline med parallax-lager-prompt, eller manuella PNGs         |
| Musik & SFX       | Royalty-free (Kevin MacLeod, Freesound) eller egen AI-generering       |

**Sprite-pipeline-justering:** Befintligt `tools/sprites/generate_sprite.py` är top-down. För det här projektet behövs ny trigger-prompt:

```
pixel art sprite, side view, [description], facing right,
filling the entire frame, retro game asset, neutral solid background
```

Kan implementeras antingen som flagga (`--view side`) i existerande script eller som lokalt wrapper-script i `pokemoncykelspel/tools/`.

## Tech-stack

- **Phaser 3.80+** (CDN eller npm-bundlat)
- **Vanilla JavaScript** (TypeScript valfritt; för ett litet projekt är JS snabbare att komma igång med)
- **HTML/CSS** för wrap, meta-tags, PWA-manifest
- **localStorage** för persistens
- **Phaser Sound API** för ljud
- **Static hosting:** lokalt under utveckling. För iPad-installation: deploya på Netlify (gratis) eller kör från lokalt nätverk via t.ex. `python -m http.server`.

## Filstruktur

```
pokemoncykelspel/
├── index.html
├── manifest.json                # PWA: orientation=landscape, name, icons
├── package.json                 # om vi bundlar med esbuild/vite
├── src/
│   ├── main.js                  # Phaser bootstrap
│   ├── scenes/
│   │   ├── PreloaderScene.js
│   │   ├── HomeScene.js         # Startskärm + "Spela!"
│   │   ├── GameScene.js         # Endless runner
│   │   └── StickerBookScene.js  # Bläddra klistermärken
│   ├── data/
│   │   ├── pokemon.js           # Pokémon per biom
│   │   └── biomes.js            # Biom-konfig
│   ├── systems/
│   │   ├── ObstacleSpawner.js
│   │   ├── PokemonSpawner.js
│   │   ├── BiomeManager.js
│   │   └── StickerBook.js       # localStorage wrapper
│   └── utils/
│       └── storage.js
├── assets/
│   ├── pokemon/                 # 1.png, 25.png, etc. (PokéAPI dex-id)
│   ├── characters/              # bike-frame-{0,1,2,3}.png
│   ├── obstacles/
│   ├── backgrounds/             # parallax-lager per biom
│   └── audio/
├── tools/
│   ├── fetch-pokemon-sprites.js # Hämta från PokéAPI
│   └── generate-side-sprite.sh  # Wrapper runt FLUX.2-pipeline
└── docs/
    └── superpowers/specs/       # denna fil bor här
```

## Edge cases & teknik-detaljer

- **iPad tap-delay:** sätt `touch-action: manipulation` på canvas för att eliminera 300ms-fördröjningen
- **Orientation lock:** PWA-manifest + meta-tag, men Safari respekterar inte alltid → fallback är layout som funkar i båda riktningar
- **Network:** offline-first, allt lokalt efter "Add to Home Screen"
- **iPad-versioner:** målgrupp iPad 2018+ med Safari 14+ (täcker alla iPad i hushållet rimligt)
- **Sprite-skalning:** PokéAPI-sprites är 96×96 px, native pixel art. Använd `setScale()` med integer-multipler för att hålla pixel-perfect look
- **Memory:** ladda bara aktivt biom + nästa (om förladdning behövs); ~25 sprites totalt = trivialt

## Acceptanskriterier (för v1)

1. Öppnar `index.html` på iPad → startskärm med "Spela!" + klistermärkesbok-ikon
2. Tryck "Spela!" → cykeln rullar i ett biom inom 1 sekund
3. Tap på skärmen → cykeln hoppar (synlig animation)
4. Cykeln åker förbi en Pokémon → pickup-ljud (om aktivt) + Pokémon visas kort i hörnet
5. Cykeln åker in i ett hinder → mjuk bonk + kort paus → fortsätter (ingen game over)
6. Efter ~30 sekunder byts biom synligt
7. Pokémon registrerade i klistermärkesbok syns på startskärmen efter exit + reload
8. Stäng helt och öppna spelet igen → klistermärken kvarstår

## Etappindelning (för implementation)

Bygg i stigande verifierbarhet — varje etapp ska vara körbar för 3-åringen:

**Etapp 1 — Skelett:** index.html + Phaser + en cykel som rullar mot en statisk bakgrund. **Verify:** öppna i Safari, se cykel rulla.

**Etapp 2 — Hopp + hinder:** tap → hopp; en hindertyp; mjuk kollision. **Verify:** kan hoppa över sten, bonkar mjukt vid kollision.

**Etapp 3 — En Pokémon-typ + auto-pickup + klistermärkesbok-skelett:** en Pokémon spawnas, plockas upp, sparas i localStorage, syns på en debug-skärm. **Verify:** möt Pikachu, ladda om sidan, Pikachu finns kvar.

**Etapp 4 — Tre biomer med rotation:** ~24 Pokémon, biom-byte var 30s, rätt sprites per biom. **Verify:** kör en omgång, mött flera biomer.

**Etapp 5 — Klistermärkesbok-UI:** snygga sidor med silhuetter, bläddra, visa shinies. **Verify:** se boken efter att ha mött några Pokémon.

**Etapp 6 — Shiny-mekanik:** 1/50 chans, egen klistermärke-plats, glittrig pickup-effekt. **Verify:** kör tills shiny dyker upp (eller debug-flagga som tvingar shiny).

**Etapp 7 — Ljud + polish:** bakgrundsmusik, ljudeffekter, övergångsanimation mellan biomer. **Verify:** spela med 3-åringen i 15 minuter, observera reaktion.

## Out of scope (medvetet)

- Konto / cloud sync — familjens iPad, lokalt räcker
- Multispelare / co-op
- "Pokébollar" / fångst-mini-spel — för svårt för 3-åring
- Olika cyklar / customization — sparas till eventuell nivå 3
- Karta / val av biom — slumprotation räcker
- Daily reward / progression — onödig psykologisk hook för en 3-åring
- Föräldraläge / inställningar — inget att ställa in i v1

## Risker

- **Pokémon-licens:** privat bruk OK. Får inte distribueras publikt eller öppen källkod med Pokémon-namn/sprites. Spec gör detta tydligt.
- **Sprite-pipeline för side-view:** befintlig LoRA är tränad på top-down. Side-view-prompt kan ge sämre kvalitet. **Mitigation:** PokéAPI har redan färdiga sprites (front-view, men funkar visuellt i en endless runner som rullar mot åskådaren). FLUX.2-pipelinen behövs egentligen bara för cykel + hinder.
- **iPad Safari touch-respons:** 300ms tap-delay om inte `touch-action: manipulation` sätts. **Mitigation:** sätt direkt i v1.
- **3-åringens upplevelse är okänd förrän testad:** mitigeras genom etapp-vis bygge — etapp 3 räcker för att verifiera att mekaniken funkar innan resten byggs.
