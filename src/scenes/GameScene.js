import Phaser from 'phaser';
import { ObstacleSpawner } from '../systems/ObstacleSpawner.js';
import { PokemonSpawner } from '../systems/PokemonSpawner.js';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage } from '../utils/storage.js';
import { POKEMON } from '../data/pokemon.js';
import { BIOMES, biomeById } from '../data/biomes.js';
import { BiomeManager } from '../systems/BiomeManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.on('loaderror', (file) => {
      // Tyst fail för audio så v1 fungerar utan ljudfiler.
      // Pokémon-sprite-fel ska däremot synas.
      if (file.type === 'audio') return;
      console.warn('Asset load error:', file.key, file.src);
    });
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

    // Hindergenerator
    this.obstacleSpawner = new ObstacleSpawner({
      obstacleTypes: ['rock'],
      minIntervalMs: 1500,
      spawnWindowMs: 1500,
    });
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });

    // Procedural placeholder-texturer för alla obstacle-typer
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

    const glitterKey = 'glitter';
    if (!this.textures.exists(glitterKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(glitterKey, 8, 8);
      g.destroy();
    }

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

    this.physics.add.overlap(this.bike, this.obstacles, (bike, obstacle) => {
      this.handleBonk(obstacle);
    });
    this.bonkUntilTime = 0;

    // Klistermärkesbok
    this.stickerBook = new StickerBook({
      storage: createStorage(),
      key: 'pokemoncykelspel.stickers',
    });

    // Pokémon-spawner med startbiomets ids
    this.pokemonSpawner = new PokemonSpawner({
      pokemonIds: startBiome.pokemonIds,
      minIntervalMs: 3000,
      spawnWindowMs: 2000,
      shinyChance: 1 / 50,
    });
    this.pokemons = this.physics.add.group({ allowGravity: false });

    // Tracking för pokemon-spawner gap-regel
    this.timeSinceLastObstacleSpawn = 9999;

    this.physics.add.overlap(this.bike, this.pokemons, (bike, mon) => this.handlePokemonPickup(mon));

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

    this.safeBgm(`bgm-${startBiome.id}`);
  }

  tryJump() {
    if (this.bike.body.blocked.down || this.bike.body.touching.down) {
      this.bike.setVelocityY(-700);
      this.safePlay('sfx-jump', { volume: 0.6 });
    }
  }

  spawnObstacle(type) {
    const w = this.scale.width;
    const groundY = this.scale.height - 80;
    const key = `obstacle-${type}`;
    const obstacle = this.obstacles.create(w + 50, groundY - 30, key);
    obstacle.setVelocityX(-this.scrollSpeed);
    obstacle.body.setSize(30, 30);
    obstacle.setData('type', type);
  }

  handleBonk(obstacle) {
    if (this.time.now < this.bonkUntilTime) return; // redan i bonk-läge
    this.bonkUntilTime = this.time.now + 500;

    // Förstör hindret så vi inte triggas igen.
    obstacle.destroy();

    // Kort sprite-tint + camera shake.
    this.bike.setTint(0xff8888);
    this.safePlay('sfx-bonk', { volume: 0.7 });
    this.cameras.main.shake(150, 0.005);
    this.time.delayedCall(300, () => this.bike.clearTint());
  }

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
    this.safePlay(shiny ? 'sfx-shiny' : 'sfx-pickup', { volume: 0.7 });

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

  update(time, delta) {
    const inBonk = this.time.now < this.bonkUntilTime;
    const effectiveSpeed = inBonk ? this.scrollSpeed * 0.4 : this.scrollSpeed;
    this.biomeManager.tick(delta);
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
}
