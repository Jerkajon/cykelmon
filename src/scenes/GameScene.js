import Phaser from 'phaser';
import { ObstacleSpawner } from '../systems/ObstacleSpawner.js';
import { PokemonSpawner } from '../systems/PokemonSpawner.js';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage } from '../utils/storage.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
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

    this.physics.add.overlap(this.bike, this.obstacles, (bike, obstacle) => {
      this.handleBonk(obstacle);
    });
    this.bonkUntilTime = 0;

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

    // Tap → hopp om vi står på marken.
    this.input.on('pointerdown', () => this.tryJump());
  }

  tryJump() {
    if (this.bike.body.blocked.down || this.bike.body.touching.down) {
      this.bike.setVelocityY(-700);
    }
  }

  spawnObstacle(type) {
    const w = this.scale.width;
    const groundY = this.scale.height - 80;
    const key = type === 'rock' ? 'obstacle-rock' : 'obstacle-rock';
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

    // Float-up + fade.
    this.tweens.add({
      targets: mon,
      y: mon.y - 80,
      alpha: 0,
      duration: 600,
      onComplete: () => mon.destroy(),
    });
  }

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
}
