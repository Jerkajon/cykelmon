# Pokémon Cykelspel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg ett endless-runner-spel där en cyklist rullar genom 3 biomer, möter ~24 Pokémon (+ shinies) och samlar dem i en klistermärkesbok som persisteras i localStorage. Körs i Safari på iPad. Inga förlustskärmar.

**Architecture:** HTML5/Phaser 3 single-page-app, ES-moduler, byggt med Vite. All speltillstånd lever i Phaser-scener; klistermärken persisteras i `localStorage`. Spawning, kollision och biom-rotation lever i fristående system-klasser som testas med Vitest (ren logik, ingen Phaser-mock). Phaser-rendering verifieras manuellt i webbläsaren.

**Tech Stack:** Vite, Phaser 3.80+, Vanilla ES-modules JS, Vitest (unit tests), localStorage. Pokémon-sprites hämtas från PokéAPI via Node-script. Cykel- och hindersprites är initialt placeholder-rektanglar; FLUX.2-pipelinen används senare för polering.

---

## Spec → Plan-mappning

| Spec-sektion              | Tasks       |
|---------------------------|-------------|
| Spelloop                  | 2, 3, 5, 6, 9 |
| Klistermärkesbok          | 7, 14, 15   |
| Biomer                    | 11, 12      |
| Hastighet & spawning      | 4, 8        |
| Interaktion (tap = hopp)  | 3           |
| Ljud                      | 16          |
| Asset-pipeline            | 10          |
| iPad-polish               | 17          |
| Övergångsanimation        | 18          |

Etapp 1 = Tasks 1-3, Etapp 2 = Tasks 4-6, Etapp 3 = Tasks 7-10, Etapp 4 = Tasks 11-12, Etapp 5 = Tasks 13-14, Etapp 6 = Task 15, Etapp 7 = Tasks 16-18.

---

## File Structure

```
pokemoncykelspel/
├── package.json
├── vite.config.js
├── vitest.config.js
├── index.html
├── .gitignore
├── public/
│   └── manifest.json
├── assets/
│   ├── pokemon/                 # PokéAPI sprites (1.png, 25.png, …)
│   ├── characters/              # bike-frame-{0,1,2,3}.png (placeholder)
│   ├── obstacles/               # placeholder
│   ├── backgrounds/             # solid-color PNGs per biom (placeholder)
│   └── audio/
├── src/
│   ├── main.js                  # Phaser config + scene-registrering
│   ├── scenes/
│   │   ├── PreloaderScene.js
│   │   ├── HomeScene.js
│   │   ├── GameScene.js
│   │   └── StickerBookScene.js
│   ├── data/
│   │   ├── pokemon.js           # { id, dexNumber, name, biome }[]
│   │   └── biomes.js            # { id, name, obstacleTypes, pokemonIds, bgColor }[]
│   ├── systems/
│   │   ├── ObstacleSpawner.js   # ren logik, ingen Phaser
│   │   ├── PokemonSpawner.js    # ren logik
│   │   ├── BiomeManager.js
│   │   └── StickerBook.js
│   └── utils/
│       └── storage.js
├── tests/
│   ├── StickerBook.test.js
│   ├── ObstacleSpawner.test.js
│   ├── PokemonSpawner.test.js
│   └── BiomeManager.test.js
├── tools/
│   └── fetch-pokemon-sprites.js
└── docs/
    └── superpowers/
        ├── specs/2026-05-09-pokemon-cykelspel-design.md
        └── plans/2026-05-09-pokemon-cykelspel.md  # denna fil
```

**Designprincip:** Spawning/biom/sticker-logik är *ren JS* utan Phaser-beroenden → testas direkt med Vitest. Phaser-scener orkestrerar rendering och anropar systemen. Det här gör att vi kan TDD:a logiken och manuellt verifiera rendering.

---

## Task 1: Projekt-bootstrap

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `.gitignore`

- [ ] **Step 1: Initiera npm-projekt**

```bash
cd /Users/erikandersson/Claude/pokemoncykelspel
npm init -y
```

- [ ] **Step 2: Installera dependencies**

```bash
npm install phaser
npm install -D vite vitest jsdom
```

- [ ] **Step 3: Skriv `package.json` scripts**

Edit `package.json` så att fältet `"scripts"` blir:

```json
"scripts": {
  "dev": "vite --host",
  "build": "vite build",
  "preview": "vite preview --host",
  "test": "vitest run",
  "test:watch": "vitest",
  "fetch-sprites": "node tools/fetch-pokemon-sprites.js"
}
```

Sätt också `"type": "module"` i `package.json`.

- [ ] **Step 4: Skriv `vite.config.js`**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'assets',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
  },
});
```

- [ ] **Step 5: Skriv `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
```

- [ ] **Step 6: Skriv `index.html`**

```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>Pokémon Cykelspel</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }
    #game {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 7: Skriv minimal `src/main.js`**

```javascript
import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
    },
  },
  scene: [],
};

new Phaser.Game(config);
```

- [ ] **Step 8: Skriv `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
.vite/
assets/pokemon/*.png
```

(Pokémon-sprites är PokéAPI-output — gitignored, varje utvecklare hämtar själv via `npm run fetch-sprites`.)

- [ ] **Step 9: Verifiera dev-server**

```bash
npm run dev
```

Förväntat: server startar på `http://localhost:5173/`. Öppna i Chrome → ljusblå skärm utan fel i konsollen. Stäng med Ctrl+C.

- [ ] **Step 10: Verifiera test-runner**

```bash
npm test
```

Förväntat: "No test files found" — det är OK, vi har inga tester än.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "task 1: project bootstrap (vite + phaser + vitest)"
```

---

## Task 2: Cyklist + mark + autoscroll

**Files:**
- Create: `src/scenes/GameScene.js`
- Modify: `src/main.js`

Vi börjar med en *placeholder*-cykel: en blå rektangel med två svarta cirklar. Senare ersätts med riktig sprite. Cykeln står still, marken (en remsa pixlar) skrollar förbi → ger känslan av rörelse.

- [ ] **Step 1: Skapa `src/scenes/GameScene.js`**

```javascript
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Mark: en grön remsa längst ner. TileSprite så vi kan skrolla texturen.
    const groundHeight = 80;
    const groundY = h - groundHeight / 2;

    // Skapa procedural mark-textur (grön med mörkare prickar).
    const groundTextureKey = 'ground-texture';
    if (!this.textures.exists(groundTextureKey)) {
      const g = this.add.graphics();
      g.fillStyle(0x4a8b3a, 1);
      g.fillRect(0, 0, 64, groundHeight);
      g.fillStyle(0x3a6b2a, 1);
      for (let i = 0; i < 6; i++) {
        g.fillRect(Math.random() * 60, Math.random() * (groundHeight - 4), 4, 4);
      }
      g.generateTexture(groundTextureKey, 64, groundHeight);
      g.destroy();
    }

    this.ground = this.add.tileSprite(w / 2, groundY, w, groundHeight, groundTextureKey);

    // Cyklist: placeholder-graphics. Spara som container så vi kan animera senare.
    const bikeX = w * 0.25;
    const bikeY = groundY - groundHeight / 2 - 30;
    this.bike = this.makeBikePlaceholder(bikeX, bikeY);

    // Hastighet: pixlar per sekund som marken skrollar.
    this.scrollSpeed = 200;
  }

  makeBikePlaceholder(x, y) {
    const container = this.add.container(x, y);
    const body = this.add.rectangle(0, -10, 50, 20, 0x2244cc);
    const wheelL = this.add.circle(-15, 12, 12, 0x222222);
    const wheelR = this.add.circle(15, 12, 12, 0x222222);
    const head = this.add.circle(0, -28, 10, 0xffd1a4);
    container.add([body, wheelL, wheelR, head]);
    return container;
  }

  update(time, delta) {
    // delta är i ms. Skrolla mark-texturen åt vänster för att simulera rörelse åt höger.
    this.ground.tilePositionX += (this.scrollSpeed * delta) / 1000;
  }
}
```

- [ ] **Step 2: Registrera GameScene i `src/main.js`**

```javascript
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verifiera**

```bash
npm run dev
```

