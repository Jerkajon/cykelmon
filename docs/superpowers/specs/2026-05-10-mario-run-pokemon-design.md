# Pokémon Cykelspel — Mario Run-redesign

**Datum:** 2026-05-10
**Författare:** Erik + Claude (brainstorming)
**Status:** Spec — väntar på godkännande innan implementationsplan
**Föregående spec:** [2026-05-09-pokemon-cykelspel-design.md](2026-05-09-pokemon-cykelspel-design.md)

## Syfte

Bygga om nuvarande endless runner till en Super Mario Run-inspirerad platformer med fasta nivåer. Pokémon-jakten är fortfarande spelets enda språk, men strukturen blir nivå-baserad istället för procedurell endless.

**Kärnan i ändringen:** efter att physics-mark-fixen i `678e868` gjorde cyklisten korrekt placerad började Eriks 3-åring spontant spela spelet som platformer ("hoppa över hinder") istället för samlare ("hoppa upp för pokémon"). Detta öppnar för en designförskjutning som matchar barnets faktiska läsning av spelet.

## Bakgrund och kontext

- **Nuvarande spel** är ett endless runner med procedurell spawn av pokémon (i luften) och hinder (på marken). Live på https://jerkajon.github.io/cykelmon/.
- **Befintlig kodbas:** Vite + Phaser 3.90, vanilla JS. 4 systems (ObstacleSpawner, PokemonSpawner, BiomeManager, StickerBook) är ren logik med 27 unit tests. 3 scener (Home, Game, StickerBook).
- **Befintliga assets:** cyklist + 4 cyklar, 4 biom-bakgrunder (Skog/Strand/Grotta/Hav), 4 mark-texturer, 5 hinder-sprites, 3 power-ups, 151 pokémon-sprites, 7 audio-loopar.
- **Asset-pipeline:** FLUX.2 [klein] + Limbicnation pixel-art LoRA via Draw Things på `127.0.0.1:7860`. Wrapper-scripts i `tools/sprites/`.
- **Constraint:** målgrupp är 3-åring. Ingen text-läsning. Inga förlust-skärmar. **Inga placeholders någonsin** — sonen ska kunna testa varje commit Erik playtestar.

## Designval (från brainstorm)

| Beslut | Val | Skäl |
|--------|-----|------|
| Spelstruktur | Discrete levels (rå Mario Run-stil) | Erik:s explicita önskan |
| Pokémon-placering | Hybrid: 1 boss (fixed slut) + 2-3 random | Mario Run "flagga + colored coins"-fit |
| Slut-villkor | Boss-pokémon = flagga | Renaste tema-fit; pokémon-jakt är spelets enda språk |
| Stjärn-system | ★ boss / ★★ + alla random / ★★★ + no-bonk | Tydligt progression-mål utan timer-stress |
| Terräng | Pits med studs-tillbaka | Mario Run-känsla utan fail-frustration |
| Hopp-mekanik | One-tap + auto-vault | ETT input bevarat; auto-vault tar bort "glömde-hoppa"-fail |
| Scope | 12 nivåer (4 världar × 3) | Polish över bredd; sonen klarar på ~3 veckor |
| Befintliga features | Hybrid: behåll power-ups + cyklar + shiny + klistermärkesbok; slopa combo + global score + speed-up | Bevarar 90% av investerad kod; HUD inte överlastad |
| Världskarta | Mario Run-style pixel-map med noder + paths | Mest immersivt; matchar "rå kopia"-mål |
| Asset-strategi | Bulk-generera alla nya assets innan kodning startar | Inga placeholders; ingen blocking under impl |

## Spelloop

```
HomeScene → WorldMapScene → GameScene → ResultScene
                ↑                            ↓
                └────────────────────────────┘
                  (continue / replay / map)
```

1. **Home:** "SPELA"-knapp + klistermärkesbok-access (Pokémon Blue-stil planerad senare; behålls i nuvarande form)
2. **WorldMap:** pixel-art världskarta. Cyklisten står på senaste klarade nod. Klick på nod = starta nivå. Låsta nivåer = hänglås
3. **Game:** ~30-45 s. Auto-rullar åt höger. Plocka pokémon längs vägen, plocka boss vid slutet = klar
4. **Result:** stjärn-räkning (boss / alla / no-bonk), pokémon visad i räknare. "FORTS" → nästa nivå, "MAP" → karta

## Spelmekanik

**Input:** ETT finger-tap någonstans på skärmen
- **Tap på marken** → hopp (fix höjd, ~224 px som nu)
- **Tap i luften** → ignoreras
- **Auto-vault:** små markhinder (rocks/logs) hoppas automatiskt — cyklisten lyfter när hindret är inom ~80 px framför, ingen tap behövs
- **Pokémon-pickup:** automatisk när cykeln passerar (oförändrad)

