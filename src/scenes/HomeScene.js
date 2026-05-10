import Phaser from 'phaser';
import { createStorage } from '../utils/storage.js';
import { CYCLES, unlockedCycles, nextCycle } from '../data/cycles.js';

const SHOWCASE = [25, 133, 7, 1, 16, 43, 79];
const LIFETIME_KEY = 'pokemoncykelspel.lifetimeCount';
const SELECTED_KEY = 'pokemoncykelspel.selectedCycle';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  preload() {
    for (const id of SHOWCASE) {
      this.load.image(`pokemon-${id}`, `pokemon/${id}.png`);
    }
    this.load.image('bike', 'characters/bike.png');
    this.load.image('bike-red', 'characters/bike-red.png');
    this.load.image('bike-purple', 'characters/bike-unicycle.png');
    this.load.image('bike-gold', 'characters/bike-hover.png');
    this.load.on('loaderror', (file) => {
      if (file.key && file.key.startsWith('bike-')) return;
    });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(0xfde8ff);

    // Rainbow gradient (4-corner)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xff9aa2, 0xfff3a0, 0xa8e6ff, 0xc8b6ff, 1);
    bg.fillRect(0, 0, w, h);

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

    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.6;
      const r = 20 + Math.random() * 60;
      this.add.circle(x, y, r, 0xffffff, 0.18);
    }

    // Pokeball-textur (för räknare-stil) — generera en gång per scen.
    this.makePokeballTexture();

    // Title
    this.add.text(w / 2, h * 0.11, 'POKÉMON', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.13) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 10,
    }).setOrigin(0.5).setShadow(0, 5, '#1e3a8a', 6, false, true);

    this.add.text(w / 2, h * 0.22, 'CYKELSPEL', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.06) + 'px',
      color: '#ffffff', stroke: '#1d4ed8', strokeThickness: 6,
    }).setOrigin(0.5);

    // Tagline
    this.add.text(w / 2, h * 0.31, 'Fånga dem alla!', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.04) + 'px',
      color: '#fef9c3', stroke: '#b45309', strokeThickness: 4,
    }).setOrigin(0.5);

    // Pokémon-rad
    const showcaseY = h * 0.42;
    const spacing = w / (SHOWCASE.length + 1);
    SHOWCASE.forEach((id, i) => {
      const x = spacing * (i + 1);
      this.add.ellipse(x, showcaseY + 50, 60, 14, 0x000000, 0.15);
      const sprite = this.add.image(x, showcaseY, `pokemon-${id}`).setScale(1.6);
      this.tweens.add({
        targets: sprite,
        y: showcaseY - 12,
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    // Highscore-pill med pokeball
    const hs = createStorage().get('pokemoncykelspel.highscore') || 0;
    if (hs > 0) {
      const hsY = h * 0.55;
      const hsPill = this.add.graphics();
      hsPill.fillStyle(0x1d4ed8, 0.85);
      hsPill.fillRoundedRect(w * 0.35, hsY - 22, w * 0.30, 44, 22);
      hsPill.lineStyle(3, 0xfde047, 1);
      hsPill.strokeRoundedRect(w * 0.35, hsY - 22, w * 0.30, 44, 22);
      this.add.image(w * 0.38, hsY, 'pokeball-icon').setScale(0.7);
      this.add.text(w * 0.42, hsY, `Bästa: ${hs}`, {
        fontFamily: 'Arial Black', fontSize: '24px',
        color: '#fde047', stroke: '#1e3a8a', strokeThickness: 4,
      }).setOrigin(0, 0.5);
    }

    // Cykel-väljare
    this.lifetime = createStorage().get(LIFETIME_KEY) || 0;
    this.unlocked = unlockedCycles(this.lifetime);
    const savedId = createStorage().get(SELECTED_KEY);
    let savedIdx = this.unlocked.findIndex((c) => c.id === savedId);
    this.cycleIdx = savedIdx >= 0 ? savedIdx : this.unlocked.length - 1;

    this.cycleGroup = this.add.group();
    this.renderCycleSelector();

    // SPELA-knapp
    const playY = h * 0.84;
    const playBtn = this.add.rectangle(w / 2, playY, w * 0.4, h * 0.10, 0xfacc15)
      .setStrokeStyle(7, 0x713f12)
      .setInteractive({ useHandCursor: true });
    const playLabel = this.add.text(w / 2, playY, 'SPELA!', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.06) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => this.scene.start('GameScene'));
    this.tweens.add({
      targets: [playBtn, playLabel],
      scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });

    // KLISTERMÄRKEN-knapp
    const bookY = h * 0.94;
    const bookBtn = this.add.rectangle(w / 2, bookY, w * 0.28, h * 0.06, 0xfb923c)
      .setStrokeStyle(4, 0x7c2d12)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, bookY, 'KLISTERMÄRKEN', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.028) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    bookBtn.on('pointerdown', () => this.scene.start('StickerBookScene'));
  }

  renderCycleSelector() {
    this.cycleGroup.clear(true, true);
    const w = this.scale.width;
    const h = this.scale.height;
    const cy = h * 0.69;
    const cycle = this.unlocked[this.cycleIdx];
    const next = nextCycle(this.lifetime);
    const canSwitch = this.unlocked.length > 1;

    // Cykel-sprite
    const bikeKey = this.textures.exists(`bike-${cycle.id}`) ? `bike-${cycle.id}` : 'bike';
    const bikeSprite = this.add.image(w / 2, cy, bikeKey).setScale(0.85);
    if (bikeKey === 'bike' && cycle.tint !== 0xffffff) bikeSprite.setTint(cycle.tint);
    if (cycle.glow) bikeSprite.postFX.addGlow(cycle.tint, 6, 0, false, 0.1, 12);
    this.cycleGroup.add(bikeSprite);

    // Pilar
    const arrowL = this.add.text(w / 2 - 100, cy, '◀', {
      fontFamily: 'Arial Black', fontSize: '36px',
      color: canSwitch ? '#1d4ed8' : '#9ca3af',
      stroke: '#fde047', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const arrowR = this.add.text(w / 2 + 100, cy, '▶', {
      fontFamily: 'Arial Black', fontSize: '36px',
      color: canSwitch ? '#1d4ed8' : '#9ca3af',
      stroke: '#fde047', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    if (canSwitch) {
      arrowL.on('pointerdown', () => this.changeCycle(-1));
      arrowR.on('pointerdown', () => this.changeCycle(1));
    }
    this.cycleGroup.addMultiple([arrowL, arrowR]);

    // Namn
    const nameTxt = this.add.text(w / 2, cy + 50, cycle.name, {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.034) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 5,
    }).setOrigin(0.5);
    this.cycleGroup.add(nameTxt);

    // Status
    let statusText;
    if (next) {
      statusText = `Nästa: ${next.name} (${this.lifetime}/${next.threshold})`;
    } else {
      statusText = 'Alla cyklar upplåsta!';
    }
    const status = this.add.text(w / 2, cy + 78, statusText, {
      fontFamily: 'Arial', fontSize: Math.floor(h * 0.025) + 'px',
      color: '#1f2937',
    }).setOrigin(0.5);
    this.cycleGroup.add(status);
  }

  changeCycle(delta) {
    this.cycleIdx = (this.cycleIdx + delta + this.unlocked.length) % this.unlocked.length;
    createStorage().set(SELECTED_KEY, this.unlocked[this.cycleIdx].id);
    this.renderCycleSelector();
  }

  makePokeballTexture() {
    if (this.textures.exists('pokeball-icon')) return;
    const g = this.add.graphics();
    // Röd överdel
    g.fillStyle(0xee1515, 1);
    g.slice(20, 20, 18, Math.PI, 0, true);
    g.fillPath();
    // Vit underdel
    g.fillStyle(0xffffff, 1);
    g.slice(20, 20, 18, 0, Math.PI, true);
    g.fillPath();
    // Svart kant
    g.lineStyle(2.5, 0x000000, 1);
    g.strokeCircle(20, 20, 18);
    // Mittstreck
    g.lineStyle(3, 0x000000, 1);
    g.beginPath();
    g.moveTo(2, 20);
    g.lineTo(38, 20);
    g.strokePath();
    // Knapp i mitten
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 6);
    g.lineStyle(2.5, 0x000000, 1);
    g.strokeCircle(20, 20, 6);
    g.generateTexture('pokeball-icon', 40, 40);
    g.destroy();
  }
}