Öppna i Chrome. **Förväntat:** Ljusblå himmel, grön mark som skrollar åt vänster, en blå cykel-rektangel med svarta hjul + ljust huvud står still i vänster del av skärmen.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "task 2: cyklist placeholder + autoscroll-mark"
```

---

## Task 3: Tap-to-jump

**Files:**
- Modify: `src/scenes/GameScene.js`

Cykeln får physics-body, gravity, och en tap-handler som applicerar ett uppåtriktat impulse. När den landar på marken triggas ingen extra åtgärd (Phaser arcade-physics + collide räcker).

- [ ] **Step 1: Modifiera `GameScene.create()` så cykeln har physics**

Ersätt `makeBikePlaceholder` och `create()`-relaterad cykel-init med detta:

```javascript
  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const groundHeight = 80;
    const groundY = h - groundHeight / 2;

    const groundTextureKey = 'ground-texture';
    if (!this.textures.exists(groundTextureKey)) {
      const g = this.add.graphics();
      g.fillStyle(0x4a8b3a, 1);
      g.fillRect(0, 0, 64, groundHeight);
      g.fillStyle(0x3a6b2a, 1);
      for (let i = 0; i < 6; i++) {
        g.fillRect(Math.random() * 60, Math.random() * (groundHeight - 4), 4, 4);
      }
      g.generateTexture(groundTextureKey, 64, groundHeight);
      g.destroy();
    }

    this.ground = this.add.tileSprite(w / 2, groundY, w, groundHeight, groundTextureKey);

    // Osynlig physics-mark för kollision.
    this.groundBody = this.physics.add.staticImage(w / 2, groundY).setSize(w, groundHeight).setVisible(false);
    this.groundBody.refreshBody();

    // Cykel-textur (placeholder, genererad från graphics).
    const bikeKey = 'bike-placeholder';
    if (!this.textures.exists(bikeKey)) {
      const g = this.add.graphics();
      g.fillStyle(0x2244cc, 1);
      g.fillRect(5, 0, 50, 20);
      g.fillStyle(0x222222, 1);
      g.fillCircle(15, 30, 12);
      g.fillCircle(45, 30, 12);
      g.fillStyle(0xffd1a4, 1);
      g.fillCircle(30, -8, 10);
      g.generateTexture(bikeKey, 60, 50);
      g.destroy();
    }

    const bikeX = w * 0.25;
    const bikeY = groundY - groundHeight / 2 - 25;
    this.bike = this.physics.add.sprite(bikeX, bikeY, bikeKey);
    this.bike.setCollideWorldBounds(true);
    this.bike.body.setSize(40, 40);
    this.physics.add.collider(this.bike, this.groundBody);

    this.scrollSpeed = 200;

    // Tap → hopp om vi står på marken.
    this.input.on('pointerdown', () => this.tryJump());
  }

  tryJump() {
    if (this.bike.body.blocked.down || this.bike.body.touching.down) {
      this.bike.setVelocityY(-700);
    }
  }
```

`update()` är oförändrad.

- [ ] **Step 2: Verifiera**

```bash
npm run dev
```

**Förväntat:** Cykeln står stilla, marken skrollar. Tappa på skärmen → cykeln hoppar upp ~50-100 px och faller tillbaka. Andra tap medan i luften → ingen effekt. Tap på marken igen → nytt hopp.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "task 3: tap-to-jump med arcade physics"
```

---

## Task 4: ObstacleSpawner-logik (TDD)

**Files:**
- Create: `src/systems/ObstacleSpawner.js`
- Create: `tests/ObstacleSpawner.test.js`

ObstacleSpawner är en ren logik-klass (ingen Phaser). Den håller koll på tid sedan senaste spawn och svarar på `tick(deltaMs, state)` med antingen `null` eller `{ type, distance }` (ett spawn-event).

**Regler (från spec):**
- Min 1 sek mellan hinder
- Aldrig spawn medan cykeln är i luften (state.bikeAirborne)
- Slumpvis val mellan tillgängliga `obstacleTypes`

- [ ] **Step 1: Skriv tester `tests/ObstacleSpawner.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import { ObstacleSpawner } from '../src/systems/ObstacleSpawner.js';

describe('ObstacleSpawner', () => {
  const baseState = { bikeAirborne: false };
  const types = ['rock'];

  it('spawnar inte under första sekunden', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    expect(s.tick(500, baseState)).toBeNull();
  });

  it('spawnar efter minIntervalMs', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    s.tick(500, baseState);
    const ev = s.tick(600, baseState);
    expect(ev).not.toBeNull();
    expect(ev.type).toBe('rock');
  });

  it('spawnar inte medan cykeln är i luften', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 500, rng: () => 0.5 });
    s.tick(500, { bikeAirborne: false });
    const ev = s.tick(600, { bikeAirborne: true });
    expect(ev).toBeNull();
  });

  it('återställer timer efter spawn', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    s.tick(1100, baseState); // spawn
    const ev = s.tick(500, baseState);
    expect(ev).toBeNull();
  });

  it('väljer slumpvis bland flera typer', () => {
    const s = new ObstacleSpawner({
      obstacleTypes: ['rock', 'log', 'puddle'],
      minIntervalMs: 100,
      rng: () => 0.99, // sista index
    });
    s.tick(200, baseState);
    expect(s.tick(200, baseState).type).toBe('puddle');
  });

  it('hanterar olika spawn-fönster (variabilitet utöver min)', () => {
    // Med spawnWindowMs=500 och rng=0 ska spawn ske vid minInterval exakt.
    const s = new ObstacleSpawner({
      obstacleTypes: ['rock'],
      minIntervalMs: 1000,
      spawnWindowMs: 500,
      rng: () => 0,
    });
    s.tick(999, baseState);
    expect(s.tick(2, baseState)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Kör test → ska faila**

```bash
npm test
```

Förväntat: alla 6 tester FAIL (modulen finns inte).

- [ ] **Step 3: Implementera `src/systems/ObstacleSpawner.js`**

```javascript
export class ObstacleSpawner {
  constructor({ obstacleTypes, minIntervalMs = 1000, spawnWindowMs = 500, rng = Math.random }) {
    this.obstacleTypes = obstacleTypes;
    this.minIntervalMs = minIntervalMs;
    this.spawnWindowMs = spawnWindowMs;
    this.rng = rng;
    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
  }

  rollNextSpawnAt() {
    return this.minIntervalMs + this.rng() * this.spawnWindowMs;
  }

  setObstacleTypes(types) {
    this.obstacleTypes = types;
  }

  tick(deltaMs, state) {
    this.timeSinceSpawn += deltaMs;
    if (state.bikeAirborne) return null;
    if (this.timeSinceSpawn < this.nextSpawnAt) return null;

    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
    const idx = Math.floor(this.rng() * this.obstacleTypes.length);
    const safeIdx = Math.min(idx, this.obstacleTypes.length - 1);
    return { type: this.obstacleTypes[safeIdx] };
  }
}
```

- [ ] **Step 4: Kör test → ska passa**

```bash
npm test
```

Förväntat: 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 4: ObstacleSpawner-logik (TDD)"
```

---

## Task 5: ObstacleSpawner-integration

**Files:**
- Modify: `src/scenes/GameScene.js`

Vi använder ObstacleSpawner i GameScene. När den returnerar ett event spawnar vi en placeholder-rektangel (sten = grå) långt till höger som rör sig åt vänster.

- [ ] **Step 1: Lägg till import + obstacle-grupp i `GameScene.create()`**

Lägg till längst upp i filen:

```javascript
import { ObstacleSpawner } from '../systems/ObstacleSpawner.js';
```

I `create()`, efter cykel-init men före `this.input.on(...)`, lägg till:

```javascript
    // Hindergenerator
    this.obstacleSpawner = new ObstacleSpawner({
      obstacleTypes: ['rock'],
      minIntervalMs: 1500,
      spawnWindowMs: 1500,
    });
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });

    // Procedural sten-textur
    const rockKey = 'obstacle-rock';
    if (!this.textures.exists(rockKey)) {
      const g = this.add.graphics();
      g.fillStyle(0x808080, 1);
      g.fillCircle(20, 20, 18);
      g.fillStyle(0x606060, 1);
      g.fillCircle(15, 18, 5);
      g.fillCircle(25, 22, 4);
      g.generateTexture(rockKey, 40, 40);
      g.destroy();
    }
```

- [ ] **Step 2: Skapa `spawnObstacle`-metod i klassen**

Lägg till i `GameScene`-klassen:

```javascript
  spawnObstacle(type) {
    const w = this.scale.width;
    const groundY = this.scale.height - 80;
    const key = type === 'rock' ? 'obstacle-rock' : 'obstacle-rock';
    const obstacle = this.obstacles.create(w + 50, groundY - 30, key);
    obstacle.setVelocityX(-this.scrollSpeed);
    obstacle.body.setSize(30, 30);
    obstacle.setData('type', type);
  }
```

- [ ] **Step 3: Anropa spawner i `update()`**

Ersätt `update()` med:

```javascript
  update(time, delta) {
    this.ground.tilePositionX += (this.scrollSpeed * delta) / 1000;

    const airborne = !(this.bike.body.blocked.down || this.bike.body.touching.down);
    const event = this.obstacleSpawner.tick(delta, { bikeAirborne: airborne });
    if (event) this.spawnObstacle(event.type);

    // Städa hinder som åkt ut till vänster.
    this.obstacles.children.each((obstacle) => {
      if (obstacle && obstacle.x < -100) obstacle.destroy();
      return true;
    });
  }
```

- [ ] **Step 4: Verifiera**

```bash
npm run dev
```

**Förväntat:** Cykeln står still, marken skrollar, gråa stenar dyker upp till höger och rör sig åt vänster. Tap = hopp över stenen. (Ingen kollision än — det kommer i Task 6.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 5: ObstacleSpawner-integration + sten-spawn"
```

---

## Task 6: Mjuk kollision

**Files:**
- Modify: `src/scenes/GameScene.js`

När cykeln rör vid ett hinder: kort skak (camera shake + sprite tint), 0.5s slowdown till halv fart, sedan tillbaka till normal. Inget game over.

- [ ] **Step 1: Lägg till collider + bonk-handler i `create()`**

Efter `this.obstacles = ...` och `this.physics.add.collider(this.bike, this.groundBody)`:

```javascript
    this.physics.add.overlap(this.bike, this.obstacles, (bike, obstacle) => {
      this.handleBonk(obstacle);
    });
    this.bonkUntilTime = 0;
```

- [ ] **Step 2: Lägg till `handleBonk`-metod**

```javascript
  handleBonk(obstacle) {
    if (this.time.now < this.bonkUntilTime) return; // redan i bonk-läge
    this.bonkUntilTime = this.time.now + 500;

    // Förstör hindret så vi inte triggas igen.
    obstacle.destroy();

    // Kort sprite-tint + camera shake.
    this.bike.setTint(0xff8888);
    this.cameras.main.shake(150, 0.005);
    this.time.delayedCall(300, () => this.bike.clearTint());
  }
```

- [ ] **Step 3: Modifiera `update()` så scrollSpeed halveras under bonk**

Byt ut första raden i `update()`:

```javascript
    const inBonk = this.time.now < this.bonkUntilTime;
    const effectiveSpeed = inBonk ? this.scrollSpeed * 0.4 : this.scrollSpeed;
    this.ground.tilePositionX += (effectiveSpeed * delta) / 1000;

    // Sätt också hinderhastighet.
    this.obstacles.children.each((o) => {
      if (o && o.body) o.setVelocityX(-effectiveSpeed);
      return true;
    });
```

(Resten av `update()` oförändrat.)

- [ ] **Step 4: Verifiera**

```bash
npm run dev
```

**Förväntat:** När cykeln åker rakt på en sten (inget hopp): cykeln blir kort röd-tonad, kameran skakar lite, marken/stenarna saktar in 0.5s, sen tillbaka till normalt. Stenen försvinner. Inget game over.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 6: mjuk kollision (tint + shake + slowdown)"
```

---

## Task 7: StickerBook-system (TDD)

**Files:**
- Create: `src/utils/storage.js`
- Create: `src/systems/StickerBook.js`
- Create: `tests/StickerBook.test.js`

Storage-wrapper isolerar localStorage så vi kan mocka den i tester. StickerBook kan markera Pokémon som sedda (med eller utan shiny), läsa tillbaka, och migrera schema-versionen.

- [ ] **Step 1: Skriv `src/utils/storage.js`**

```javascript
export function createStorage(backend = globalThis.localStorage) {
  return {
    get(key) {
      try {
        const raw = backend.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        backend.setItem(key, JSON.stringify(value));
      } catch {
        // Tyst fail (privacy mode etc.) — spelet är fortfarande spelbart.
      }
    },
    clear(key) {
      try {
        backend.removeItem(key);
      } catch {
        // Tyst fail.
      }
    },
  };
}

export function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}
```

- [ ] **Step 2: Skriv tester `tests/StickerBook.test.js`**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { StickerBook } from '../src/systems/StickerBook.js';
import { createStorage, memoryBackend } from '../src/utils/storage.js';

const STORAGE_KEY = 'pokemoncykelspel.stickers';

describe('StickerBook', () => {
  let storage;
  let book;

  beforeEach(() => {
    storage = createStorage(memoryBackend());
    book = new StickerBook({ storage, key: STORAGE_KEY });
  });

  it('är tom från början', () => {
    expect(book.isSeen(25)).toBe(false);
    expect(book.isShinySeen(25)).toBe(false);
    expect(book.getSeenIds()).toEqual([]);
  });

  it('markerar Pokémon som sedd', () => {
    book.markSeen({ id: 25, shiny: false });
    expect(book.isSeen(25)).toBe(true);
    expect(book.isShinySeen(25)).toBe(false);
  });

  it('markerar shiny separat utan att glömma normal', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 25, shiny: true });
    expect(book.isSeen(25)).toBe(true);
    expect(book.isShinySeen(25)).toBe(true);
  });

  it('persisterar till storage', () => {
    book.markSeen({ id: 1, shiny: false });
    const reloaded = new StickerBook({ storage, key: STORAGE_KEY });
    expect(reloaded.isSeen(1)).toBe(true);
  });

  it('returnerar lista över sedda IDs', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 1, shiny: true });
    expect(book.getSeenIds().sort((a, b) => a - b)).toEqual([1, 25]);
  });

  it('returnerar lista över shiny IDs', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 1, shiny: true });
    expect(book.getShinyIds()).toEqual([1]);
  });

  it('hanterar korrupt JSON i storage gracefully', () => {
    const backend = memoryBackend();
    backend.setItem(STORAGE_KEY, '{not valid json');
    const s = createStorage(backend);
    const fresh = new StickerBook({ storage: s, key: STORAGE_KEY });
    expect(fresh.isSeen(25)).toBe(false);
    fresh.markSeen({ id: 25, shiny: false });
    expect(fresh.isSeen(25)).toBe(true);
  });

  it('migrerar gammal schema-version (v0 → v1) tyst', () => {
    const backend = memoryBackend();
    backend.setItem(STORAGE_KEY, JSON.stringify({ pokemon: { 25: { seen: true } } })); // ingen version
    const s = createStorage(backend);
    const fresh = new StickerBook({ storage: s, key: STORAGE_KEY });
    expect(fresh.isSeen(25)).toBe(true);
  });

  it('clearAll nollar boken', () => {
    book.markSeen({ id: 25, shiny: false });
    book.clearAll();
    expect(book.isSeen(25)).toBe(false);
  });
});
```

- [ ] **Step 3: Kör test → ska faila**

```bash
npm test
```

Förväntat: alla tests FAIL (StickerBook finns inte).

- [ ] **Step 4: Implementera `src/systems/StickerBook.js`**

```javascript
const CURRENT_VERSION = 1;

function emptyState() {
  return { version: CURRENT_VERSION, pokemon: {} };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return emptyState();
  if (!raw.pokemon || typeof raw.pokemon !== 'object') return emptyState();

  // v0: { pokemon: { id: { seen: bool, shiny?: bool } } } utan version-fält
  // v1: samma shape men med version-fält
  return {
    version: CURRENT_VERSION,
    pokemon: raw.pokemon,
  };
}

export class StickerBook {
  constructor({ storage, key }) {
    this.storage = storage;
    this.key = key;
    this.state = migrate(storage.get(key));
  }

  markSeen({ id, shiny }) {
    const existing = this.state.pokemon[id] || { seen: false, shiny: false, firstSeenAt: null };
    const next = {
      seen: true,
      shiny: existing.shiny || !!shiny,
      firstSeenAt: existing.firstSeenAt || Date.now(),
    };
    this.state.pokemon[id] = next;
    this.persist();
  }

  isSeen(id) {
    return !!(this.state.pokemon[id] && this.state.pokemon[id].seen);
  }

