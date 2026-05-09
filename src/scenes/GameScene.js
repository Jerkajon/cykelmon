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
