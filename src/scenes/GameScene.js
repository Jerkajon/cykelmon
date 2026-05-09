import Phaser from 'phaser';
import { ObstacleSpawner } from '../systems/ObstacleSpawner.js';

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
}