  isShinySeen(id) {
    return !!(this.state.pokemon[id] && this.state.pokemon[id].shiny);
  }

  getSeenIds() {
    return Object.keys(this.state.pokemon)
      .filter((id) => this.state.pokemon[id].seen)
      .map((id) => Number(id));
  }

  getShinyIds() {
    return Object.keys(this.state.pokemon)
      .filter((id) => this.state.pokemon[id].shiny)
      .map((id) => Number(id));
  }

  clearAll() {
    this.state = emptyState();
    this.storage.clear(this.key);
  }

  persist() {
    this.storage.set(this.key, this.state);
  }
}
```

- [ ] **Step 5: Kör test → ska passa**

```bash
npm test
```

Förväntat: alla 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "task 7: StickerBook + storage utility (TDD)"
```

---

## Task 8: PokemonSpawner-logik (TDD)

**Files:**
- Create: `src/systems/PokemonSpawner.js`
- Create: `tests/PokemonSpawner.test.js`

Liknar ObstacleSpawner men:
- Spawnar i mellanrummen mellan hinder (state.timeSinceLastObstacleSpawn > 600ms krävs)
- Slår om shiny (1/50)
- Returnerar `{ pokemonId, shiny }`

- [ ] **Step 1: Skriv tester `tests/PokemonSpawner.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import { PokemonSpawner } from '../src/systems/PokemonSpawner.js';

describe('PokemonSpawner', () => {
  const baseState = { timeSinceLastObstacleSpawn: 1000, bikeAirborne: false };

  it('spawnar inte direkt vid spelstart', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 2000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    expect(s.tick(500, baseState)).toBeNull();
  });

  it('spawnar efter min-intervall om mellanrummen är OK', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 2000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    s.tick(1000, baseState);
    const ev = s.tick(1100, baseState);
    expect(ev).not.toBeNull();
    expect(ev.pokemonId).toBe(25);
    expect(ev.shiny).toBe(false);
  });

  it('spawnar inte om hinder kom nyligen (mellanrum för smalt)', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 1000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    const ev = s.tick(1500, { timeSinceLastObstacleSpawn: 100, bikeAirborne: false });
    expect(ev).toBeNull();
  });

  it('rullar shiny när rng < shinyChance', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0.5,
      rng: () => 0.1, // < 0.5 → shiny
    });
    const ev = s.tick(200, baseState);
    expect(ev.shiny).toBe(true);
  });

  it('rullar inte shiny när rng > shinyChance', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0.5,
      rng: () => 0.9,
    });
    const ev = s.tick(200, baseState);
    expect(ev.shiny).toBe(false);
  });

  it('väljer slumpvis bland pokemonIds', () => {
    const s = new PokemonSpawner({
      pokemonIds: [1, 25, 7],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0.99, // sista index
    });
    const ev = s.tick(200, baseState);
    expect(ev.pokemonId).toBe(7);
  });

  it('setPokemonIds byter listan utan att återställa timer', () => {
    const s = new PokemonSpawner({
      pokemonIds: [1],
      minIntervalMs: 1000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    s.tick(500, baseState);
    s.setPokemonIds([25]);
    const ev = s.tick(600, baseState);
    expect(ev.pokemonId).toBe(25);
  });
});
```

- [ ] **Step 2: Kör test → ska faila**

```bash
npm test
```

- [ ] **Step 3: Implementera `src/systems/PokemonSpawner.js`**

```javascript
const MIN_GAP_AFTER_OBSTACLE_MS = 600;

export class PokemonSpawner {
  constructor({ pokemonIds, minIntervalMs = 2000, spawnWindowMs = 1000, shinyChance = 1 / 50, rng = Math.random }) {
    this.pokemonIds = pokemonIds;
    this.minIntervalMs = minIntervalMs;
    this.spawnWindowMs = spawnWindowMs;
    this.shinyChance = shinyChance;
    this.rng = rng;
    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
  }

  rollNextSpawnAt() {
    return this.minIntervalMs + this.rng() * this.spawnWindowMs;
  }

  setPokemonIds(ids) {
    this.pokemonIds = ids;
  }

  tick(deltaMs, state) {
    this.timeSinceSpawn += deltaMs;
    if (this.timeSinceSpawn < this.nextSpawnAt) return null;
    if (state.timeSinceLastObstacleSpawn !== undefined && state.timeSinceLastObstacleSpawn < MIN_GAP_AFTER_OBSTACLE_MS) {
      return null;
    }

    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();

    const idx = Math.min(Math.floor(this.rng() * this.pokemonIds.length), this.pokemonIds.length - 1);
    const pokemonId = this.pokemonIds[idx];
    const shiny = this.rng() < this.shinyChance;
    return { pokemonId, shiny };
  }
}
```

