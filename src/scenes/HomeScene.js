import Phaser from 'phaser';
import { createStorage } from '../utils/storage.js';

const SHOWCASE = [25, 133, 7, 1, 16, 43, 79];

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  preload() {
    for (const id of SHOWCASE) {
      this.load.image(`pokemon-${id}`, `pokemon/${id}.png`);
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(0xfde8ff);

    // Rainbow gradient (4-corner)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xff9aa2, 0xfff3a0, 0xa8e6ff, 0xc8b6ff, 1);
    bg.fillRect(0, 0, w, h);

    // Soft glow rays från botten
    const rays = this.add.graphics();
    rays.fillStyle(0xffffff, 0.18);
    const cx = w / 2;
    const cy = h * 0.95;
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + (i - 5.5) * 0.18;
      const len = h * 1.2;
      const x2 = cx + Math.cos(angle) * len;
      const y2 = cy + Math.sin(angle) * len;
      rays.fillTriangle(cx - 30, cy, cx + 30, cy, x2, y2);
    }

    // Pastell-bollar / "moln"
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.6;
      const r = 20 + Math.random() * 60;
      this.add.circle(x, y, r, 0xffffff, 0.18);
    }

    // Title — Pokémon-stil gult fyll, blå stroke
    this.add.text(w / 2, h * 0.16, 'POKÉMON', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.16) + 'px',
      color: '#fde047',
      stroke: '#1d4ed8',
      strokeThickness: 12,
      align: 'center',
    }).setOrigin(0.5).setShadow(0, 6, '#1e3a8a', 8, false, true);

    this.add.text(w / 2, h * 0.30, 'CYKELSPEL', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.075) + 'px',
      color: '#ffffff',
      stroke: '#1d4ed8',
      strokeThickness: 7,
      align: 'center',
    }).setOrigin(0.5);

    // Pokémon-rad mitt i — bouncar mjukt
    const showcaseY = h * 0.55;
    const spacing = w / (SHOWCASE.length + 1);
    SHOWCASE.forEach((id, i) => {
      const x = spacing * (i + 1);
      // Skugga under
      this.add.ellipse(x, showcaseY + 70, 80, 18, 0x000000, 0.15);
      const sprite = this.add.image(x, showcaseY, `pokemon-${id}`).setScale(2.2);
      this.tweens.add({
        targets: sprite,
        y: showcaseY - 14,
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    // Tagline
    this.add.text(w / 2, h * 0.42, 'Fånga dem alla!', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.045) + 'px',
      color: '#fef9c3',
      stroke: '#b45309',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // High score-banner
    const hs = createStorage().get('pokemoncykelspel.highscore') || 0;
    if (hs > 0) {
      this.add.text(w / 2, h * 0.69, `🏆 Bästa: ${hs}`, {
        fontFamily: 'Arial Black',
        fontSize: Math.floor(h * 0.04) + 'px',
        color: '#fde047',
        stroke: '#1d4ed8',
        strokeThickness: 4,
      }).setOrigin(0.5);
    }

    // SPELA-knapp
    const playBtn = this.add.rectangle(w / 2, h * 0.78, w * 0.45, h * 0.13, 0xfacc15)
      .setStrokeStyle(8, 0x713f12)
      .setInteractive({ useHandCursor: true });
    const playLabel = this.add.text(w / 2, h * 0.78, 'SPELA!', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.075) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    playBtn.on('pointerover', () => playBtn.setScale(1.04));
    playBtn.on('pointerout', () => playBtn.setScale(1));
    playBtn.on('pointerdown', () => this.scene.start('GameScene'));
    this.tweens.add({
      targets: [playBtn, playLabel],
      scale: { from: 1, to: 1.03 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // KLISTERMÄRKEN-knapp
    const bookBtn = this.add.rectangle(w / 2, h * 0.92, w * 0.32, h * 0.08, 0xfb923c)
      .setStrokeStyle(5, 0x7c2d12)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.92, 'KLISTERMÄRKEN', {
      fontFamily: 'Arial Black',
      fontSize: Math.floor(h * 0.032) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    bookBtn.on('pointerdown', () => this.scene.start('StickerBookScene'));
  }
}
