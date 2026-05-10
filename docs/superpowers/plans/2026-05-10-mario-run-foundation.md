# Mario Run-redesign — Foundation (Fas 0–2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygga fundament för Mario Run-redesignen: bulk-generera 8 nya assets, refaktorera GameScene till level-data-driven arkitektur, lägga till `WorldMapScene` + `ResultScene`, och leverera Skog 1-1 fullt spelbar (slutkänsla: tap nod på världskartan → kör nivån → plocka boss → se stjärnor → tillbaka till kartan).

**Architecture:** Tre nya ren-logik-system (`LevelLoader`, `StarTracker`, `PlatformPhysics`) som TDD:as separat. `GameScene` skrivs om från RNG-spawning till level-data-driven entitet-spawning. Två nya scener (`WorldMapScene`, `ResultScene`) integrerar level-flödet. Befintlig `StickerBook`, `BiomeManager`, sprite-pipeline och 90% av asset-katalogen återanvänds 1:1.

**Tech Stack:** Phaser 3.90 (pinned), Vite, vanilla ES-modules JS, Vitest för logik. Assets via FLUX.2 [klein] + Limbicnation pixel-art LoRA på Draw Things `127.0.0.1:7860`. localStorage för persistens.

**Spec:** [docs/superpowers/specs/2026-05-10-mario-run-pokemon-design.md](../specs/2026-05-10-mario-run-pokemon-design.md)

**Out of scope för denna plan (kommer i uppföljnings-plan):**
- Nivå-design för 1-2 / 1-3 / Strand / Grotta / Hav (totalt 11 nivåer)
- Cyklar unlock-trösklar verifiering
- Stickerbook level-progress-sida
- Save-migration från v1 till v2
- Audio nya SFX (nivå-klar, stjärna, boss-pickup)

Erik testar Skog 1-1 efter denna plan, justerar svårighet innan resten byggs.

---

## File Structure

**Nya filer:**
- `tools/sprites/prompts/platforms.txt` — prompts för 4 plattform-sprites
- `tools/sprites/prompts/worldmaps.txt` — prompts för 4 world-map-bakgrunder
- `assets/platforms/forest.png` (128×24)
- `assets/platforms/beach.png` (128×24)
- `assets/platforms/cave.png` (128×24)
- `assets/platforms/ocean.png` (128×24)
- `assets/worldmaps/forest.png` (1280×720)
- `assets/worldmaps/beach.png` (1280×720)
- `assets/worldmaps/cave.png` (1280×720)
- `assets/worldmaps/ocean.png` (1280×720)
- `src/data/levels.js` — definition för 12 nivåer (1-1 fullt designad, 1-2 till 4-3 stub)
- `src/scenes/WorldMapScene.js`
- `src/scenes/ResultScene.js`
- `src/systems/LevelLoader.js`
- `src/systems/StarTracker.js`
- `src/systems/PlatformPhysics.js`
- `tests/LevelLoader.test.js`
- `tests/StarTracker.test.js`
- `tests/PlatformPhysics.test.js`

**Modifierade filer:**
- `src/main.js` — registrera `WorldMapScene` + `ResultScene` i scene-listan
- `src/scenes/HomeScene.js` — peka mot `WorldMapScene` istället för direkt `GameScene`
- `src/scenes/GameScene.js` — refaktor till level-data-driven, slopa RNG-spawners
- `src/utils/storage.js` — utöka med `levelStars`-helper

---

## Fas 0 — Asset bulk-generation

**Beroende:** Draw Things måste vara igång på `127.0.0.1:7860` med FLUX.2 [klein] 4B + Limbicnation pixel-art LoRA aktiverad.

### Task 0.1: Skapa prompt-filer

**Files:**
- Create: `tools/sprites/prompts/platforms.txt`
- Create: `tools/sprites/prompts/worldmaps.txt`

- [ ] **Step 1: Skapa platforms.txt med 4 prompts**

```
# tools/sprites/prompts/platforms.txt
# Format: <world>|<prompt>
# Generera med: python tools/sprites/generate_bg.py --prompt "<prompt>" --width 128 --height 24 --seed 42 --out assets/platforms/<world>.png
forest|pixel art platform sprite, side view, mossy wooden log, green moss on top edge, brown bark side, transparent background, retro game asset, filling the entire frame
beach|pixel art platform sprite, side view, weathered wooden plank with sand on top, scattered tiny seashells on top edge, pale wood side, transparent background, retro game asset
cave|pixel art platform sprite, side view, dark gray stone block with glowing blue crystals on top edge, jagged stone texture on side, transparent background, retro game asset
ocean|pixel art platform sprite, side view, coral platform with seaweed on top edge, pink and orange coral side, transparent background, retro game asset
```

- [ ] **Step 2: Skapa worldmaps.txt med 4 prompts**

```
# tools/sprites/prompts/worldmaps.txt
# Format: <world>|<prompt>
# Generera med: python tools/sprites/generate_bg.py --prompt "<prompt>" --width 1280 --height 720 --seed 42 --out assets/worldmaps/<world>.png
forest|pixel art world map background, top-down view of lush green forest with winding stone path, three clearings along the path for level nodes, small trees and flowers, soft sunlight, retro adventure game style, no characters, no text
beach|pixel art world map background, top-down view of sandy tropical beach with palm trees, winding sand path with three clearings, ocean waves on one side, retro adventure game style, no characters, no text
cave|pixel art world map background, top-down view of dark cave system with glowing crystals, winding stone path with three clearings, dim torchlight, mossy walls, retro adventure game style, no characters, no text
ocean|pixel art world map background, top-down view of small island archipelago with sandbars and coral, winding sea path with three island clearings, gentle waves, retro adventure game style, no characters, no text
```

- [ ] **Step 3: Commit prompt-filer**

```bash
git add tools/sprites/prompts/
git commit -m "tools: prompts för plattform-sprites + world-map-bakgrunder"
```

### Task 0.2: Generera plattform-sprites

**Files:**
- Create: `assets/platforms/forest.png`, `beach.png`, `cave.png`, `ocean.png`

- [ ] **Step 1: Skapa target-mapp**

```bash
mkdir -p assets/platforms
```

- [ ] **Step 2: Generera alla 4 plattformar parallellt**

Kör 4 parallella subagent-dispatches eller manuella körningar:

```bash
# Forest
python tools/sprites/generate_bg.py \
  --prompt "pixel art platform sprite, side view, mossy wooden log, green moss on top edge, brown bark side, transparent background, retro game asset, filling the entire frame" \
  --width 128 --height 24 --seed 42 \
  --out assets/platforms/forest.png

# Beach
python tools/sprites/generate_bg.py \
  --prompt "pixel art platform sprite, side view, weathered wooden plank with sand on top, scattered tiny seashells on top edge, pale wood side, transparent background, retro game asset" \
  --width 128 --height 24 --seed 42 \
  --out assets/platforms/beach.png

# Cave
python tools/sprites/generate_bg.py \
  --prompt "pixel art platform sprite, side view, dark gray stone block with glowing blue crystals on top edge, jagged stone texture on side, transparent background, retro game asset" \
  --width 128 --height 24 --seed 42 \
  --out assets/platforms/cave.png

# Ocean
python tools/sprites/generate_bg.py \
  --prompt "pixel art platform sprite, side view, coral platform with seaweed on top edge, pink and orange coral side, transparent background, retro game asset" \
  --width 128 --height 24 --seed 42 \
  --out assets/platforms/ocean.png
```

- [ ] **Step 3: Verifiera visuellt**