**Plattformar:**
- Solid: cyklisten kan landa på, falla av kanter
- Inom hopp-räckvidd från mark eller annan plattform (max ~200 px höjd, ~250 px horisontell distans)
- Endast ett plattform-typ i fas 1 (rörliga/fall-igenom-plattformar = senare iteration om behov uppstår)

**Pits:**
- Lucka i marken
- Faller cyklisten i pit → studsar tillbaka till senaste säkra plattform/mark, fortsätter spela
- Visuell konsekvens (skärm-shake + ljud) men ingen "fail"

**Hinder:**
- Befintliga 5 typer (rock, log, puddle, shell, stalagmite) återanvänds
- Auto-vault gör mark-hinder nästan ofarliga (passiv visuell utmaning)
- Hinder kan placeras på plattformar också — där måste de hoppas manuellt

**Bonk:**
- Direkt kollision (tex hinder på plattform man inte hoppat över) → 0.5 s slowdown + camera shake (oförändrat)
- Bonk slår 3-stjärn-kravet "no-bonk"

## Nivå-struktur

**12 nivåer fördelade:** Mario Run-namnkonvention `<world>-<level>`:
- World 1 (Skog): `1-1` / `1-2` / `1-3`
- World 2 (Strand): `2-1` / `2-2` / `2-3`
- World 3 (Grotta): `3-1` / `3-2` / `3-3`
- World 4 (Hav): `4-1` / `4-2` / `4-3`

**Per nivå:**
- 1 **boss-pokémon** vid nivåns slut, fixed pos. Glödande aura. Plocka = nivå klar.
- 2-3 **random pokémon** från biom-pool, placerade på fixed positioner per nivå. Slumpmässig identitet per spelomgång (ur poolen) men positionerna är fixed.
- 0-1 **power-up** placerad på fixed position per nivå (designval per nivå om den ska finnas)
- ~30-45 s spel-tid (mätt vid normalt flyt)

**Stjärn-system:**
- ★ Plockat boss-pokémon (= nivå klar; alla nivåer ger minst 1 stjärna när klarad)
- ★★ + Plockat alla random pokémon i nivån
- ★★★ + Ingen bonk under hela nivån

Stjärnor sparas per nivå i `localStorage`.

**Shiny:** 1/50 chans per pokémon-spawn (oförändrat). Gäller både boss och random — shiny boss = extra speciell.

## Världskarta

**Per värld:**
- Pixel-art bakgrund (1280×720 eller anpassat) i världens stil
- 3 nod-platser med slingrande path mellan dem
- Cyklisten står på senaste klarade nod
- Path till nästa låsta nivå visas dimmad
- Hänglås-overlay på låsta nivåer

**Mellan världar:**
- Ingången till nästa värld låst tills föregående värld har minst 1 stjärna per nivå (3 stjärnor totalt i världen)
- Övergång mellan världar: world-map kan scrolla horisontellt eller via expansion (designval i impl-fas)

**Cyklar unlock-trösklar:**
- Standard cykel: tillgänglig från start
- Röd Racer: ★12 (alla nivåer 1-stjärnade)
- Lila Sväv: ★24 (alla nivåer 2-stjärnade)
- Guld: ★36 (alla nivåer 3-stjärnade — full completion)

## Klistermärkesbok

Befintlig persistens i `localStorage` (`pokemoncykelspel.stickers`) återanvänds.

**Förändring:** ny "level"-sida visas i boken — vilka nivåer klarade, hur många stjärnor. Behålls 4 sidor (Skog/Strand/Grotta + shiny) men utökas med en 5:e sida för level-progression.

**Pokémon-flöde:**
- Plockad pokémon → markeras "seen" i klistermärkesbok (oförändrat)
- Shiny-versioner i egen sida (oförändrat)
- En pokémon kan plockas en gång per nivå-genomspelning (för att räkna stjärnor); klistermärkesbok-status uppdateras vid första pickup någonsin

## Power-ups (in-level)

Två av befintliga 3 power-ups bevaras:
- **Magnet** (3s): drar pokémon mot cyklisten
- **Sköld** (1 hit): absorberar nästa bonk → bevarar no-bonk-status för 3-stjärn

**Slopas:** Dubbla poäng (score-konceptet finns inte längre i level-mode).

**Placering:** fixed position per nivå, designat för att hjälpa just den nivåns 3-stjärn-utmaning. 0-1 power-up per nivå.

## Befintliga features som slopas