- [ ] **Step 4: Kör test → ska passa**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 8: PokemonSpawner-logik (TDD)"
```

---

## Task 9: PokemonSpawner-integration + auto-pickup

**Files:**
- Modify: `src/scenes/GameScene.js`

Vi kopplar in PokemonSpawner med en placeholder-Pokémon (gul cirkel = "Pikachu"). När cykeln åker över → markSeen + sprite floats up + kort blink.

- [ ] **Step 1: Lägg till imports + state i `GameScene.create()`**

Längst upp:

```javascript
import { PokemonSpawner } from '../systems/PokemonSpawner.js';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage } from '../utils/storage.js';
```

I `create()`, efter `this.obstacles = ...`-blocket, lägg till:

```javascript
    // Klistermärkesbok
    this.stickerBook = new StickerBook({
      storage: createStorage(),
      key: 'pokemoncykelspel.stickers',
    });

    // Pokémon-spawner (placeholder: bara id 25 = Pikachu)
    this.pokemonSpawner = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 3000,
      spawnWindowMs: 2000,
      shinyChance: 1 / 50,
    });
    this.pokemons = this.physics.add.group({ allowGravity: false });

    // Procedural placeholder-textur för "pikachu"
    const pikaKey = 'pokemon-25';
    if (!this.textures.exists(pikaKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(20, 20, 16);
      g.fillStyle(0x000000, 1);
      g.fillCircle(15, 17, 2);
      g.fillCircle(25, 17, 2);
      g.generateTexture(pikaKey, 40, 40);
      g.destroy();
    }

    // Tracking för pokemon-spawner gap-regel
    this.timeSinceLastObstacleSpawn = 9999;

    this.physics.add.overlap(this.bike, this.pokemons, (bike, mon) => this.handlePokemonPickup(mon));
```

- [ ] **Step 2: Lägg till `spawnPokemon` + `handlePokemonPickup` i klassen**

```javascript
  spawnPokemon({ pokemonId, shiny }) {
    const w = this.scale.width;
    const groundY = this.scale.height - 80;
    const key = `pokemon-${pokemonId}`;
    const mon = this.pokemons.create(w + 50, groundY - 30, key);
    mon.setVelocityX(-this.scrollSpeed);
    mon.body.setSize(30, 30);
    mon.setData('pokemonId', pokemonId);
    mon.setData('shiny', shiny);
    if (shiny) mon.setTint(0xffffaa);
  }

  handlePokemonPickup(mon) {
    if (mon.getData('picked')) return;
    mon.setData('picked', true);
    const pokemonId = mon.getData('pokemonId');
    const shiny = mon.getData('shiny');

    this.stickerBook.markSeen({ id: pokemonId, shiny });

    // Float-up + fade.
    this.tweens.add({
      targets: mon,
      y: mon.y - 80,
      alpha: 0,
      duration: 600,
      onComplete: () => mon.destroy(),
    });
  }
```

- [ ] **Step 3: Uppdatera `update()` för pokemon-spawning + obstacle-tracking**

Ersätt `update()` med:

```javascript
  update(time, delta) {
    const inBonk = this.time.now < this.bonkUntilTime;
    const effectiveSpeed = inBonk ? this.scrollSpeed * 0.4 : this.scrollSpeed;
    this.ground.tilePositionX += (effectiveSpeed * delta) / 1000;

    const airborne = !(this.bike.body.blocked.down || this.bike.body.touching.down);

    // Hinder
    this.timeSinceLastObstacleSpawn += delta;
    const obstacleEvent = this.obstacleSpawner.tick(delta, { bikeAirborne: airborne });
    if (obstacleEvent) {
      this.spawnObstacle(obstacleEvent.type);
      this.timeSinceLastObstacleSpawn = 0;
    }

    // Pokémon
    const pokemonEvent = this.pokemonSpawner.tick(delta, {
      timeSinceLastObstacleSpawn: this.timeSinceLastObstacleSpawn,
      bikeAirborne: airborne,
    });
    if (pokemonEvent) this.spawnPokemon(pokemonEvent);

    // Sätt aktuell hastighet på alla rörliga.
    this.obstacles.children.each((o) => { if (o && o.body) o.setVelocityX(-effectiveSpeed); return true; });
    this.pokemons.children.each((m) => { if (m && m.body && !m.getData('picked')) m.setVelocityX(-effectiveSpeed); return true; });

    // Cleanup
    this.obstacles.children.each((o) => { if (o && o.x < -100) o.destroy(); return true; });
    this.pokemons.children.each((m) => { if (m && m.x < -100) m.destroy(); return true; });
  }
```

- [ ] **Step 4: Verifiera**

```bash
npm run dev
```

**Förväntat:** Stenar spawnar som tidigare. Då och då dyker en gul "Pikachu"-cirkel upp, glider åt vänster, och när cykeln åker över → den floats upp och bleknar. Öppna DevTools → Application → Local Storage → `pokemoncykelspel.stickers` ska innehålla `{"version":1,"pokemon":{"25":{"seen":true,...}}}`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 9: PokemonSpawner-integration + auto-pickup + sticker-persist"
```

---

## Task 10: PokéAPI sprite-fetch

**Files:**
- Create: `tools/fetch-pokemon-sprites.js`

Node-script som hämtar sprites för en lista av dex-IDs och sparar till `assets/pokemon/<id>.png`.

- [ ] **Step 1: Skriv `tools/fetch-pokemon-sprites.js`**

```javascript
#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

// Gen 1 dex-IDs som matchar src/data/pokemon.js (uppdatera om du ändrar listan).
const POKEMON_IDS = [
  // Skog
  1, 10, 16, 43, 25, 133, 69, 29,
  // Strand
  7, 98, 54, 120, 79, 72, 116, 118,
  // Grotta
  74, 41, 95, 50, 66, 27, 104, 92,
];

const SPRITE_URL = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const OUT_DIR = 'assets/pokemon';

async function fetchOne(id) {
  const path = `${OUT_DIR}/${id}.png`;
  if (existsSync(path)) {
    console.log(`  ${id} → cached`);
    return;
  }
  const res = await fetch(SPRITE_URL(id));
  if (!res.ok) {
    console.error(`  ${id} → FAIL ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
  console.log(`  ${id} → saved (${buf.length} bytes)`);
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
  console.log(`Fetching ${POKEMON_IDS.length} sprites…`);
  for (const id of POKEMON_IDS) {
    await fetchOne(id);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Kör scriptet**

```bash
npm run fetch-sprites
```

**Förväntat:** ~24 nedladdningar, en per sekund. `ls assets/pokemon/` visar 24 PNG-filer.

- [ ] **Step 3: Commit**

```bash
git add tools/fetch-pokemon-sprites.js
git commit -m "task 10: PokéAPI sprite-fetch tool"
```

(`assets/pokemon/*.png` är gitignored — vi commitar bara verktyget.)

---

## Task 11: Biom-data + BiomeManager (TDD)

**Files:**
- Create: `src/data/pokemon.js`
- Create: `src/data/biomes.js`
- Create: `src/systems/BiomeManager.js`
- Create: `tests/BiomeManager.test.js`

- [ ] **Step 1: Skriv `src/data/pokemon.js`**

```javascript
// Gen 1 Pokémon, indelade i biomer. Dex-ID matchar PokéAPI.
export const POKEMON = [
  // === SKOG ===
  { id: 1,   name: 'Bulbasaur',  biome: 'forest' },
  { id: 10,  name: 'Caterpie',   biome: 'forest' },
  { id: 16,  name: 'Pidgey',     biome: 'forest' },
  { id: 43,  name: 'Oddish',     biome: 'forest' },
  { id: 25,  name: 'Pikachu',    biome: 'forest' },
  { id: 133, name: 'Eevee',      biome: 'forest' },
  { id: 69,  name: 'Bellsprout', biome: 'forest' },
  { id: 29,  name: 'Nidoran-F',  biome: 'forest' },

  // === STRAND ===
  { id: 7,   name: 'Squirtle',   biome: 'beach' },
  { id: 98,  name: 'Krabby',     biome: 'beach' },
  { id: 54,  name: 'Psyduck',    biome: 'beach' },
  { id: 120, name: 'Staryu',     biome: 'beach' },
  { id: 79,  name: 'Slowpoke',   biome: 'beach' },
  { id: 72,  name: 'Tentacool',  biome: 'beach' },
  { id: 116, name: 'Horsea',     biome: 'beach' },
  { id: 118, name: 'Goldeen',    biome: 'beach' },

  // === GROTTA ===
  { id: 74,  name: 'Geodude',    biome: 'cave' },
  { id: 41,  name: 'Zubat',      biome: 'cave' },
  { id: 95,  name: 'Onix',       biome: 'cave' },
  { id: 50,  name: 'Diglett',    biome: 'cave' },
  { id: 66,  name: 'Machop',     biome: 'cave' },
  { id: 27,  name: 'Sandshrew',  biome: 'cave' },
  { id: 104, name: 'Cubone',     biome: 'cave' },
  { id: 92,  name: 'Gastly',     biome: 'cave' },
];

export function pokemonByBiome(biomeId) {
  return POKEMON.filter((p) => p.biome === biomeId);
}

export function pokemonById(id) {
  return POKEMON.find((p) => p.id === id);
}
```

- [ ] **Step 2: Skriv `src/data/biomes.js`**

```javascript
import { pokemonByBiome } from './pokemon.js';

export const BIOMES = [
  {
    id: 'forest',
    name: 'Skog',
    bgColor: 0x9bcc70,
    obstacleTypes: ['rock', 'log'],
    get pokemonIds() { return pokemonByBiome('forest').map((p) => p.id); },
  },
  {
    id: 'beach',
    name: 'Strand',
    bgColor: 0xfde68a,
    obstacleTypes: ['puddle', 'shell'],
    get pokemonIds() { return pokemonByBiome('beach').map((p) => p.id); },
  },
  {
    id: 'cave',
    name: 'Grotta',
    bgColor: 0x57534e,
    obstacleTypes: ['stalagmite', 'rock'],
    get pokemonIds() { return pokemonByBiome('cave').map((p) => p.id); },
  },
];

export function biomeById(id) {
  return BIOMES.find((b) => b.id === id);
}
```

- [ ] **Step 3: Skriv tester `tests/BiomeManager.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import { BiomeManager } from '../src/systems/BiomeManager.js';
import { BIOMES } from '../src/data/biomes.js';

describe('BiomeManager', () => {
  it('börjar med ett deterministiskt biom när rng styrs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0 });
    expect(m.current().id).toBe(BIOMES[0].id);
  });

  it('roterar efter rotationMs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0.5 });
    const first = m.current();
    m.tick(30001);
    expect(m.current().id).not.toBe(first.id);
  });

  it('roterar inte före rotationMs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0.5 });
    const first = m.current();
    m.tick(29999);
    expect(m.current().id).toBe(first.id);
  });

  it('väljer aldrig samma biom direkt efter (om alternativ finns)', () => {
    let calls = 0;
    const m = new BiomeManager({
      biomes: BIOMES,
      rotationMs: 100,
      rng: () => {
        // Första anrop ger biom 0, sen försöker vi tvinga 0 igen — manager ska hoppa.
        calls += 1;
        return 0;
      },
    });
    const first = m.current();
    m.tick(101);
    expect(m.current().id).not.toBe(first.id);
  });

  it('emitterar callback vid byte', () => {
    let switched = null;
    const m = new BiomeManager({
      biomes: BIOMES,
      rotationMs: 100,
      rng: () => 0.5,
      onSwitch: (b) => { switched = b; },
    });
    m.tick(101);
    expect(switched).not.toBeNull();
    expect(switched.id).toBeDefined();
  });
});
```

- [ ] **Step 4: Kör test → ska faila**

```bash
npm test
```

- [ ] **Step 5: Implementera `src/systems/BiomeManager.js`**

```javascript
export class BiomeManager {
  constructor({ biomes, rotationMs = 30000, rng = Math.random, onSwitch = () => {} }) {
    this.biomes = biomes;
    this.rotationMs = rotationMs;
    this.rng = rng;
    this.onSwitch = onSwitch;
    this.timeInBiome = 0;
    const startIdx = Math.min(Math.floor(this.rng() * this.biomes.length), this.biomes.length - 1);
    this.currentIdx = startIdx;
  }

  current() {
    return this.biomes[this.currentIdx];
  }

  tick(deltaMs) {
    this.timeInBiome += deltaMs;
    if (this.timeInBiome < this.rotationMs) return;
    this.switch();
  }

  switch() {
    if (this.biomes.length <= 1) {
      this.timeInBiome = 0;
      return;
    }
    let nextIdx = Math.min(Math.floor(this.rng() * this.biomes.length), this.biomes.length - 1);
    if (nextIdx === this.currentIdx) {
      nextIdx = (nextIdx + 1) % this.biomes.length;
    }
    this.currentIdx = nextIdx;
    this.timeInBiome = 0;
    this.onSwitch(this.current());
  }
}
```

- [ ] **Step 6: Kör test → ska passa**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "task 11: biom-data + BiomeManager (TDD)"
```

---

## Task 12: BiomeManager-integration + PokéAPI-sprites i scen

**Files:**
- Modify: `src/scenes/GameScene.js`

Nu använder vi alla 3 biomer, byter parallax-färg vid switch, och laddar in riktiga PokéAPI-sprites. Hinder-typer per biom används av spawnern.

- [ ] **Step 1: Lägg till `preload()` i GameScene som laddar Pokémon-sprites**

I `GameScene`-klassen, lägg till före `create()`:

```javascript
  preload() {
    // Ladda alla 24 PokéAPI-sprites.
    import('../data/pokemon.js').then(({ POKEMON }) => {
      // Dynamic import är async — hanteras i create istället.
    });
    // Synkron load: importera POKEMON statiskt istället, se Step 2.
  }
```

Faktiskt ändrar vi till statisk import — ersätt hela GameScene-imports och `preload`:

Längst upp i filen:

```javascript
import { POKEMON } from '../data/pokemon.js';
import { BIOMES, biomeById } from '../data/biomes.js';
import { BiomeManager } from '../systems/BiomeManager.js';
```

- [ ] **Step 2: Skriv `preload()`**

```javascript
  preload() {
    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `pokemon/${p.id}.png`);
    }
  }