Öppna alla 4 PNGs i Preview/macOS. Kontrollera att:
- Plattformen är sidovy (inte top-down)
- Övre kanten är tydligt distinkt (för cyklist-landning)
- Bakgrund är ren transparent eller solid neutral (ej clutter)
- Stilen är konsekvent (samma pixel-storlek-känsla mellan alla 4)

Om någon ser fel: kör om med ny seed (43, 44, 45, 46) tills bra. Generation-tid: ~30s per sprite × 4 = ~2 min plus iterations.

- [ ] **Step 4: Commit plattform-sprites**

```bash
git add assets/platforms/
git commit -m "art: 4 plattform-sprites (forest/beach/cave/ocean)"
```

### Task 0.3: Generera world-map-bakgrunder

**Files:**
- Create: `assets/worldmaps/forest.png`, `beach.png`, `cave.png`, `ocean.png`

- [ ] **Step 1: Skapa target-mapp**

```bash
mkdir -p assets/worldmaps
```

- [ ] **Step 2: Generera alla 4 world-maps**

```bash
# Forest
python tools/sprites/generate_bg.py \
  --prompt "pixel art world map background, top-down view of lush green forest with winding stone path, three clearings along the path for level nodes, small trees and flowers, soft sunlight, retro adventure game style, no characters, no text" \
  --width 1280 --height 720 --seed 42 \
  --out assets/worldmaps/forest.png

# Beach
python tools/sprites/generate_bg.py \
  --prompt "pixel art world map background, top-down view of sandy tropical beach with palm trees, winding sand path with three clearings, ocean waves on one side, retro adventure game style, no characters, no text" \
  --width 1280 --height 720 --seed 42 \
  --out assets/worldmaps/beach.png

# Cave
python tools/sprites/generate_bg.py \
  --prompt "pixel art world map background, top-down view of dark cave system with glowing crystals, winding stone path with three clearings, dim torchlight, mossy walls, retro adventure game style, no characters, no text" \
  --width 1280 --height 720 --seed 42 \
  --out assets/worldmaps/cave.png

# Ocean
python tools/sprites/generate_bg.py \
  --prompt "pixel art world map background, top-down view of small island archipelago with sandbars and coral, winding sea path with three island clearings, gentle waves, retro adventure game style, no characters, no text" \
  --width 1280 --height 720 --seed 42 \
  --out assets/worldmaps/ocean.png
```

- [ ] **Step 3: Verifiera visuellt — viktigare än plattformar**

Öppna alla 4 PNGs. Kontrollera:
- Slingrande "stig" är synlig (nod-platser kommer placeras manuellt på path)
- Tre öppna platser längs stigen är någorlunda synliga (där noder kommer ligga)
- Stilen matchar världens visual identity (forest = grönt, beach = sand+blått, cave = mörkt+kristaller, ocean = öar+vatten)
- Inga texter eller karaktärer i bakgrunden
- Stilen är konsekvent mellan alla 4

World-maps är svårare för FLUX.2 — top-down maps är inte LoRA:ns starkaste sida. Förvänta 2-4 iterations per värld med olika seeds (42-50). Bra approach: generera 2 seeds per värld parallellt och välj bäst.

- [ ] **Step 4: Commit world-maps**

```bash
git add assets/worldmaps/
git commit -m "art: 4 world-map-bakgrunder (forest/beach/cave/ocean)"
```

---

## Fas 1 — Architecture refactor + Skog 1-1 spelbar

### Task 1.1: Definiera level-data-format i `src/data/levels.js`

**Files:**
- Create: `src/data/levels.js`

- [ ] **Step 1: Skapa `src/data/levels.js` med Skog 1-1 fullt designad + stubs för 1-2..4-3**

```javascript
// src/data/levels.js
//
// Level-data-format:
// {
//   id: "1-1",                 // Mario Run-stil world-level
//   worldId: "forest",          // matchar BIOMES[].id
//   name: "1-1",                // display
//   length: 4800,               // total horisontell längd i pixlar (cyklist startar på x=200, mål boss vid length-200)
//   bossPokemonId: 25,          // Pikachu — fixed boss vid x ~ length-200
//   randomCount: 3,             // antal random pokémon-spots i denna nivå
//   randomSpots: [              // x-positioner för random pokémon
//     { x: 800, y: 400 },
//     { x: 1800, y: 350 },
//     { x: 3200, y: 380 }
//   ],
//   platforms: [                // x, y, width (höjd är fixed 24px)
//     { x: 700, y: 420, width: 256 },
//     { x: 1700, y: 380, width: 256 },
//     { x: 2400, y: 350, width: 256 },
//     { x: 3100, y: 400, width: 256 }
//   ],
//   pits: [                     // x-start, x-end (gaps i marken)
//     { xStart: 1200, xEnd: 1500 },
//     { xStart: 2700, xEnd: 2950 }
//   ],
//   obstacles: [                // x, type — placeras på marken eller plattformar
//     { x: 1100, y: 'ground', type: 'rock' },
//     { x: 2200, y: 'ground', type: 'log' }
//   ],
//   powerUp: { x: 1750, y: 320, type: 'shield' }   // 0-1 power-up per nivå (kan vara null)
// }

const FOREST_1_1 = {
  id: '1-1',
  worldId: 'forest',
  name: '1-1',
  length: 4800,
  bossPokemonId: 25,
  randomCount: 3,
  randomSpots: [
    { x: 800, y: 400 },
    { x: 1800, y: 350 },
    { x: 3200, y: 380 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
    { x: 2400, y: 350, width: 256 },
    { x: 3100, y: 400, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
    { xStart: 2700, xEnd: 2950 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
    { x: 2200, y: 'ground', type: 'log' },
  ],
  powerUp: { x: 1750, y: 320, type: 'shield' },
};

// Stubs för resterande 11 nivåer — designas i uppföljnings-plan
const stubLevel = (id, worldId) => ({
  id,
  worldId,
  name: id,
  length: 4800,
  bossPokemonId: null,
  randomCount: 0,
  randomSpots: [],
  platforms: [],
  pits: [],
  obstacles: [],
  powerUp: null,
});

export const LEVELS = [
  FOREST_1_1,
  stubLevel('1-2', 'forest'),
  stubLevel('1-3', 'forest'),
  stubLevel('2-1', 'beach'),
  stubLevel('2-2', 'beach'),
  stubLevel('2-3', 'beach'),
  stubLevel('3-1', 'cave'),
  stubLevel('3-2', 'cave'),
  stubLevel('3-3', 'cave'),
  stubLevel('4-1', 'ocean'),
  stubLevel('4-2', 'ocean'),
  stubLevel('4-3', 'ocean'),
];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id);
}

export function levelsByWorld(worldId) {
  return LEVELS.filter((l) => l.worldId === worldId);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/levels.js
git commit -m "data: level-format + Skog 1-1 design"
```

### Task 1.2: TDD `LevelLoader`

**Files:**
- Create: `src/systems/LevelLoader.js`
- Test: `tests/LevelLoader.test.js`

`LevelLoader` är en ren-logik-class som tar level-data och exponerar query-funktioner för GameScene (vilka entiteter ska existera vid given x-position, är cyklisten i ett pit, vilken plattform står den på).

- [ ] **Step 1: Skriv failing test**