- **Combo-system** — 30-45 s nivåer ger inte tid för meningsful combo-bygge
- **Global score + highscore** — ersätts av stjärn-totaler
- **Speed-up over time** — fixed-length nivåer, ej relevant
- **"Dubbla poäng"-power-up** — score-konceptet är borta

## Asset-pipeline

**Nya assets (bulk-genereras innan kod-impl):**

| Asset | Antal | Storlek | Notering |
|-------|-------|---------|----------|
| Plattform-sprites | 4 (Skog/Strand/Grotta/Hav) | 128×24 tileable | Mossig stock / sandig planka / kristall-sten / korall-flotte |
| Världskarta-bakgrunder | 4 (en per värld) | 1280×720 | Pixel-art top-down-ish, stiglinje för 3 nod-platser, världens visuella identitet |

**Genereras via:** befintliga `tools/sprites/generate_bg.py` (utan bg-removal) för world-maps, `tools/sprites/generate_sprite.py` för plattformar.

**UI-element renderas i Phaser/CSS** (inga nya sprites):
- Stjärnor (filled / outline) — kan vara emoji eller pixel-art-text
- Hänglås — pixel-art-text eller emoji
- Level-noder — Phaser-cirkel + nummer
- Boss-glow — Phaser-shader/tween
- HUD-element — Phaser-text + ramar

**Existerande assets återanvänds 1:1:**
cyklist, 4 cyklar, 4 biom-bakgrunder, 4 mark-texturer, 5 hinder-sprites, 3 power-ups, 151 pokémon-sprites, 7 audio-loopar.

## Tech-stack (oförändrad)

- Phaser 3.90 (pinned)
- Vite + vanilla ES-modules JS
- Vitest för logik-tester
- localStorage för persistens
- PWA-manifest för iPad "Add to Home Screen"
- GitHub Actions deploy till GitHub Pages (`Jerkajon/cykelmon`)

## Filstruktur

```
src/
├── main.js                       # oförändrad
├── scenes/
│   ├── HomeScene.js              # oförändrad (Pokémon Blue-redesign separat task)
│   ├── WorldMapScene.js          # NY — pixel-map nivå-väljare
│   ├── GameScene.js              # OMARBETAS — level-data driver spawning
│   ├── ResultScene.js            # NY — stjärn-räkning + nästa-nivå
│   └── StickerBookScene.js       # utökas med level-progress-sida
├── data/
│   ├── pokemon.js                # oförändrad
│   ├── biomes.js                 # oförändrad
│   └── levels.js                 # NY — 12 nivå-definitioner (boss, random spots, power-up, plattformar, hinder, pits)
├── systems/
│   ├── ObstacleSpawner.js        # ANVÄNDS EJ i level-mode (level-data driver istället)
│   ├── PokemonSpawner.js         # ANVÄNDS EJ i level-mode
│   ├── BiomeManager.js           # förenklas — biom väljs av nivån, ingen rotation
│   ├── StickerBook.js            # oförändrad
│   ├── LevelLoader.js            # NY — laddar level-data, instansierar entiteter
│   ├── StarTracker.js            # NY — räknar boss/random/no-bonk per körning
│   └── PlatformPhysics.js        # NY — plattform-collision, pit-detection, studs-tillbaka, auto-vault
└── utils/storage.js              # utökas med level-stars
```

**Save-format-utökning:**
```json
{
  "version": 2,
  "pokemon": { ... },
  "levels": {
    "1-1": { "stars": 2, "completed": true, "shinySeen": false },
    "1-2": { "stars": 0, "completed": false, "shinySeen": false }
  },
  "totalStars": 2,
  "unlockedBikes": ["standard"]
}
```

Migration från v1: gamla `pokemon`-fältet bevaras, `levels` initialiseras tomt, `unlockedBikes` baseras på gamla score-trösklar (om någon nådde dem) eller default `["standard"]`.

## Acceptanskriterier (för v1 av redesign)

1. **WorldMap renderas:** Skog-värld visas med 3 nod-platser, cyklist på första noden, övriga noder synliga men låsta (eller dimmade)
2. **Klick på nod startar nivå:** klick på 1-1 → laddar GameScene med level-data för 1-1
3. **Nivå-genomspel:** cyklist auto-rullar, hoppar auto över markhinder, tap för plattform-hopp, plockar pokémon på vägen
4. **Boss = klar:** plocka boss-pokémon vid nivåns slut → ResultScene visas
5. **Stjärnor räknas korrekt:** ★ för boss / ★★ för alla random / ★★★ för no-bonk
6. **Pit-studs fungerar:** fall i pit → studsar tillbaka till senaste plattform, fortsätter spela
7. **Auto-vault fungerar:** liten sten på marken → cyklisten hoppar automatiskt utan tap
8. **Stjärnor persisteras:** klar 1-1 med ★★ → reload sida → stjärnor kvar
9. **Klistermärkesbok uppdateras:** plockad pokémon i nivå → syns i boken
10. **Inga placeholders:** alla 12 nivåer har riktiga plattform-sprites + alla 4 världar har riktiga world-map-bakgrunder