```

(Vite servar `assets/` som `publicDir`, så `pokemon/<id>.png` på nätet motsvarar `assets/pokemon/<id>.png` på disk.)

- [ ] **Step 3: Lägg till BiomeManager i `create()`**

I `create()`, ersätt blocket som skapade `pokemonSpawner` (med hardcoded `[25]`) med:

```javascript
    // Biom-manager
    this.biomeManager = new BiomeManager({
      biomes: BIOMES,
      rotationMs: 30000,
      onSwitch: (b) => this.handleBiomeSwitch(b),
    });

    const startBiome = this.biomeManager.current();
    this.cameras.main.setBackgroundColor(startBiome.bgColor);

    // Spawners initieras med startbiomets data.
    this.obstacleSpawner.setObstacleTypes(startBiome.obstacleTypes);

    this.pokemonSpawner = new PokemonSpawner({
      pokemonIds: startBiome.pokemonIds,
      minIntervalMs: 3000,
      spawnWindowMs: 2000,
      shinyChance: 1 / 50,
    });
```

(Flytta `this.pokemons = ...` och `this.physics.add.overlap(...)` så de står efter detta block — pokemons-gruppen behöver fortfarande skapas.)

Ta bort den hardcodade Pikachu-textur-genereringen (den behövs inte nu när vi har riktiga sprites).

- [ ] **Step 4: Lägg till `handleBiomeSwitch`-metod**

```javascript
  handleBiomeSwitch(biome) {
    this.cameras.main.setBackgroundColor(biome.bgColor);
    this.obstacleSpawner.setObstacleTypes(biome.obstacleTypes);
    this.pokemonSpawner.setPokemonIds(biome.pokemonIds);
  }
```

- [ ] **Step 5: Generera placeholder-texturer för alla obstacle-typer**

I `create()`, ersätt det enskilda `obstacle-rock`-blocket med en loop:

```javascript
    const obstacleColors = {
      rock: 0x808080,
      log: 0x8b5a2b,
      puddle: 0x60a5fa,
      shell: 0xfca5a5,
      stalagmite: 0x6b7280,
    };
    for (const [type, color] of Object.entries(obstacleColors)) {
      const k = `obstacle-${type}`;
      if (!this.textures.exists(k)) {
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 5, 40, 35);
        g.fillStyle(0x000000, 0.3);
        g.fillRect(2, 35, 36, 5);
        g.generateTexture(k, 40, 40);
        g.destroy();
      }
    }
```

Och uppdatera `spawnObstacle`:

```javascript
  spawnObstacle(type) {
    const w = this.scale.width;
    const groundY = this.scale.height - 80;
    const key = `obstacle-${type}`;
    const obstacle = this.obstacles.create(w + 50, groundY - 30, key);
    obstacle.setVelocityX(-this.scrollSpeed);
    obstacle.body.setSize(30, 30);
    obstacle.setData('type', type);
  }
```

- [ ] **Step 6: Anropa biomeManager.tick() i `update()`**

I `update()`, lägg till tidigt:

```javascript
    this.biomeManager.tick(delta);
```

- [ ] **Step 7: Verifiera**

```bash
npm run dev
```

**Förväntat:** Spelet startar i ett av tre biomer (slumpvis). Bakgrund grön/sandgul/grå. Pokémon som spawnar har riktiga sprites (Pikachu, Bulbasaur, etc.). Hinder har olika färger per biom. Efter ~30s switchar bakgrundsfärg + Pokémon-set.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "task 12: BiomeManager-integration + PokéAPI-sprites + flera obstacle-typer"
```

---

## Task 13: HomeScene

**Files:**
- Create: `src/scenes/HomeScene.js`
- Modify: `src/main.js`

Startskärm med stor "Spela!"-knapp och en mindre "Bok"-knapp.

- [ ] **Step 1: Skriv `src/scenes/HomeScene.js`**

```javascript
import Phaser from 'phaser';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(0x87ceeb);

    this.add.text(w / 2, h * 0.2, 'Pokémon\nCykelspel', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.1) + 'px',
      color: '#ffffff',
      stroke: '#1d4ed8',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);

    // Stor "Spela!"-knapp
    const playBtn = this.add.rectangle(w / 2, h * 0.55, w * 0.6, h * 0.18, 0xfacc15)
      .setStrokeStyle(6, 0x713f12)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'SPELA!', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.08) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => this.scene.start('GameScene'));

    // Mindre "Bok"-knapp
    const bookBtn = this.add.rectangle(w / 2, h * 0.8, w * 0.4, h * 0.1, 0xfb923c)
      .setStrokeStyle(4, 0x7c2d12)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.8, 'KLISTERMÄRKEN', {
      fontFamily: 'Arial',
      fontSize: Math.floor(h * 0.035) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    bookBtn.on('pointerdown', () => this.scene.start('StickerBookScene'));
  }
}
```

- [ ] **Step 2: Lägg till "Hem"-knapp i GameScene**

I `GameScene.create()`, längst ner:

```javascript
    const homeBtn = this.add.text(20, 20, '← Hem', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1000);
    homeBtn.on('pointerdown', () => this.scene.start('HomeScene'));
```

- [ ] **Step 3: Registrera HomeScene + sätt som start i `src/main.js`**

```javascript
import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
    },
  },
  scene: [HomeScene, GameScene],
};

new Phaser.Game(config);
```

- [ ] **Step 4: Verifiera**

```bash
npm run dev
```

**Förväntat:** Startsida med titel + gul "SPELA!"-knapp + orange "KLISTERMÄRKEN"-knapp. Tap på SPELA → spel. Tap på "← Hem" i spelet → tillbaka till start. Tap på KLISTERMÄRKEN → fel ("scene not found") — fixas i Task 14.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "task 13: HomeScene + hem-knapp i GameScene"
```

---

## Task 14: StickerBookScene

**Files:**
- Create: `src/scenes/StickerBookScene.js`
- Modify: `src/main.js`

Sidor per biom (skog, strand, grotta, shinies). Sedda Pokémon visas som sprite, osedda som mörk silhuett.

- [ ] **Step 1: Skriv `src/scenes/StickerBookScene.js`**

```javascript
import Phaser from 'phaser';
import { POKEMON, pokemonByBiome } from '../data/pokemon.js';
import { BIOMES } from '../data/biomes.js';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage } from '../utils/storage.js';