```javascript
// tests/LevelLoader.test.js
import { describe, it, expect } from 'vitest';
import { LevelLoader } from '../src/systems/LevelLoader.js';

const SAMPLE_LEVEL = {
  id: '1-1',
  worldId: 'forest',
  name: '1-1',
  length: 4800,
  bossPokemonId: 25,
  randomCount: 2,
  randomSpots: [
    { x: 800, y: 400 },
    { x: 1800, y: 350 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
  ],
  powerUp: { x: 1750, y: 320, type: 'shield' },
};

describe('LevelLoader', () => {
  it('exponerar level-id och längd', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.id).toBe('1-1');
    expect(loader.length).toBe(4800);
  });

  it('returnerar boss-position vid nivåns slut', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    const boss = loader.bossPosition();
    expect(boss.x).toBe(4600); // length - 200
    expect(boss.pokemonId).toBe(25);
  });

  it('returnerar alla plattformar', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.platforms()).toHaveLength(2);
    expect(loader.platforms()[0].x).toBe(700);
  });

  it('returnerar alla pits', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.pits()).toHaveLength(1);
    expect(loader.pits()[0].xStart).toBe(1200);
  });

  it('isInPit returnerar true om x är inom ett pit', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.isInPit(1300)).toBe(true);
    expect(loader.isInPit(1100)).toBe(false);
    expect(loader.isInPit(1500)).toBe(false); // exclusive end
  });

  it('returnerar random-pokémon-spots', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.randomSpots()).toHaveLength(2);
  });

  it('returnerar power-up eller null', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.powerUp().type).toBe('shield');

    const noPowerLevel = { ...SAMPLE_LEVEL, powerUp: null };
    expect(new LevelLoader(noPowerLevel).powerUp()).toBeNull();
  });

  it('returnerar alla obstacles', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.obstacles()).toHaveLength(1);
    expect(loader.obstacles()[0].type).toBe('rock');
  });
});
```

- [ ] **Step 2: Kör test, verifiera FAIL**

```bash
npx vitest run tests/LevelLoader.test.js
```

Expected: FAIL med "Cannot find module '../src/systems/LevelLoader.js'"

- [ ] **Step 3: Skriv minimal implementation**

```javascript
// src/systems/LevelLoader.js
export class LevelLoader {
  constructor(levelData) {
    this.data = levelData;
    this.id = levelData.id;
    this.length = levelData.length;
  }

  bossPosition() {
    return {
      x: this.length - 200,
      y: 'ground',
      pokemonId: this.data.bossPokemonId,
    };
  }

  platforms() {
    return this.data.platforms;
  }

  pits() {
    return this.data.pits;
  }

  isInPit(x) {
    return this.data.pits.some((p) => x >= p.xStart && x < p.xEnd);
  }

  randomSpots() {
    return this.data.randomSpots;
  }

  powerUp() {
    return this.data.powerUp || null;
  }

  obstacles() {
    return this.data.obstacles;
  }
}
```

- [ ] **Step 4: Kör test, verifiera PASS**

```bash
npx vitest run tests/LevelLoader.test.js
```

Expected: 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/systems/LevelLoader.js tests/LevelLoader.test.js
git commit -m "feat: LevelLoader — query-funktioner för level-data"
```

### Task 1.3: TDD `StarTracker`

**Files:**
- Create: `src/systems/StarTracker.js`
- Test: `tests/StarTracker.test.js`

`StarTracker` räknar boss-pickup, random-pokémon-pickups, och bonk-events under en spelomgång och returnerar antal stjärnor (0-3) baserat på spec-kriterierna: ★ boss / ★★ + alla random / ★★★ + no-bonk.

- [ ] **Step 1: Skriv failing test**

```javascript
// tests/StarTracker.test.js
import { describe, it, expect } from 'vitest';
import { StarTracker } from '../src/systems/StarTracker.js';

describe('StarTracker', () => {
  it('startar med 0 stjärnor', () => {
    const t = new StarTracker({ randomCount: 3 });
    expect(t.computeStars()).toBe(0);
  });

  it('ger 1 stjärna när boss plockad', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    expect(t.computeStars()).toBe(1);
  });

  it('ger 2 stjärnor när boss + alla random plockade', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(2);
  });

  it('ger 3 stjärnor när boss + alla random + ingen bonk', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(3);
  });

  it('reducerar stjärnor till 2 om bonk skedde efter alla pickups', () => {
    const t = new StarTracker({ randomCount: 2 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordBonk();
    expect(t.computeStars()).toBe(2);
  });

  it('reducerar till 1 stjärna om missing random + ingen bonk', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    // 1 random saknas — kan inte få 3
    expect(t.computeStars()).toBe(1);
  });

  it('ger fortfarande 0 om boss inte plockad även med alla random', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(0);
  });

  it('flera bonkar räknas inte mer än en (no-bonk är binär)', () => {
    const t = new StarTracker({ randomCount: 1 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordBonk();
    t.recordBonk();
    expect(t.computeStars()).toBe(2);
  });
});
```

- [ ] **Step 2: Kör test, verifiera FAIL**

```bash
npx vitest run tests/StarTracker.test.js
```

Expected: FAIL med "Cannot find module"

- [ ] **Step 3: Skriv implementation**

```javascript
// src/systems/StarTracker.js
export class StarTracker {
  constructor({ randomCount }) {
    this.randomCount = randomCount;
    this.bossPicked = false;
    this.randomPickedCount = 0;
    this.bonked = false;
  }

  recordBossPickup() {
    this.bossPicked = true;
  }

  recordRandomPickup() {
    this.randomPickedCount += 1;
  }

  recordBonk() {
    this.bonked = true;
  }

  computeStars() {
    if (!this.bossPicked) return 0;
    let stars = 1;
    if (this.randomPickedCount >= this.randomCount) stars = 2;
    if (stars === 2 && !this.bonked) stars = 3;
    return stars;
  }
}
```

- [ ] **Step 4: Kör test, verifiera PASS**

```bash
npx vitest run tests/StarTracker.test.js
```

Expected: 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/systems/StarTracker.js tests/StarTracker.test.js
git commit -m "feat: StarTracker — räknar stjärnor per nivå-genomspelning"
```

### Task 1.4: TDD `PlatformPhysics`

**Files:**
- Create: `src/systems/PlatformPhysics.js`
- Test: `tests/PlatformPhysics.test.js`

`PlatformPhysics` är ren-logik (ingen Phaser) som hanterar tre check-funktioner: vill cyklisten auto-vault:a (small obstacle ahead), är den över ett pit, vilken plattform står den på.

- [ ] **Step 1: Skriv failing test**

```javascript
// tests/PlatformPhysics.test.js
import { describe, it, expect } from 'vitest';
import { PlatformPhysics } from '../src/systems/PlatformPhysics.js';

const SAMPLE_LEVEL = {
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
  ],
};

describe('PlatformPhysics', () => {
  describe('shouldAutoVault', () => {
    it('triggar auto-vault när cyklist är ~80px från obstacle på marken', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      // cyklist på x=1020, hinder på x=1100 → distance=80
      expect(p.shouldAutoVault(1020, 'ground')).toBe(true);
    });

    it('triggar inte auto-vault om för långt bort', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.shouldAutoVault(900, 'ground')).toBe(false);
    });

    it('triggar inte auto-vault om cyklist redan är förbi hindret', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.shouldAutoVault(1150, 'ground')).toBe(false);
    });

    it('triggar inte auto-vault om cyklist är på en plattform', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      // Hinder på marken är inte i vägen om cyklist är på plattform
      expect(p.shouldAutoVault(1020, 420)).toBe(false);
    });
  });

  describe('isOverPit', () => {
    it('true när x är inom pit', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.isOverPit(1300)).toBe(true);
    });

    it('false när x är utanför pit', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.isOverPit(1100)).toBe(false);
      expect(p.isOverPit(1600)).toBe(false);
    });
  });

  describe('platformAt', () => {
    it('returnerar plattform när cyklist är över den', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      const plat = p.platformAt(800);
      expect(plat).not.toBeNull();
      expect(plat.x).toBe(700);
    });

    it('returnerar null när cyklist inte är över någon plattform', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.platformAt(500)).toBeNull();
    });

    it('hanterar plattform-bredd korrekt (x within [start, start+width])', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.platformAt(956)).not.toBeNull(); // 700+256=956 inclusive
      expect(p.platformAt(957)).toBeNull();
    });
  });

  describe('lastSafePlatformBefore', () => {
    it('returnerar närmaste plattform till vänster om x', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      const last = p.lastSafePlatformBefore(1300);
      expect(last.x).toBe(700); // pit:et är vid 1200-1500, plattformen vid 700 är senaste säkra
    });

    it('returnerar null om ingen plattform finns före x', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.lastSafePlatformBefore(500)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Kör test, verifiera FAIL**

```bash
npx vitest run tests/PlatformPhysics.test.js
```

Expected: FAIL med "Cannot find module"

- [ ] **Step 3: Skriv implementation**

```javascript
// src/systems/PlatformPhysics.js
const AUTO_VAULT_TRIGGER_DISTANCE = 80;