## Etappindelning (för implementation)

Ungefärlig grovskiss — detaljerad ordning bestäms i implementation-plan-fasen.

**Fas 0 — Asset-bulk:** generera 4 plattform-sprites + 4 world-map-bakgrunder + (ev. uppdaterade boss-glow-effekter). Ingen kod ännu.

**Fas 1 — 1-1 spelbar:** ny GameScene-arkitektur med level-data, PlatformPhysics, StarTracker. Bara 1-1 designad och fungerande. Erik testar med sonen → feedback.

**Fas 2 — WorldMap + Result:** WorldMapScene + ResultScene. 1-1 fullt integrerat i flödet (Map → Level → Result → Map).

**Fas 3 — Skog färdig:** Skog 1-2 + 1-3 designade. Hela Skog-världen spelbar med stjärn-progression.

**Fas 4 — Strand:** 3 strand-nivåer + path-låsning till Strand efter Skog 1-stjärn.

**Fas 5 — Grotta:** 3 grotta-nivåer.

**Fas 6 — Hav:** 3 hav-nivåer. Spelet "klart".

**Fas 7 — Cyklar-unlock + polish:** verifiera alla 4 cyklar låses upp korrekt vid trösklar. Animationer, ljud-finesser, klistermärkesbok-level-sida.

**Fas 8 — Save-migration:** test att gamla v1-saves konverteras korrekt vid första load efter deploy.

Varje fas levererar något testbart för Erik:s son.

## Out of scope (medvetet)

- **Pokémon Blue-startskärm** — separat task, parallell prioritet
- **Animerad cyklist (sprite-sheet)** — separat polish-task
- **Parallax-bakgrund** — separat polish-task
- **Föräldraläge / mute** — separat polish-task
- **Variable jump (hold)** — designval explicit nej
- **Wall-jump / pose-jump** — designval explicit nej
- **Rörliga plattformar / fall-igenom** — kan läggas till om level-design kräver det
- **Multiplayer / leaderboard / cloud-sync** — privat familjespel
- **Bossfight-animationer** — boss = "stor pokémon med glow", ingen attack-mekanik

## Risker

- **Asset-generation tar tid:** 8 nya sprites (4 plattformar + 4 world-maps) via FLUX.2 = ~2-3h jobb. **Mitigation:** Fas 0 fokus enbart på asset-bulk, ingen kod parallellt.
- **World-map pixel-art kan ge ojämn kvalitet:** FLUX.2 är inte tränad på top-down maps, kan kräva flera generations + manuell selection. **Mitigation:** generera flera seeds per värld, välj bästa.
- **PlatformPhysics implementation-komplexitet:** auto-vault + pit-studs-tillbaka är ny mekanik som kräver TDD. **Mitigation:** ren-logik-system (likt existerande spawnertjänster), tester först.
- **Level-design balanseras inte rätt för 3-åring:** för svår eller för lätt. **Mitigation:** Erik testar 1-1 efter fas 1, justerar svårighet innan resten byggs.
- **Save-migration breaks existing data:** sonen tappar nuvarande klistermärken. **Mitigation:** v2-migration testas explicit (acceptanskriterium 8), behåller `pokemon`-fältet intakt.
- **HUD-överlast trots hybrid-val:** även med slopad combo + score kan power-up-timer + pokémon-räknare bli mycket på liten iPad-skärm. **Mitigation:** verifiera HUD-läsbarhet i fas 1 på riktig iPad.

## Beslut att lyfta i implementation-planning

Detaljer som inte avgjordes i brainstorm men behövs i plan-fasen:

- **Exakt nivå-design för 1-1** (boss-pokémon-id, random-spots, plattform-positioner, hinder-positioner, pit-positioner, power-up-position) — designas i fas 1
- **Pit-rendering** — bara mörker eller spikes-look?
- **Boss-glow-effekt** — Phaser-tween, partikel-system, eller shader?
- **Path-rendering på world-map** — del av bakgrunden eller Phaser-overlay?
- **Cykel-val-UI** — hur byter sonen cykel? Ny scen eller modal i WorldMap?
- **Audio:** behövs nya SFX för nivå-klar, stjärna-gained, boss-pickup?