export default class StickerBookScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StickerBookScene' });
  }

  preload() {
    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `pokemon/${p.id}.png`);
    }
  }

  create() {
    this.book = new StickerBook({
      storage: createStorage(),
      key: 'pokemoncykelspel.stickers',
    });

    // Sidor: en per biom + shinies
    this.pages = BIOMES.map((b) => ({
      title: b.name,
      pokemons: pokemonByBiome(b.id),
      shinyPage: false,
    }));
    this.pages.push({ title: 'Glittriga!', pokemons: POKEMON, shinyPage: true });

    this.pageIdx = 0;
    this.renderPage();

    // Navigation
    const w = this.scale.width;
    const h = this.scale.height;

    const prevBtn = this.add.text(40, h / 2, '◀', {
      fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => this.prevPage());

    const nextBtn = this.add.text(w - 40, h / 2, '▶', {
      fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextPage());

    const homeBtn = this.add.text(20, 20, '← Hem', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true });
    homeBtn.on('pointerdown', () => this.scene.start('HomeScene'));
  }

  prevPage() {
    this.pageIdx = (this.pageIdx - 1 + this.pages.length) % this.pages.length;
    this.renderPage();
  }

  nextPage() {
    this.pageIdx = (this.pageIdx + 1) % this.pages.length;
    this.renderPage();
  }

  renderPage() {
    if (this.pageGroup) this.pageGroup.destroy(true);
    this.pageGroup = this.add.group();

    const w = this.scale.width;
    const h = this.scale.height;
    const page = this.pages[this.pageIdx];

    this.cameras.main.setBackgroundColor(0xfff7e6);

    const title = this.add.text(w / 2, 60, page.title, {
      fontFamily: 'Arial Black', fontSize: '48px', color: '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.add(title);

    // Grid: 4 kolumner × 2 rader för 8 Pokémon (för shiny-sidan: 6×4 om 24)
    const cols = page.shinyPage ? 6 : 4;
    const rows = Math.ceil(page.pokemons.length / cols);
    const cellW = w * 0.7 / cols;
    const cellH = (h - 200) / rows;
    const startX = w * 0.15 + cellW / 2;
    const startY = 130 + cellH / 2;

    page.pokemons.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const seen = page.shinyPage ? this.book.isShinySeen(p.id) : this.book.isSeen(p.id);
      const sprite = this.add.image(x, y, `pokemon-${p.id}`).setScale(2);
      if (!seen) {
        sprite.setTint(0x000000);
        sprite.setAlpha(0.25);
      } else if (page.shinyPage) {
        sprite.setTint(0xffffaa);
      }

      const label = this.add.text(x, y + cellH * 0.35, seen ? p.name : '???', {
        fontFamily: 'Arial', fontSize: '16px', color: '#7c2d12',
      }).setOrigin(0.5);

      this.pageGroup.add([sprite, label]);
    });

    // Sid-indikator
    const indicator = this.add.text(w / 2, h - 30, `${this.pageIdx + 1} / ${this.pages.length}`, {
      fontFamily: 'Arial', fontSize: '20px', color: '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.add(indicator);
  }
}
```

- [ ] **Step 2: Registrera scenen i `src/main.js`**

```javascript
import StickerBookScene from './scenes/StickerBookScene.js';
// …
  scene: [HomeScene, GameScene, StickerBookScene],
```

- [ ] **Step 3: Verifiera**

```bash
npm run dev
```

**Förväntat:** Hem → "KLISTERMÄRKEN" → Bok-skärm med sidan "Skog", 8 Pokémon-sprites. Sedda är synliga, osedda mörka silhuetter med "???". Pilarna växlar sida (Skog → Strand → Grotta → Glittriga). Hem-knapp tar dig tillbaka. Spela ett tag, möt en Pikachu, gå till boken → Pikachu-cellen är nu färglagd och visar "Pikachu".

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "task 14: StickerBookScene med sidor + silhuetter"
```

---

## Task 15: Shiny visuell variant + glitter-effekt

**Files:**
- Modify: `src/scenes/GameScene.js`

Shiny-tint är redan på plats i Task 9 (gult tint). Här lägger vi till en glitter-partikeleffekt vid pickup.

- [ ] **Step 1: Lägg till glitter-textur i `GameScene.create()`**

```javascript
    const glitterKey = 'glitter';
    if (!this.textures.exists(glitterKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(glitterKey, 8, 8);
      g.destroy();
    }
```

- [ ] **Step 2: Modifiera `handlePokemonPickup` för shiny-effekt**

```javascript
  handlePokemonPickup(mon) {
    if (mon.getData('picked')) return;
    mon.setData('picked', true);
    const pokemonId = mon.getData('pokemonId');
    const shiny = mon.getData('shiny');

    this.stickerBook.markSeen({ id: pokemonId, shiny });

    if (shiny) this.spawnGlitter(mon.x, mon.y);

    this.tweens.add({
      targets: mon,
      y: mon.y - 80,
      alpha: 0,
      duration: 600,
      onComplete: () => mon.destroy(),
    });
  }

  spawnGlitter(x, y) {
    const particles = this.add.particles(x, y, 'glitter', {
      lifespan: 800,
      speed: { min: 100, max: 250 },
      scale: { start: 1, end: 0 },
      tint: [0xffd700, 0xffffaa, 0xffffff],
      quantity: 30,
      emitting: false,
    });
    particles.explode(30, x, y);
    this.time.delayedCall(1000, () => particles.destroy());
  }
```

- [ ] **Step 3: Verifiera (med debug-tvinga shiny)**

Tillfälligt sätt `shinyChance: 1` i `pokemonSpawner` (i `create()`), kör `npm run dev`. **Förväntat:** alla Pokémon spawnar gul-tonade och vid pickup → guldglittrigt partikelutbrott. Återställ `shinyChance: 1 / 50` efter test.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "task 15: glitter-partikeleffekt vid shiny-pickup"
```

---

## Task 16: Audio

**Files:**
- Create: `assets/audio/` (placeholder-filer skapas av användaren — se nedan)
- Modify: `src/scenes/GameScene.js`
- Modify: `src/scenes/HomeScene.js`
- Modify: `src/scenes/StickerBookScene.js`

Vi behöver ljudfiler. För v1 räcker det med:
- `bgm-forest.mp3`, `bgm-beach.mp3`, `bgm-cave.mp3` (15-30 sek loopar)
- `sfx-jump.mp3`, `sfx-pickup.mp3`, `sfx-bonk.mp3`, `sfx-shiny.mp3`

Royalty-free källor:
- [pixabay.com/music](https://pixabay.com/music/) — fri musik
- [freesound.org](https://freesound.org/) — SFX

**OBS:** Om filerna inte finns, hoppar Phaser-load tyst — spelet fungerar ändå. Vi kodar defensivt.

- [ ] **Step 1: Lägg ljudfiler i `assets/audio/`**

Manuellt: ladda ner royaltyfria filer till `assets/audio/` med ovan namn. Det här är den enda manuella asset-stegen i planen — om du hoppar över den fungerar spelet ändå utan ljud.

- [ ] **Step 2: Lägg till audio-load i GameScene `preload()`**

```javascript
  preload() {
    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `pokemon/${p.id}.png`);
    }
    // Ljud — load misslyckas tyst om filer saknas.
    this.load.audio('bgm-forest', 'audio/bgm-forest.mp3');
    this.load.audio('bgm-beach', 'audio/bgm-beach.mp3');
    this.load.audio('bgm-cave', 'audio/bgm-cave.mp3');
    this.load.audio('sfx-jump', 'audio/sfx-jump.mp3');
    this.load.audio('sfx-pickup', 'audio/sfx-pickup.mp3');
    this.load.audio('sfx-bonk', 'audio/sfx-bonk.mp3');
    this.load.audio('sfx-shiny', 'audio/sfx-shiny.mp3');
  }
```

- [ ] **Step 3: Lägg till hjälpmetoder för säker audio-spel**

```javascript
  safePlay(key, config = {}) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
  }

  safeBgm(key) {
    if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); this.bgm = null; }
    if (this.cache.audio.exists(key)) {
      this.bgm = this.sound.add(key, { loop: true, volume: 0.4 });
      this.bgm.play();
    }
  }