export class PlatformPhysics {
  constructor({ platforms, pits, obstacles }) {
    this.platforms = platforms;
    this.pits = pits;
    this.obstacles = obstacles;
  }

  shouldAutoVault(bikeX, bikeY) {
    if (bikeY !== 'ground') return false;
    return this.obstacles.some((o) => {
      if (o.y !== 'ground') return false;
      const distance = o.x - bikeX;
      return distance > 0 && distance <= AUTO_VAULT_TRIGGER_DISTANCE;
    });
  }

  isOverPit(x) {
    return this.pits.some((p) => x >= p.xStart && x < p.xEnd);
  }

  platformAt(x) {
    return this.platforms.find((p) => x >= p.x && x <= p.x + p.width) || null;
  }

  lastSafePlatformBefore(x) {
    const candidates = this.platforms.filter((p) => p.x + p.width < x);
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, p) => (p.x > latest.x ? p : latest));
  }
}
```

- [ ] **Step 4: Kör test, verifiera PASS**

```bash
npx vitest run tests/PlatformPhysics.test.js
```

Expected: 10 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/systems/PlatformPhysics.js tests/PlatformPhysics.test.js
git commit -m "feat: PlatformPhysics — auto-vault, pit-detection, plattform-collision"
```

### Task 1.5: Storage-utökning för level-stars

**Files:**
- Modify: `src/utils/storage.js`

- [ ] **Step 1: Lägg till helper-funktioner för level-stars**

Notera: `createStorage()` är generisk JSON store. Vi lägger till specifika helpers för level-stars-keyen `pokemoncykelspel.levels`.

```javascript
// src/utils/storage.js — lägg till i botten av filen efter befintlig kod

const LEVELS_KEY = 'pokemoncykelspel.levels';
const TOTAL_STARS_KEY = 'pokemoncykelspel.totalStars';
const UNLOCKED_BIKES_KEY = 'pokemoncykelspel.unlockedBikes';

export function getLevelStars(storage, levelId) {
  const all = storage.get(LEVELS_KEY) || {};
  return all[levelId]?.stars ?? 0;
}

export function setLevelStars(storage, levelId, stars) {
  const all = storage.get(LEVELS_KEY) || {};
  const prev = all[levelId] || { stars: 0, completed: false, shinySeen: false };
  all[levelId] = {
    ...prev,
    stars: Math.max(prev.stars, stars), // never decrease
    completed: stars > 0 || prev.completed,
  };
  storage.set(LEVELS_KEY, all);

  // Update totalStars (sum of best stars per level)
  const total = Object.values(all).reduce((sum, l) => sum + (l.stars || 0), 0);
  storage.set(TOTAL_STARS_KEY, total);
}

export function getAllLevelStars(storage) {
  return storage.get(LEVELS_KEY) || {};
}

export function getTotalStars(storage) {
  return storage.get(TOTAL_STARS_KEY) || 0;
}

export function getUnlockedBikes(storage) {
  return storage.get(UNLOCKED_BIKES_KEY) || ['standard'];
}

export function unlockBike(storage, bikeId) {
  const bikes = getUnlockedBikes(storage);
  if (!bikes.includes(bikeId)) {
    bikes.push(bikeId);
    storage.set(UNLOCKED_BIKES_KEY, bikes);
  }
}
```

- [ ] **Step 2: Skriv failing test**

```javascript
// tests/storage.test.js — NEW FILE
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStorage,
  memoryBackend,
  getLevelStars,
  setLevelStars,
  getTotalStars,
  getUnlockedBikes,
  unlockBike,
} from '../src/utils/storage.js';

describe('storage helpers — level-stars', () => {
  let storage;

  beforeEach(() => {
    storage = createStorage(memoryBackend());
  });

  it('getLevelStars returnerar 0 för okänd nivå', () => {
    expect(getLevelStars(storage, '1-1')).toBe(0);
  });

  it('setLevelStars persisterar och returneras av getLevelStars', () => {
    setLevelStars(storage, '1-1', 2);
    expect(getLevelStars(storage, '1-1')).toBe(2);
  });

  it('setLevelStars sänker inte från högre stjärn-värde', () => {
    setLevelStars(storage, '1-1', 3);
    setLevelStars(storage, '1-1', 1);
    expect(getLevelStars(storage, '1-1')).toBe(3);
  });

  it('totalStars summerar över alla nivåer', () => {
    setLevelStars(storage, '1-1', 2);
    setLevelStars(storage, '1-2', 3);
    expect(getTotalStars(storage)).toBe(5);
  });

  it('getUnlockedBikes returnerar standard som default', () => {
    expect(getUnlockedBikes(storage)).toEqual(['standard']);
  });

  it('unlockBike lägger till ny cykel utan duplicering', () => {
    unlockBike(storage, 'redRacer');
    unlockBike(storage, 'redRacer');
    expect(getUnlockedBikes(storage)).toEqual(['standard', 'redRacer']);
  });
});
```

- [ ] **Step 3: Kör test, verifiera PASS (implementation redan klar i Step 1)**

```bash
npx vitest run tests/storage.test.js
```

Expected: 6 tests passing.

- [ ] **Step 4: Commit**

```bash
git add src/utils/storage.js tests/storage.test.js
git commit -m "feat: storage helpers för level-stars + bike-unlock"
```

### Task 1.6: Refaktor GameScene — börja med scene-init

**Files:**
- Modify: `src/scenes/GameScene.js`

GameScene refaktoreras inkrementellt. Steg 1-6 i denna task gör grundskelettet — tar `levelId` via init-data, instansierar `LevelLoader` + `StarTracker` + `PlatformPhysics`. Spawner-systemen tas bort. Resten av rendering (plattformar, pits, etc.) i nästa tasks.

- [ ] **Step 1: Läs befintlig `GameScene.js`**

Bekanta dig med befintlig struktur — vi behöver radera ObstacleSpawner/PokemonSpawner-användning och ersätta med level-data.

```bash
wc -l src/scenes/GameScene.js
# ~731 lines
```

- [ ] **Step 2: Lägg till imports + ändra init**

I toppen av filen:

```javascript
import Phaser from 'phaser';
import { levelById } from '../data/levels.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { StarTracker } from '../systems/StarTracker.js';
import { PlatformPhysics } from '../systems/PlatformPhysics.js';
import { biomeById } from '../data/biomes.js';
// ... behåll existerande imports som behövs (StickerBook, pokemonByBiome, etc.)
// Ta bort: ObstacleSpawner, PokemonSpawner, BiomeManager (om bara används för rotation)
```

I `init` (eller skapa om saknas):

