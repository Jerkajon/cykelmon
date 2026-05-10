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
    const w = this.scale.width;
    const h = this.scale.height;

    // Bakgrund — soft fade
    this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0, 0);

    // "NIVÅ KLAR!"
    this.add.text(w / 2, 100, `${this.levelId} KLAR!`, {
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
      const x = w / 2 - starSpacing + i * starSpacing;
      const filled = i < this.stars;
      this.add.text(x, starY, filled ? '★' : '☆', {
        fontSize: '120px',
        color: filled ? '#ffd700' : '#666',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Pokémon-räknare (boss + random)
    this.add.text(w / 2, 400,
      `Pokémon: ${this.pickedRandom + 1}/${this.totalRandom + 1}`, {
      fontSize: '36px',
      color: '#fff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Knappar
    const btnY = 500;

    const replay = this.add.text(w / 2 - 200, btnY, 'OM IGEN', {
      fontSize: '36px',
      color: '#fff',
      backgroundColor: '#4a90d9',
      padding: { x: 24, y: 12 },
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const map = this.add.text(w / 2 + 200, btnY, 'KARTA', {
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
