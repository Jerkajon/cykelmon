import Phaser from 'phaser';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage, setLevelStars } from '../utils/storage.js';
import { POKEMON } from '../data/pokemon.js';
import { biomeById } from '../data/biomes.js';
import { activeCycle, unlockedCycles } from '../data/cycles.js';
import { levelById } from '../data/levels.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { StarTracker } from '../systems/StarTracker.js';
import { PlatformPhysics } from '../systems/PlatformPhysics.js';

const LIFETIME_KEY = 'pokemoncykelspel.lifetimeCount';
const SELECTED_KEY = 'pokemoncykelspel.selectedCycle';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

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

  preload() {
    // Vi laddar 43 assets — höj från Phasers default 32 så alla startar parallellt.
    this.load.maxParallelDownloads = 64;
    this.load.on('loaderror', (file) => {
      // Tyst fail för audio + valfria bike-varianter (kan saknas).
      if (file.type === 'audio') return;
      if (file.key && (file.key.startsWith('bike-') || file.key === 'bg-ocean' || file.key === 'ground-ocean')) return;
      console.warn('Asset load error:', file.key, file.src);
    });
    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `pokemon/${p.id}.png`);
    }
    // Karaktär + biom-specifika bakgrunder och mark.
    this.load.image('bike', 'characters/bike.png');
    this.load.image('bike-red', 'characters/bike-red.png');
    this.load.image('bike-purple', 'characters/bike-unicycle.png');
    this.load.image('bike-gold', 'characters/bike-hover.png');
    this.load.image('bg-forest', 'backgrounds/forest.png');
    this.load.image('bg-beach', 'backgrounds/beach.png');
    this.load.image('bg-cave', 'backgrounds/cave.png');
    this.load.image('bg-ocean', 'backgrounds/ocean.png');
    this.load.image('ground-forest', 'grounds/forest.png');
    this.load.image('ground-beach', 'grounds/beach.png');
    this.load.image('ground-cave', 'grounds/cave.png');
    this.load.image('ground-ocean', 'grounds/ocean.png');
    // Hinder
    this.load.image('obstacle-rock', 'obstacles/rock.png');
    this.load.image('obstacle-log', 'obstacles/log.png');
    this.load.image('obstacle-puddle', 'obstacles/puddle.png');
    this.load.image('obstacle-shell', 'obstacles/shell.png');
    this.load.image('obstacle-stalagmite', 'obstacles/stalagmite.png');
    // Ljud — load misslyckas tyst om filer saknas.
    this.load.audio('bgm-forest', 'audio/bgm-forest.wav');
    this.load.audio('bgm-beach', 'audio/bgm-beach.wav');
    this.load.audio('bgm-cave', 'audio/bgm-cave.wav');
    this.load.audio('bgm-ocean', 'audio/bgm-ocean.wav');
    // Power-up-ikoner (pixelart genererade via DrawThings).
    this.load.image('pu-magnet', 'powerups/magnet.png');
    this.load.image('pu-shield', 'powerups/shield.png');
    this.load.image('pu-star', 'powerups/star.png');
    this.load.audio('sfx-jump', 'audio/sfx-jump.wav');
    this.load.audio('sfx-pickup', 'audio/sfx-pickup.wav');
    this.load.audio('sfx-bonk', 'audio/sfx-bonk.wav');
    this.load.audio('sfx-shiny', 'audio/sfx-shiny.wav');
    // Plattform-sprites för alla 4 världar
    this.load.image('platform-forest', 'platforms/forest.png');
    this.load.image('platform-beach', 'platforms/beach.png');
    this.load.image('platform-cave', 'platforms/cave.png');
    this.load.image('platform-ocean', 'platforms/ocean.png');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const groundHeight = 150;
    this.groundY = h - groundHeight / 2;
    const groundY = this.groundY;
    const levelLength = this.levelLoader.length;

    // World + camera bounds
    this.physics.world.setBounds(0, 0, levelLength, h);
    this.cameras.main.setBounds(0, 0, levelLength, h);

    // Bakgrund — tileSprite täcker hela leveln
    this.bgImage = this.add.tileSprite(0, 0, levelLength, h, `bg-${this.biome.id}`)
      .setOrigin(0, 0).setDepth(0);

    // Mark — tileSprite täcker hela leveln
    this.ground = this.add.tileSprite(0, h - groundHeight, levelLength, groundHeight, `ground-${this.biome.id}`)
      .setOrigin(0, 0).setDepth(1);

    // Mörka pits ovanpå ground-sprite
    this.levelLoader.pits().forEach((pit) => {
      const pitWidth = pit.xEnd - pit.xStart;
      const pitGfx = this.add.graphics().setDepth(2);
      pitGfx.fillStyle(0x000000, 1);
      pitGfx.fillRect(pit.xStart, h - groundHeight, pitWidth, groundHeight);
    });

    // Ground physics: en static body per mark-segment (mellan pits)
    this.groundBodies = this.physics.add.staticGroup();
    let prevEnd = 0;
    this.levelLoader.pits().forEach((pit) => {
      if (pit.xStart > prevEnd) {
        const segWidth = pit.xStart - prevEnd;
        const segCenter = prevEnd + segWidth / 2;
        const seg = this.groundBodies.create(segCenter, groundY, null);
        seg.setVisible(false);
        seg.setDisplaySize(segWidth, groundHeight);
        seg.refreshBody();
      }
      prevEnd = pit.xEnd;
    });
    // Sista segmentet efter sista pit till nivåns slut
    if (prevEnd < levelLength) {
      const segWidth = levelLength - prevEnd;
      const segCenter = prevEnd + segWidth / 2;
      const seg = this.groundBodies.create(segCenter, groundY, null);
      seg.setVisible(false);
      seg.setDisplaySize(segWidth, groundHeight);
      seg.refreshBody();
    }

    // Plattformar från level-data (staticGroup — immobile physics objects)
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

    // Cykel — riktig sprite (96x96 generated by FLUX.2)
    const bikeX = 200;
    const bikeY = groundY - groundHeight / 2 - 48;
    const lifetimeCount = createStorage().get(LIFETIME_KEY) || 0;
    const unlocked = unlockedCycles(lifetimeCount);
    const savedId = createStorage().get(SELECTED_KEY);
    const cycle = unlocked.find((c) => c.id === savedId) || activeCycle(lifetimeCount);
    const bikeKey = this.textures.exists(`bike-${cycle.id}`) ? `bike-${cycle.id}` : 'bike';
    this.bike = this.physics.add.sprite(bikeX, bikeY, bikeKey).setDepth(5);
    this.bike.setCollideWorldBounds(true);
    // Custom-cyklar är 128x128 (DrawThings-genererade), standard bike är 96x96.
    // Skala ner så alla blir ~96 visuellt och cyklist-bot landar på mark-top.
    if (bikeKey !== 'bike') this.bike.setScale(0.75);
    this.bike.body.setSize(60, 60);
    if (bikeKey === 'bike' && cycle.tint !== 0xffffff) this.bike.setTint(cycle.tint);
    if (cycle.glow) this.bike.postFX.addGlow(cycle.tint, 4, 0, false, 0.1, 12);
    this.physics.add.collider(this.bike, this.groundBodies);
    this.respawning = false;

    // Kamera följer cyklisten, konstant forward-hastighet
    this.cameras.main.startFollow(this.bike, true, 0.5, 0.0);
    this.forwardSpeed = 280;

    // Bake svart outline in i obstacle-texturer (en gång) → ingen runtime-glow.
    ['obstacle-rock', 'obstacle-log', 'obstacle-puddle', 'obstacle-shell', 'obstacle-stalagmite']
      .forEach((k) => this.bakeOutline(k, 1, '#000000'));

    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });

    const glitterKey = 'glitter';
    if (!this.textures.exists(glitterKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(glitterKey, 8, 8);
      g.destroy();
    }

    this.cameras.main.setBackgroundColor(this.biome.bgColor);

    this.physics.add.overlap(this.bike, this.obstacles, (bike, obstacle) => {
      this.handleBonk(obstacle);
    });
    this.bonkUntilTime = 0;

    // Klistermärkesbok
    this.stickerBook = new StickerBook({
      storage: createStorage(),
      key: 'pokemoncykelspel.stickers',
    });

    this.pokemons = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.bike, this.pokemons, (bike, mon) => this.handlePokemonPickup(mon));

    // Plattform-collider
    this.physics.add.collider(this.bike, this.platforms);

    // Power-ups
    this.powerUps = this.physics.add.group({ allowGravity: false });
    this.activeBuff = null;
    this.buffEndsAt = 0;
    this.physics.add.overlap(this.bike, this.powerUps, (bike, pu) => this.handlePowerUpPickup(pu));

    const homeBtn = this.add.text(20, 20, '← Hem', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1000);
    homeBtn.on('pointerdown', () => this.scene.start('HomeScene'));

    this.events.once('shutdown', () => {
      if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); }
    });

    // Tap → hopp om vi står på marken.
    this.input.on('pointerdown', () => this.tryJump());

    // Spawn level-data entiteter
    // Obstacles vid fasta positioner
    this.levelLoader.obstacles().forEach((o) => {
      const yPos = o.y === 'ground' ? groundY - groundHeight / 2 - 20 : o.y;
      const obstacle = this.obstacles.create(o.x, yPos, `obstacle-${o.type}`)
        .setDepth(4).setOrigin(0.5, 1);
      obstacle.body.setSize(40, 40);
      obstacle.body.setOffset((obstacle.width - 40) / 2, obstacle.height - 40);
      obstacle.body.setAllowGravity(false);
      obstacle.body.setImmovable(true);
      obstacle.setData('type', o.type);
    });

    // Random pokémon vid fasta positioner från biom-pool
    const pool = this.biome.pokemonIds;
    this.levelLoader.randomSpots().forEach((spot) => {
      const pokemonId = pool[Math.floor(Math.random() * pool.length)];
      const isShiny = Math.random() < (1 / 50);
      const mon = this.pokemons.create(spot.x, spot.y, `pokemon-${pokemonId}`)
        .setDepth(4).setScale(1.35);
      mon.body.setSize(45, 45);
      mon.body.setAllowGravity(false);
      mon.setData('pokemonId', pokemonId);
      mon.setData('shiny', isShiny);
      mon.setData('isBoss', false);
      if (isShiny) {
        mon.setTint(0xffffaa);
        mon.postFX.addShine(0.8, 1.5, 8, false);
      }
    });

    // Power-up (om finns i level-data)
    const pu = this.levelLoader.powerUp();
    if (pu) {
      const spriteKey = pu.type === 'magnet' ? 'pu-magnet' : pu.type === 'shield' ? 'pu-shield' : 'pu-star';
      const puSprite = this.add.image(pu.x, pu.y, spriteKey).setOrigin(0.5).setDepth(4).setScale(0.55);
      this.physics.add.existing(puSprite);
      puSprite.body.setSize(70, 70);
      puSprite.body.setAllowGravity(false);
      puSprite.body.setImmovable(true);
      puSprite.setData('puType', pu.type);
      puSprite.postFX.addGlow(0xfde047, 4, 0, false, 0.1, 8);
      this.powerUps.add(puSprite);
      this.tweens.add({
        targets: puSprite,
        y: pu.y - 18,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // Boss-pokémon vid level-slut
    const boss = this.levelLoader.bossPosition();
    if (boss.pokemonId) {
      const bossY = groundY - groundHeight / 2 - 60;
      const bossSprite = this.pokemons.create(boss.x, bossY, `pokemon-${boss.pokemonId}`)
        .setDepth(5).setScale(2.0);
      bossSprite.body.setSize(60, 60);
      bossSprite.body.setAllowGravity(false);
      bossSprite.setData('pokemonId', boss.pokemonId);
      bossSprite.setData('shiny', Math.random() < (1 / 50));
      bossSprite.setData('isBoss', true);
      bossSprite.postFX.addGlow(0xffd700, 8, 0, false, 0.1, 16);
      this.tweens.add({
        targets: bossSprite,
        scale: { from: 1.9, to: 2.1 },
        yoyo: true,
        repeat: -1,
        duration: 600,
      });
    }

    this.buffIcon = this.add.image(40, 110, 'pu-magnet')
      .setOrigin(0.5).setScale(0.4).setDepth(1500).setScrollFactor(0).setVisible(false);
    this.buffText = this.add.text(80, 110, '', {
      fontFamily: 'Arial Black', fontSize: '26px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 4,
    }).setOrigin(0, 0.5).setDepth(1500).setScrollFactor(0);

    this.safeBgm(`bgm-${this.biome.id}`);

    this.autoVaultCooldown = false;

    // Sätt initial velocity — update() tar över från första frame
    this.bike.setVelocityX(this.forwardSpeed);
  }

  tryJump() {
    if (this.bike.body.blocked.down || this.bike.body.touching.down) {
      this.bike.setVelocityY(-820);
      this.safePlay('sfx-jump', { volume: 0.6 });
    }
  }

  handleBonk(obstacle) {
    if (this.time.now < this.bonkUntilTime) return; // redan i bonk-läge
    this.bonkUntilTime = this.time.now + 500;

    // Sköld absorberar bonk
    if (this.activeBuff === 'shield') {
      this.deactivateBuff();
      this.showFloatingText('🛡️ Sköld!', this.bike.x + 60, this.bike.y - 80, '#bae6fd', '#0c4a6e');
      const ring = obstacle.getData('ring');
      if (ring) ring.destroy();
      obstacle.destroy();
      this.safePlay('sfx-bonk', { volume: 0.4 });
      return;
    }

    // Förstör hindret + dess ring så vi inte triggas igen.
    const ring = obstacle.getData('ring');
    if (ring) ring.destroy();
    obstacle.destroy();

    // Kort sprite-tint + camera shake.
    this.bike.setTint(0xff8888);
    this.safePlay('sfx-bonk', { volume: 0.7 });
    this.cameras.main.shake(150, 0.005);
    this.time.delayedCall(300, () => this.bike.clearTint());

    this.starTracker.recordBonk();
    this.showFloatingText('Hoppsan!', this.bike.x + 60, this.bike.y - 80, '#fecaca', '#b91c1c');
  }

  handlePitFall() {
    if (this.respawning) return;
    this.respawning = true;
    this.cameras.main.shake(200, 0.01);
    this.safePlay('sfx-bonk', { volume: 0.6 });

    const safePlatform = this.platformPhysics.lastSafePlatformBefore(this.bike.x);

    let respawnX, respawnY;
    if (safePlatform) {
      respawnX = safePlatform.x + safePlatform.width / 2;
      respawnY = safePlatform.y - 50;
    } else {
      respawnX = 200;
      respawnY = this.groundY - 100;
    }

    this.bike.setPosition(respawnX, respawnY);
    this.bike.setVelocity(0, 0);

    this.showFloatingText('Hoppsan!', this.bike.x, this.bike.y - 80, '#fecaca', '#b91c1c');

    this.time.delayedCall(500, () => {
      this.respawning = false;
    });
  }

  bakeOutline(textureKey, thickness, color) {
    if (!this.textures.exists(textureKey)) return;
    const tex = this.textures.get(textureKey);
    const src = tex.getSourceImage();
    const w = src.width + thickness * 2;
    const h = src.height + thickness * 2;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    for (let dx = -thickness; dx <= thickness; dx++) {
      for (let dy = -thickness; dy <= thickness; dy++) {
        if (dx === 0 && dy === 0) continue;
        ctx.drawImage(src, thickness + dx, thickness + dy);
      }
    }
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(src, thickness, thickness);

    this.textures.remove(textureKey);
    this.textures.addCanvas(textureKey, canvas);
  }

  handlePokemonPickup(mon) {
    if (mon.getData('picked')) return;
    mon.setData('picked', true);
    const pokemonId = mon.getData('pokemonId');
    const shiny = mon.getData('shiny');
    const isBoss = mon.getData('isBoss');

    this.stickerBook.markSeen({ id: pokemonId, shiny });
    this.safePlay(shiny ? 'sfx-shiny' : 'sfx-pickup', { volume: 0.7 });

    if (shiny) this.spawnGlitter(mon.x, mon.y);

    if (isBoss) {
      this.starTracker.recordBossPickup();
      this.handleBossPickup();
    } else {
      this.starTracker.recordRandomPickup();
    }

    this.showFloatingText(shiny ? 'GLITTRIG!' : 'Bra jobbat!', this.bike.x + 60, this.bike.y - 80, '#bbf7d0', '#166534');

    const ring = mon.getData('ring');
    if (ring) {
      this.tweens.add({
        targets: ring,
        alpha: 0,
        scale: 1.6,
        duration: 500,
        onComplete: () => ring.destroy(),
      });
    }

    const trail = mon.getData('trail');
    if (trail) {
      trail.stop();
      this.time.delayedCall(800, () => trail.destroy());
    }
    const aura = mon.getData('aura');
    if (aura) {
      aura.stop();
      this.time.delayedCall(1200, () => aura.destroy());
    }

    this.tweens.add({
      targets: mon,
      y: mon.y - 80,
      alpha: 0,
      duration: 600,
      onComplete: () => mon.destroy(),
    });
  }

  handleBossPickup() {
    const stars = this.starTracker.computeStars();
    const storage = createStorage();
    setLevelStars(storage, this.levelId, stars);
    this.scene.start('ResultScene', {
      levelId: this.levelId,
      stars,
      pickedRandom: this.starTracker.randomPickedCount,
      totalRandom: this.levelLoader.data.randomCount,
    });
  }

  handlePowerUpPickup(pu) {
    if (pu.getData('picked')) return;
    pu.setData('picked', true);
    const type = pu.getData('puType');
    pu.destroy();
    this.activateBuff(type);
  }

  activateBuff(type) {
    this.activeBuff = type;
    // Sköld varar tills nästa bonk; magnet 8s
    if (type === 'shield') {
      this.buffEndsAt = Infinity;
    } else {
      this.buffEndsAt = this.time.now + 8000;
    }
    const labels = { magnet: 'Magnet!', shield: 'Sköld!', double: 'Dubbla poäng!' };
    const iconKey = type === 'magnet' ? 'pu-magnet' : type === 'shield' ? 'pu-shield' : 'pu-star';
    this.buffIcon.setTexture(iconKey).setVisible(true);
    this.showFloatingText(labels[type], this.scale.width / 2, 200, '#fef9c3', '#7c2d12');
    this.safePlay('sfx-shiny', { volume: 0.6 });
  }

  deactivateBuff() {
    this.activeBuff = null;
    this.buffText.setText('');
    this.buffIcon.setVisible(false);
  }

  showFloatingText(text, x, y, fillColor, strokeColor) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Arial Black',
      fontSize: '60px',
      color: fillColor,
      stroke: strokeColor,
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(2500).setScale(0.3);

    this.tweens.add({
      targets: t,
      scale: 1.1,
      duration: 220,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          alpha: 0,
          y: t.y - 50,
          duration: 600,
          delay: 350,
          onComplete: () => t.destroy(),
        });
      },
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

  update(time, delta) {
    // Cyklist-velocity: stopp vid level-slut, bonk-slowdown annars framåt
    if (this.bike.x >= this.levelLoader.length - 100) {
      this.bike.setVelocityX(0);
    } else if (!this.bonkUntilTime || this.time.now >= this.bonkUntilTime) {
      this.bike.setVelocityX(this.forwardSpeed);
    } else {
      this.bike.setVelocityX(this.forwardSpeed * 0.4);
    }

    // Auto-vault: hoppa automatiskt över markhinder
    const onGround = this.bike.body.blocked.down || this.bike.body.touching.down;
    const onPlatform = onGround && this.bike.y < this.groundY - 50;
    const bikeContext = onPlatform ? this.bike.y : 'ground';

    if (onGround && this.platformPhysics.shouldAutoVault(this.bike.x, bikeContext) && !this.autoVaultCooldown) {
      this.bike.setVelocityY(-700);  // mindre än manuellt hopp -820 (räcker för rocks/logs)
      this.autoVaultCooldown = true;
      this.safePlay('sfx-jump', { volume: 0.4 });  // tystare ljud än manuellt hopp
      this.time.delayedCall(400, () => {
        this.autoVaultCooldown = false;
      });
    }

    // Pit-detection: cyklist över pit OCH antingen fallit (y > groundY) eller stuck mot pit-vägg
    const overPit = this.platformPhysics.isOverPit(this.bike.x);
    const fallingOrStuck = this.bike.y > this.groundY ||
      this.bike.body.blocked.right ||
      this.bike.body.blocked.left;
    if (!this.respawning && overPit && fallingOrStuck) {
      this.handlePitFall();
    }

    // Delad puls för alla ringar (en sin-funktion istället för per-ring tweens).
    const phase = (Math.sin(this.time.now / 350) + 1) / 2;
    const pulseScale = 1 + phase * 0.15;
    const pulseAlpha = 0.4 + phase * 0.3;

    // Ring-puls för obstacles
    this.obstacles.children.each((o) => {
      if (o && o.body) {
        const ring = o.getData('ring');
        if (ring) {
          ring.setScale(pulseScale);
          ring.setAlpha(pulseAlpha);
        }
      }
      return true;
    });

    // Ring-puls för pokémon
    this.pokemons.children.each((m) => {
      if (m && m.body && !m.getData('picked')) {
        const ring = m.getData('ring');
        if (ring) {
          ring.setScale(pulseScale);
          ring.setAlpha(pulseAlpha);
        }
      }
      return true;
    });

    // Buff timer
    if (this.activeBuff && this.activeBuff !== 'shield') {
      const remaining = Math.max(0, Math.ceil((this.buffEndsAt - this.time.now) / 1000));
      this.buffText.setText(`${remaining}s`);
      if (this.time.now >= this.buffEndsAt) this.deactivateBuff();
    } else if (this.activeBuff === 'shield') {
      this.buffText.setText('');
    }

    // Magnet: dra pokémon mot cyklist
    if (this.activeBuff === 'magnet') {
      this.pokemons.children.each((m) => {
        if (m && m.body && !m.getData('picked')) {
          const dx = this.bike.x - m.x;
          const dy = this.bike.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 350 && dist > 1) {
            const pull = 250 / dist;
            m.body.velocity.x += dx * pull * (delta / 1000);
            m.body.velocity.y += dy * pull * (delta / 1000);
          }
        }
        return true;
      });
    }
  }
}