```javascript
init(data) {
  this.levelId = data.levelId || '1-1';
  const levelData = levelById(this.levelId);
  if (!levelData) {
    console.error(`Level ${this.levelId} not found, defaulting to 1-1`);
    this.levelLoader = new LevelLoader(levelById('1-1'));
  } else {
    this.levelLoader = new LevelLoader(levelData);
  }
  this.biome = biomeById(this.levelLoader.data.worldId);
  this.starTracker = new StarTracker({ randomCount: this.levelLoader.data.randomCount });
  this.platformPhysics = new PlatformPhysics({
    platforms: this.levelLoader.platforms(),
    pits: this.levelLoader.pits(),
    obstacles: this.levelLoader.obstacles(),
  });
}
```

- [ ] **Step 3: Verifiera build**

```bash
npm run dev
# Öppna http://localhost:5173, kontrollera att ingen runtime-error vid load
# Spelet kan ha visuella problem nu — det fixar vi i nästa tasks
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "refactor(GameScene): init med levelId + LevelLoader/StarTracker/PlatformPhysics"
```

### Task 1.7: GameScene preload + create — biom-bg + plattformar

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: I `preload()`, lägg till plattform-sprite för aktuell värld**

Notera: existerande `preload()` laddar redan biom-bakgrunder. Vi lägger till plattform-sprite per värld.

```javascript
preload() {
  // ... befintliga preloads ...

  // NY: plattform-sprite för alla 4 världar (vi kan ladda alla, ~few KB var)
  this.load.image('platform-forest', 'assets/platforms/forest.png');
  this.load.image('platform-beach', 'assets/platforms/beach.png');
  this.load.image('platform-cave', 'assets/platforms/cave.png');
  this.load.image('platform-ocean', 'assets/platforms/ocean.png');
}
```

- [ ] **Step 2: I `create()`, render plattformar enligt level-data**

Hitta sektionen i `create()` där world bounds + ground sätts upp. Ändra `this.physics.world.setBounds(0, 0, ...)` till att använda `this.levelLoader.length`:

```javascript
create() {
  // World bounds använder level-length
  this.physics.world.setBounds(0, 0, this.levelLoader.length, 600);
  this.cameras.main.setBounds(0, 0, this.levelLoader.length, 600);

  // ... biom-bakgrund (befintlig)

  // NY: rendera plattformar
  this.platforms = this.physics.add.staticGroup();
  const platformKey = `platform-${this.biome.id}`;
  this.levelLoader.platforms().forEach((p) => {
    const tilesNeeded = Math.ceil(p.width / 128);
    for (let i = 0; i < tilesNeeded; i++) {
      const platformTile = this.platforms.create(p.x + i * 128, p.y, platformKey);
      platformTile.setOrigin(0, 0);
      platformTile.setDisplaySize(128, 24);
      platformTile.refreshBody();
    }
  });

  // ... resten av create()
}
```

- [ ] **Step 3: Verifiera visuellt**

```bash
npm run dev
# Öppna http://localhost:5173, navigate till Skog 1-1 (sätt levelId='1-1' direkt i HomeScene tillfälligt om World Map inte byggd än)
# Kontrollera: 4 plattformar synliga vid x=700, 1700, 2400, 3100
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(GameScene): rendera plattformar enligt level-data"
```

### Task 1.8: GameScene — pits + cyklist physics-collision med plattformar

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Lägg till plattform-collision för cyklisten**

I `create()`, efter att both `this.bike` (cyklisten) och `this.platforms` finns:

```javascript
this.physics.add.collider(this.bike, this.platforms);
```

- [ ] **Step 2: Rendera pits visuellt — markens texture klipps**

I `create()`, ground/mark-sektionen:

```javascript
// Ground: rita som tile-strip MEN med pits utelämnade
const ground = this.add.tileSprite(0, 540, this.levelLoader.length, 60, `ground-${this.biome.id}`);
ground.setOrigin(0, 0);

// Mörka pits ovanpå (visuellt)
this.levelLoader.pits().forEach((pit) => {
  const pitWidth = pit.xEnd - pit.xStart;
  const pitGfx = this.add.graphics();
  pitGfx.fillStyle(0x000000, 1);
  pitGfx.fillRect(pit.xStart, 540, pitWidth, 60);
});

// Ground physics: en static body, MEN med "hål" där pits finns
// Phaser har inte native pit-i-static-group så vi gör en ground-rect per ground-segment mellan pits
this.groundBodies = this.physics.add.staticGroup();
let prevEnd = 0;
this.levelLoader.pits().forEach((pit) => {
  if (pit.xStart > prevEnd) {
    const segWidth = pit.xStart - prevEnd;
    const seg = this.groundBodies.create(prevEnd + segWidth / 2, 570, null);
    seg.setVisible(false);
    seg.setSize(segWidth, 60);
    seg.refreshBody();
  }
  prevEnd = pit.xEnd;
});
// Sista segmentet (efter sista pit till nivåns slut)
if (prevEnd < this.levelLoader.length) {
  const segWidth = this.levelLoader.length - prevEnd;
  const seg = this.groundBodies.create(prevEnd + segWidth / 2, 570, null);
  seg.setVisible(false);
  seg.setSize(segWidth, 60);
  seg.refreshBody();
}

this.physics.add.collider(this.bike, this.groundBodies);
```

- [ ] **Step 3: I update(), checka pit-fall + studs-tillbaka**

```javascript
update(time, delta) {
  // ... befintlig update-logik (cyklist auto-rull, etc.) ...

  // Pit-detection: om cyklist y > 580 OCH inte över ground = falling i pit
  if (this.bike.y > 580 && this.platformPhysics.isOverPit(this.bike.x)) {
    this.handlePitFall();
  }
}

handlePitFall() {
  if (this.respawning) return;
  this.respawning = true;
  this.cameras.main.shake(200, 0.01);

  const safePlatform = this.platformPhysics.lastSafePlatformBefore(this.bike.x);
  const respawnX = safePlatform ? safePlatform.x + safePlatform.width / 2 : 200;
  const respawnY = safePlatform ? safePlatform.y - 50 : 480;

  this.bike.setPosition(respawnX, respawnY);
  this.bike.setVelocity(0, 0);

  this.time.delayedCall(500, () => {
    this.respawning = false;
  });
}
```

- [ ] **Step 4: Verifiera**

```bash
npm run dev
# Spela Skog 1-1
# Kontrollera:
# - Cyklisten landar på plattformar (collision)
# - Pits visas mörka i marken
# - Falla i pit → studs tillbaka till senaste plattform, fortsätter spela
```

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(GameScene): pits visualisering + studs-tillbaka vid fall"
```

### Task 1.9: GameScene — auto-vault för markhinder

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: I `update()`, tick auto-vault-check**

```javascript
update(time, delta) {
  // ... befintliga update-block ...

  // Auto-vault: om hinder ahead på marken och cyklisten är på marken
  const bikeOnGround = this.bike.body.touching.down;
  const bikeYContext = bikeOnGround ? 'ground' : this.bike.y;
  if (bikeOnGround && this.platformPhysics.shouldAutoVault(this.bike.x, 'ground')) {
    if (!this.autoVaultCooldown) {
      this.bike.setVelocityY(-700); // mindre än manuellt hopp -820, bara tillräckligt för små stenar
      this.autoVaultCooldown = true;
      this.time.delayedCall(400, () => {
        this.autoVaultCooldown = false;
      });
    }
  }
}
```

- [ ] **Step 2: I `create()`, rendera obstacles enligt level-data (inte RNG-spawn)**

Hitta `spawnObstacle()` eller motsvarande som tidigare hanterade RNG. Ersätt med:

```javascript
// I create():
this.obstacleGroup = this.physics.add.staticGroup();
this.levelLoader.obstacles().forEach((o) => {
  const groundY = 540;
  const platform = this.platformPhysics.platformAt(o.x);
  const yPos = o.y === 'ground' ? groundY - 20 : (platform ? platform.y - 20 : groundY - 20);
  const obstacle = this.obstacleGroup.create(o.x, yPos, o.type);
  obstacle.setOrigin(0.5, 1);
  obstacle.refreshBody();
});

