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