```

- [ ] **Step 4: Trigga ljud på rätt ställen**

I `tryJump()` (efter `setVelocityY`):
```javascript
    this.safePlay('sfx-jump', { volume: 0.6 });
```

I `handleBonk()` (efter `setTint`):
```javascript
    this.safePlay('sfx-bonk', { volume: 0.7 });
```

I `handlePokemonPickup()` (efter `markSeen`):
```javascript
    this.safePlay(shiny ? 'sfx-shiny' : 'sfx-pickup', { volume: 0.7 });
```

I `handleBiomeSwitch(biome)` (i slutet):
```javascript
    this.safeBgm(`bgm-${biome.id}`);
```

I slutet av `create()`, starta startbiomets musik:
```javascript
    this.safeBgm(`bgm-${startBiome.id}`);
```

I `create()`, lyssna på `shutdown` för att stoppa BGM:
```javascript
    this.events.once('shutdown', () => {
      if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); }
    });
```

- [ ] **Step 5: Verifiera**

```bash
npm run dev
```

**Förväntat (om ljudfiler finns):** Spel = bakgrundsmusik per biom, hopp = woosh, pickup = chime, kollision = boink, shiny = extra glittrig chime. Byt biom → ny musikslinga. (Om filer saknas: spel fungerar tyst, inga konsol-fel.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "task 16: audio (BGM per biom + SFX, defensiv load)"
```

---

## Task 17: PWA-polish + iPad-test

**Files:**
- Create: `public/manifest.json`
- Modify: `index.html`

- [ ] **Step 1: Skriv `public/manifest.json`**

```json
{
  "name": "Pokémon Cykelspel",
  "short_name": "Cykelspel",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#87CEEB",
  "theme_color": "#1d4ed8",
  "icons": []
}
```

- [ ] **Step 2: Lägg till manifest + iOS-meta i `index.html`**

I `<head>` (efter befintliga meta-taggar):

```html
  <link rel="manifest" href="/manifest.json" />
  <meta name="apple-mobile-web-app-title" content="Cykelspel" />
  <meta name="theme-color" content="#1d4ed8" />
```

- [ ] **Step 3: Hitta din Mac:s IP**

```bash
ipconfig getifaddr en0
```

(Notera IP, t.ex. `192.168.1.42`.)

- [ ] **Step 4: Starta dev-servern på nätverket**

```bash
npm run dev
```

(Vite-konfiguration har redan `host: true` så den lyssnar på alla interfaces.)

- [ ] **Step 5: Testa på iPad**

På iPaden, öppna Safari → `http://<din-ip>:5173`. Acceptanskriterier (från specen):

1. Startskärm syns med "SPELA!" + KLISTERMÄRKEN
2. Tap "SPELA!" → spel startar inom 1 sek
3. Tap på skärmen → cykeln hoppar
4. Cykeln åker förbi en Pokémon → den lyfts och fade:as ut
5. Cykeln åker in i hinder → mjuk bonk + slowdown → fortsätter
6. Efter ~30s byts biom (annorlunda färg + nya Pokémon)
7. Hem → KLISTERMÄRKEN → mött Pokémon syns färglagd
8. Stäng Safari helt + öppna igen → klistermärken kvar

- [ ] **Step 6: "Add to Home Screen"**

På iPaden → dela-knapp → "Lägg till på hemskärmen". Verifiera att appen öppnas i fullscreen utan Safari-chrome.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "task 17: PWA-manifest + iOS-meta för Add to Home Screen"
```

---

## Task 18: Övergångsanimation mellan biomer

**Files:**
- Modify: `src/scenes/GameScene.js`

När biomet byter, gör vi en kort fade-to-white + camera-flash istället för instant byte.

- [ ] **Step 1: Modifiera `handleBiomeSwitch`**

```javascript
  handleBiomeSwitch(biome) {
    // Fade in en vit overlay, byt biom, fade ut.
    const w = this.scale.width;
    const h = this.scale.height;
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0).setDepth(2000);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 250,
      onComplete: () => {
        this.cameras.main.setBackgroundColor(biome.bgColor);
        this.obstacleSpawner.setObstacleTypes(biome.obstacleTypes);
        this.pokemonSpawner.setPokemonIds(biome.pokemonIds);
        this.safeBgm(`bgm-${biome.id}`);
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 350,
          onComplete: () => overlay.destroy(),
        });
      },
    });
  }
```

- [ ] **Step 2: Verifiera**

```bash
npm run dev
```

**Förväntat:** Vid biom-byte sker en kort vitblink (~600ms total), sedan ny färg + nya pokémon. Mjukare än Task 12:s instant-byte.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "task 18: smooth fade-to-white övergång mellan biomer"
```

---

## Self-Review

**Spec-coverage:**
- ✅ Endless runner, ETT input, automatisk pickup → Tasks 2, 3, 9
- ✅ 3 biomer med rotation → Tasks 11, 12
- ✅ Klistermärkesbok i localStorage → Tasks 7, 14
- ✅ Shiny 1/50 + egen plats → Tasks 8, 15, 14 (shiny-sida)
- ✅ ~24 Pokémon från PokéAPI → Tasks 10, 11
- ✅ Mjuk kollision, ingen game over → Task 6
- ✅ Speed-cap (med arcade-physics och ingen ramp än — spec säger "5%/30s, max 3x"; har medvetet skippat speed ramp i v1 eftersom 3-åring inte behöver det och det inte påverkar gameplay-känslan. Lägg till om Erik vill det)
- ✅ Tap-delay-fix → Task 1 (`touch-action: manipulation` i CSS)
- ✅ PWA + Add to Home Screen → Task 17
- ✅ Audio (defensivt) → Task 16
- ✅ Övergångsanimation → Task 18

**Gap:** Speed ramp (5%/30s upp till 3x). Inte i taskerna — kan läggas till som mini-task om Erik vill, men spec-acceptanskriterierna kräver det inte. Lägger till en kort kommentar i scope-noter nedan.

**Placeholder-scan:** Inga TBD/TODO. Alla kodblock är konkreta. Ljudfiler är manuella att ladda ner men det är medvetet (spec sa "fasning: kan börja utan ljud").

**Type-konsistens:**
- `StickerBook.markSeen({id, shiny})` används konsekvent i Tasks 7, 9, 14
- `ObstacleSpawner.setObstacleTypes` definierad i Task 4, använd i Task 12
- `PokemonSpawner.setPokemonIds` definierad i Task 8, använd i Task 12
- `BiomeManager.current()` / `tick()` / `onSwitch` konsekvent

**Mindre observation:** Task 9 hardcodar `[25]` för pokemonSpawner, Task 12 ersätter det med biomets ids. Det är medvetet en stegvis bygg-ordning (verifiera pickup först → sen biom-styrd lista).

---

## Out-of-scope-noter

- **Speed ramp:** Spec nämner 5%/30s, max 3x. Inte implementerat i grundtaskerna eftersom det inte påverkar acceptanskriterierna och en 3-åring tjänar inte på snabbare spel. Kan läggas till senare som en rad i `update()`: `this.scrollSpeed = Math.min(200 * 3, 200 + (time / 30000) * 200 * 0.05)`.
- **FLUX.2 side-view bike-sprite:** Placeholder-rektangel räcker för v1. När Erik vill ha riktig sprite, kör `tools/sprites/generate_sprite.py` med modifierad prompt (`pixel art sprite, side view, child on bike, facing right, ...`) och spara som `assets/characters/bike.png`, byt sedan ut placeholder-graphics-genereringen i Task 3 mot en `this.load.image('bike', 'characters/bike.png')` i `preload()`.
- **Parallax-bakgrunder:** v1 har bara solid bgColor per biom. Kan utökas senare med flera lager parallax (himmel, mid-träd, vegetation).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-09-pokemon-cykelspel.md`.

**Två executionsalternativ:**

**1. Subagent-Driven (rekommenderat)** — Jag dispatchar en fresh subagent per task, granskar mellan tasker. Snabb iteration, rent context per task, lätt att rulla tillbaka enskild task.

**2. Inline Execution** — Jag kör taskerna i nuvarande session (med `executing-plans`-skillen), batchar med checkpoints för granskning.

Vilken approach vill du köra?