this.physics.add.overlap(this.bike, this.obstacleGroup, this.handleBonk, null, this);
```

- [ ] **Step 3: Behåll existerande `handleBonk()` — call StarTracker när det händer**

```javascript
handleBonk(bike, obstacle) {
  if (this.bonkCooldown) return;
  this.bonkCooldown = true;

  // Befintlig camera shake + slowdown — behåll
  this.cameras.main.shake(150, 0.005);
  // ... slowdown logic befintlig ...

  // NY: registrera i StarTracker
  this.starTracker.recordBonk();

  this.time.delayedCall(500, () => {
    this.bonkCooldown = false;
  });
}
```

- [ ] **Step 4: Verifiera**

```bash
npm run dev
# Spela Skog 1-1
# Kontrollera:
# - Sten på x=1100 → cyklisten hoppar AUTO innan kollision
# - Log på x=2200 → samma
# - Om sköld-power-up plockad innan: bonk absorberas
```

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(GameScene): auto-vault över markhinder + bonk-registrering"
```

### Task 1.10: GameScene — pokémon-spawning enligt level-data

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Ersätt RNG-pokémon-spawn med level-data-driven**

I `create()`, efter `this.platforms` är skapad:

```javascript
// Random pokémon på fixed positioner per level
this.randomPokemonGroup = this.physics.add.group();
const pool = this.biome.pokemonIds; // pokémon från denna värld
this.levelLoader.randomSpots().forEach((spot) => {
  const pokemonId = pool[Math.floor(Math.random() * pool.length)];
  const isShiny = Math.random() < (1 / 50);
  const sprite = this.randomPokemonGroup.create(spot.x, spot.y, `pokemon-${pokemonId}`);
  sprite.pokemonId = pokemonId;
  sprite.isShiny = isShiny;
  if (isShiny) {
    // Återanvänd befintlig shiny-glow-effekt
    sprite.setTint(0xffd700);
    // ... ev. existerande shiny-tween ...
  }
});

// Auto-pickup vid overlap
this.physics.add.overlap(this.bike, this.randomPokemonGroup, this.handleRandomPickup, null, this);
```

- [ ] **Step 2: Lägg till `handleRandomPickup`**

```javascript
handleRandomPickup(bike, pokemon) {
  this.starTracker.recordRandomPickup();
  // Befintlig pickup-effekt: chime-ljud + sticker-book-uppdatering
  this.sound.play('pickup');
  this.stickerBook.markSeen(pokemon.pokemonId, pokemon.isShiny);
  pokemon.destroy();
}
```

- [ ] **Step 3: Lägg till boss-pokémon vid nivåns slut**

```javascript
// I create(), efter random-pokémon:
const boss = this.levelLoader.bossPosition();
this.bossSprite = this.physics.add.sprite(boss.x, 460, `pokemon-${boss.pokemonId}`);
this.bossSprite.setScale(2);  // större än random
this.bossSprite.pokemonId = boss.pokemonId;

// Glow-effect via tween
this.tweens.add({
  targets: this.bossSprite,
  scale: { from: 1.9, to: 2.1 },
  yoyo: true,
  repeat: -1,
  duration: 600,
});

this.physics.add.overlap(this.bike, this.bossSprite, this.handleBossPickup, null, this);
```

- [ ] **Step 4: Lägg till `handleBossPickup` → ResultScene**

```javascript
handleBossPickup(bike, boss) {
  this.starTracker.recordBossPickup();
  this.sound.play('shiny'); // boss = extra-celebration

  const isShiny = Math.random() < (1 / 50);
  this.stickerBook.markSeen(boss.pokemonId, isShiny);

  const stars = this.starTracker.computeStars();

  // Persist
  import('../utils/storage.js').then(({ createStorage, setLevelStars }) => {
    const storage = createStorage();
    setLevelStars(storage, this.levelId, stars);
    this.scene.start('ResultScene', {
      levelId: this.levelId,
      stars,
      pickedRandom: this.starTracker.randomPickedCount,
      totalRandom: this.levelLoader.data.randomCount,
    });
  });
}
```

- [ ] **Step 5: Verifiera**

```bash
npm run dev
# Spela Skog 1-1 till slut
# Kontrollera:
# - 3 random pokémon på plattformar
# - Boss vid nivåns slut, glödande, dubbel storlek
# - Plocka boss → ResultScene laddas (kan misslyckas om ResultScene inte finns ännu, OK)
```

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(GameScene): pokémon-spawning + boss-pickup → ResultScene"
```

### Task 1.11: ResultScene UI

**Files:**
- Create: `src/scenes/ResultScene.js`

- [ ] **Step 1: Skapa scenen med stjärn-display + knappar**

```javascript
// src/scenes/ResultScene.js
import Phaser from 'phaser';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.levelId = data.levelId;
    this.stars = data.stars;
    this.pickedRandom = data.pickedRandom;
    this.totalRandom = data.totalRandom;
  }

  create() {
    const { width, height } = this.scale;

    // Bakgrund — soft fade
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

    // "NIVÅ KLAR!"
    this.add.text(width / 2, 100, `${this.levelId} KLAR!`, {
      fontSize: '64px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // 3 stjärn-slots
    const starY = 250;
    const starSpacing = 120;
    for (let i = 0; i < 3; i++) {
      const x = width / 2 - starSpacing + i * starSpacing;
      const filled = i < this.stars;
      this.add.text(x, starY, filled ? '★' : '☆', {
        fontSize: '120px',
        color: filled ? '#ffd700' : '#666',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Pokémon-räknare
    this.add.text(width / 2, 400,
      `Pokémon: ${this.pickedRandom + 1}/${this.totalRandom + 1}`, {
      fontSize: '36px',
      color: '#fff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Knappar
    const btnY = 500;
    const replay = this.add.text(width / 2 - 200, btnY, 'OM IGEN', {
      fontSize: '36px',
      color: '#fff',
      backgroundColor: '#4a90d9',
      padding: { x: 24, y: 12 },
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const map = this.add.text(width / 2 + 200, btnY, 'KARTA', {
      fontSize: '36px',
      color: '#fff',
      backgroundColor: '#5cb85c',
      padding: { x: 24, y: 12 },
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    replay.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });
    map.on('pointerdown', () => {
      this.scene.start('WorldMapScene');
    });
  }
}
```

- [ ] **Step 2: Registrera i `main.js`**

```javascript
// src/main.js
import ResultScene from './scenes/ResultScene.js';
// ... lägg till i scene-listan: scene: [HomeScene, GameScene, ResultScene, StickerBookScene],
```

OBS: WorldMapScene läggs till i Task 2.1 — för nu, KARTA-knappen kommer fela tills den finns. Det är OK för fas-1-test.

- [ ] **Step 3: Verifiera**

```bash
npm run dev
# Spela Skog 1-1, plocka boss → ResultScene laddas
# Kontrollera:
# - "1-1 KLAR!" text
# - Stjärnor (★/☆) visas baserat på antal
# - Pokémon-räknare korrekt
# - "OM IGEN"-knapp restartar nivån
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ResultScene.js src/main.js
git commit -m "feat: ResultScene — stjärn-display + replay/karta-knappar"
```

---

## Fas 2 — WorldMap + Integration

### Task 2.1: WorldMapScene grundstruktur

**Files:**
- Create: `src/scenes/WorldMapScene.js`

- [ ] **Step 1: Skapa scenen med Skog-bakgrund + 3 noder**

```javascript
// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { LEVELS } from '../data/levels.js';
import { createStorage, getAllLevelStars } from '../utils/storage.js';

const NODE_POSITIONS = {
  forest: [
    { x: 250, y: 540 },   // 1-1 (start, lower-left)
    { x: 640, y: 380 },   // 1-2 (mid)
    { x: 1030, y: 220 },  // 1-3 (upper-right)
  ],
  beach: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
  cave: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
  ocean: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
};

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data) {
    this.currentWorld = data?.worldId || 'forest';
  }

  preload() {
    this.load.image('worldmap-forest', 'assets/worldmaps/forest.png');
    this.load.image('worldmap-beach', 'assets/worldmaps/beach.png');
    this.load.image('worldmap-cave', 'assets/worldmaps/cave.png');
    this.load.image('worldmap-ocean', 'assets/worldmaps/ocean.png');
  }

  create() {
    const { width, height } = this.scale;
    const storage = createStorage();
    const levelStars = getAllLevelStars(storage);

    // Bakgrund
    const bg = this.add.image(width / 2, height / 2, `worldmap-${this.currentWorld}`);
    bg.setDisplaySize(width, height);

    // Header med världsnamn
    this.add.text(width / 2, 50, this.currentWorld.toUpperCase(), {
      fontSize: '48px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Render noder
    const positions = NODE_POSITIONS[this.currentWorld];
    const worldLevels = LEVELS.filter((l) => l.worldId === this.currentWorld);

    worldLevels.forEach((level, idx) => {
      const pos = positions[idx];
      const stars = levelStars[level.id]?.stars || 0;
      const completed = levelStars[level.id]?.completed || false;
      const unlocked = idx === 0 || (worldLevels[idx - 1] && (levelStars[worldLevels[idx - 1].id]?.completed));

      this.renderNode(pos.x, pos.y, level, stars, unlocked);
    });

    // Hem-knapp
    const home = this.add.text(60, 50, '← HEM', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#222',
      padding: { x: 12, y: 6 },
      fontFamily: 'monospace',
    }).setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.scene.start('HomeScene'));
  }

  renderNode(x, y, level, stars, unlocked) {
    const bg = this.add.circle(x, y, 36, unlocked ? 0xffffff : 0x444444);
    bg.setStrokeStyle(4, unlocked ? 0x4a90d9 : 0x222222);

    if (unlocked) {
      const label = this.add.text(x, y, level.id, {
        fontSize: '20px',
        color: '#333',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Stjärn-strip ovanför
      this.add.text(x, y - 60, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '20px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    } else {
      this.add.text(x, y, '🔒', { fontSize: '32px' }).setOrigin(0.5);
    }
  }
}
```

- [ ] **Step 2: Registrera i `main.js`**

```javascript
// src/main.js
import WorldMapScene from './scenes/WorldMapScene.js';
// scene: [HomeScene, WorldMapScene, GameScene, ResultScene, StickerBookScene],
```

- [ ] **Step 3: Verifiera**

```bash
npm run dev
# Tillfälligt: i HomeScene, byt "Spela"-knappen till att starta 'WorldMapScene' istället för 'GameScene' (Task 2.3 gör det permanent)
# Kontrollera:
# - Forest world map visas
# - 3 noder synliga
# - Endast 1-1 är klickbar (unlocked), 1-2 och 1-3 är låsta
# - Klick på 1-1 → GameScene startar
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/WorldMapScene.js src/main.js
git commit -m "feat: WorldMapScene — Skog-värld med 3 noder och lås-progression"
```

### Task 2.2: HomeScene → WorldMap navigation

**Files:**
- Modify: `src/scenes/HomeScene.js`

- [ ] **Step 1: Hitta SPELA-knappens click-handler i HomeScene**

```bash
grep -n "scene.start\|scene\.start" src/scenes/HomeScene.js
```

- [ ] **Step 2: Ändra från `'GameScene'` till `'WorldMapScene'`**

I HomeScene.js, sök efter raden som startar GameScene och ändra:

```javascript
// FÖRE: this.scene.start('GameScene');
// EFTER: this.scene.start('WorldMapScene');
```

- [ ] **Step 3: Verifiera flöde**

```bash
npm run dev
# Klicka SPELA på HomeScene → WorldMapScene laddas
# Klicka 1-1 på WorldMap → GameScene
# Plocka boss → ResultScene
# Klicka KARTA → tillbaka till WorldMap
# Klicka 1-1 igen → GameScene (replay)
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/HomeScene.js
git commit -m "feat(HomeScene): SPELA → WorldMapScene istället för GameScene"
```

### Task 2.3: WorldMap-uppdatering efter nivå-klar

**Files:**
- Modify: `src/scenes/WorldMapScene.js`

WorldMap måste uppdateras när stjärnor ändras. Phaser scene-restart hämtar färsk data från storage automatiskt eftersom `create()` läser `getAllLevelStars()` varje gång scenen startar. Verifiera att det fungerar.

- [ ] **Step 1: Verifiera att stjärnor uppdateras**

```bash
npm run dev
# 1. Klicka SPELA → WorldMap
# 2. Notera 1-1 har "☆☆☆" stjärnor
# 3. Klicka 1-1 → spela till slut, plocka boss → Result visar 1 stjärna
# 4. Klicka KARTA → WorldMap
# 5. Verifiera: 1-1 visar nu "★☆☆" stjärnor
# 6. 1-2 ska nu vara unlocked (eftersom 1-1.completed=true)
```

- [ ] **Step 2: Om 1-2 INTE blir unlocked**

Bug i unlock-logiken — debugga via console:

```javascript
// I WorldMapScene.create(), efter levelStars hämtning:
console.log('Level stars:', levelStars);
console.log('1-1 completed:', levelStars['1-1']?.completed);
```

Förvänta att `1-1.completed === true` efter spel. Om inte: kolla att `setLevelStars` skriver `completed: true` (det gör det enligt Task 1.5 så det borde funka).

- [ ] **Step 3: Commit (om bug-fix behövdes)**

Om allt fungerar utan ändringar: ingen commit. Om bug-fix krävdes:

```bash
git add src/scenes/WorldMapScene.js
git commit -m "fix(WorldMapScene): unlock-logik för progression mellan noder"
```

### Task 2.4: Cyklisten på senaste klarade nod

**Files:**
- Modify: `src/scenes/WorldMapScene.js`

Visuell touch: cyklisten står på senaste klarade nod (eller startnoden om inget klarat).

- [ ] **Step 1: Lägg till bike-sprite på världskartan**

I `create()`, efter alla noder renderats:

```javascript
// Hitta senaste klarade nod
const positions = NODE_POSITIONS[this.currentWorld];
const worldLevels = LEVELS.filter((l) => l.worldId === this.currentWorld);
let bikeNodeIdx = 0;
for (let i = worldLevels.length - 1; i >= 0; i--) {
  if (levelStars[worldLevels[i].id]?.completed) {
    bikeNodeIdx = Math.min(i + 1, worldLevels.length - 1); // står på nästa nod (om finns) eller sista klarad
    break;
  }
}
const bikePos = positions[bikeNodeIdx];

const bikeSprite = this.add.image(bikePos.x, bikePos.y - 70, 'bike-standard');
bikeSprite.setScale(0.6);

// Liten bouncy-animation
this.tweens.add({
  targets: bikeSprite,
  y: bikePos.y - 80,
  yoyo: true,
  repeat: -1,
  duration: 500,
});
```

OBS: bike-spriten är preload:ad i HomeScene (eller GameScene). Verifiera att texturen finns:

```javascript
// Top of preload(), om inte redan laddad i annan scene:
this.load.image('bike-standard', 'assets/characters/bike.png');
```

- [ ] **Step 2: Verifiera**

```bash
npm run dev
# Initial state: bike på 1-1
# Klar 1-1 → bike flyttar till 1-2-positionen
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/WorldMapScene.js
git commit -m "feat(WorldMapScene): cyklist-sprite på senaste klarade nod"
```

### Task 2.5: End-to-end smoke test på iPad

**Files:** Inga kod-ändringar.

- [ ] **Step 1: Deploy till GitHub Pages**

```bash
git push origin master
# GitHub Actions deployar automatiskt — vänta ~2 min
```

- [ ] **Step 2: Öppna https://jerkajon.github.io/cykelmon/ på iPad**

Verifieringschecklist (alla i specens acceptanskriterier 1-9 utan #10):

- [ ] HomeScene visas korrekt
- [ ] SPELA → WorldMapScene laddar Skog-bakgrund
- [ ] 1-1 nod är klickbar; 1-2 och 1-3 är låsta
- [ ] Klick på 1-1 → GameScene laddas
- [ ] Cyklisten auto-rullar åt höger
- [ ] Plattformar synliga (4 st i Skog 1-1)
- [ ] Pits synliga som mörka luckor (2 st)
- [ ] Auto-vault triggar över sten + log på marken
- [ ] Tap → manuellt hopp till plattform fungerar
- [ ] Falla i pit → studs tillbaka till senaste plattform
- [ ] Plocka random pokémon → räknare uppdateras
- [ ] Sköld-power-up plockad → bonk absorberas
- [ ] Boss vid nivåns slut är synlig + glödande
- [ ] Plocka boss → ResultScene
- [ ] Stjärnor visas korrekt (1-3 baserat på prestation)
- [ ] OM IGEN → restartar nivån
- [ ] KARTA → tillbaka till WorldMap, 1-1 visar nu stjärnor, 1-2 unlocked
- [ ] Reload sidan → stjärnor kvar (localStorage persist)
- [ ] Klistermärkesbok → plockade pokémon syns

- [ ] **Step 3: Notera buggar**

Om något inte fungerar: dokumentera i ny session-not under `~/obsidian/claudeworkspace/Sessions/2026-MM-DD-mario-run-fas-1-2-test.md` och fixa innan nästa fas.

- [ ] **Step 4: Test med 3-åringen**

Erik:s son ska kunna:
- Klicka SPELA + 1-1 utan vägledning
- Förstå att tap = hopp
- Plocka boss → få stjärnor → vara entusiastisk
- Vilja spela 1-1 igen

Om sonen inte greppar något: notera, justera level-design eller mekanik i nästa fas.

- [ ] **Step 5: Commit deploy-verifiering**

Ingen kod-commit (bara test). Spara observationer i session-noten.

---

## Self-Review

**Spec coverage:** Skim each spec section.

| Spec-sektion | Plan-task |
|--------------|-----------|
| Discrete levels arkitektur | Task 1.1 (levels.js), 1.2 (LevelLoader), 1.6+ (GameScene refactor) |
| Boss-pokémon vid nivåns slut | Task 1.10 (boss-pickup) |
| Random-pokémon på fixed positioner | Task 1.10 (randomSpots) |
| Stjärn-system (1=boss / 2=alla / 3=no-bonk) | Task 1.3 (StarTracker) |
| Pits med studs-tillbaka | Task 1.4 (PlatformPhysics), 1.8 (rendering+respawn) |
| One-tap + auto-vault | Task 1.4 (shouldAutoVault), 1.9 (auto-vault i GameScene) |
| 12 nivåer, fas 0-2 levererar 1-1 | Task 1.1 (levels.js + 1-1 designed, stubs för rest) |
| Världskarta Mario Run-style | Task 2.1 (WorldMapScene), 2.4 (bike-position) |
| Cyklar unlock via stjärnor | **Saknas i denna plan — i uppföljnings-plan** ✓ explicit out-of-scope |
| Klistermärkesbok per-nivå-unlock | Plan använder existerande `markSeen()` i Task 1.10 — bra |
| Power-ups in-level | Task 1.10 placerar `powerUp` enligt level-data — `assets/powerups/` finns |
| Asset-pipeline 8 nya sprites bulk | Task 0.1, 0.2, 0.3 |
| Save-format v2 utökning | Task 1.5 — partially (level-stars + bikes), v1→v2 migration explicit out-of-scope |
| Acceptanskriterier 1-9 | Task 2.5 (end-to-end smoke test) |

**Gaps identifierade:**
- Power-up rendering i GameScene saknas i plan — lägger till (se nedan)
- Pit-rendering edge case: pit precis vid nivåns start eller slut — defensive (testa i Task 1.8)

**Placeholder scan:** ingen `TBD`, `implement later`, `add error handling`. ✓

**Type consistency:** `LevelLoader.platforms()` / `pits()` / `obstacles()` / `randomSpots()` är konsekventa över tasks. `StarTracker.recordBossPickup` / `recordRandomPickup` / `recordBonk` / `computeStars` är konsekventa. `setLevelStars(storage, levelId, stars)` används samma sätt i Task 1.5 och 1.10. ✓

**Fix: lägg till power-up rendering i Task 1.10:**

(Inline-fix nedan i Task 1.10, Step 1.5 — se uppdatering.)

### Task 1.10 — Step 1.5: Power-up rendering (FIX från self-review)

Lägg till mellan Step 2 och Step 3 i Task 1.10:

- [ ] **Step 1.5: Rendera power-up enligt level-data**

```javascript
// I create(), efter random-pokémon:
const pu = this.levelLoader.powerUp();
if (pu) {
  this.powerUpSprite = this.physics.add.sprite(pu.x, pu.y, `powerup-${pu.type}`);
  // Pulse-animation
  this.tweens.add({
    targets: this.powerUpSprite,
    scale: { from: 0.9, to: 1.1 },
    yoyo: true,
    repeat: -1,
    duration: 600,
  });
  this.physics.add.overlap(this.bike, this.powerUpSprite, this.handlePowerUpPickup, null, this);
}
```

```javascript
// Helper i scenen:
handlePowerUpPickup(bike, powerUp) {
  const type = powerUp.texture.key.replace('powerup-', '');
  this.activePowerUp = type;
  this.powerUpEndsAt = this.time.now + (type === 'magnet' ? 3000 : Infinity);
  // Sköld stannar tills nästa bonk; magnet i 3 s
  powerUp.destroy();

  if (type === 'shield') {
    this.shieldActive = true;
  }
}
```

Och i `handleBonk`:

```javascript
handleBonk(bike, obstacle) {
  if (this.bonkCooldown) return;

  // Sköld absorberar
  if (this.shieldActive) {
    this.shieldActive = false;
    this.activePowerUp = null;
    return; // ingen bonk räknas
  }

  this.bonkCooldown = true;
  // ... resten av befintlig handleBonk ...
}
```

Lägg detta in i Task 1.10 mellan steg 2 och 3 vid execution.

---

## Plan complete and saved to `docs/superpowers/plans/2026-05-10-mario-run-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Jag dispatchar en fresh subagent per task, reviewar mellan tasks, snabb iteration. Bra för denna plan eftersom systems (1.2/1.3/1.4) kan paralleliseras och GameScene-refaktor (1.6-1.10) är sekventiell men välseparerad.

**2. Inline Execution** — Tasks körs i denna session med executing-plans, batch execution med checkpoints för review.

Vilken approach?
