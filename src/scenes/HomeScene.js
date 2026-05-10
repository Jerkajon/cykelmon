import Phaser from 'phaser';
import { createStorage, getTotalStars } from '../utils/storage.js';
import { unlockedCycles, nextCycle } from '../data/cycles.js';

const SELECTED_KEY = 'pokemoncykelspel.selectedCycle';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  preload() {
    this.load.image('pokemon-25', 'pokemon/25.png');  // Pikachu
    this.load.image('title-bg', 'title/intro-bg.png');
    this.load.image('title-logo', 'title/pokemon-logo.png');
    this.load.image('btn-play', 'title/btn-play.png');
    this.load.image('btn-stickers', 'title/btn-stickers.png');
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

    // Bakgrund: FLUX-genererad ljusblå Yellow-stil sky
    this.add.image(w / 2, h / 2, 'title-bg').setDisplaySize(w, h);

    this.makePokeballTexture();

    // Logo (FLUX-genererad pixel-art) — pulse-tween för glow-känsla
    const logo = this.add.image(w / 2, h * 0.13, 'title-logo').setScale(0.6);
    this.tweens.add({
      targets: logo,
      scale: { from: 0.6, to: 0.64 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });

    // CYKELSPEL-subtitle (Phaser-text, gul med blå outline för att matcha logo)
    this.add.text(w / 2, h * 0.22, 'CYKELSPEL', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.05) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 6,
    }).setOrigin(0.5).setShadow(0, 4, '#1e3a8a', 5, false, true);

    // Bouncy Pikachu — 3-åring-vänlig, högre upp så cykel-väljare får plats
    const pikaY = h * 0.34;
    this.add.ellipse(w / 2, pikaY + 50, 80, 16, 0x000000, 0.25);
    const pika = this.add.image(w / 2, pikaY, 'pokemon-25').setScale(1.9);
    this.tweens.add({
      targets: pika,
      y: pikaY - 26,
      duration: 600, yoyo: true, repeat: -1, ease: 'Quad.inOut',
    });
    this.tweens.add({
      targets: pika,
      angle: { from: -4, to: 4 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });

    // Highscore-pill (samma som innan, men flyttad till övre vänstra hörnet)
    const hs = createStorage().get('pokemoncykelspel.highscore') || 0;
    if (hs > 0) {
      const hsX = w * 0.12;
      const hsY = h * 0.06;
      const hsPill = this.add.graphics();
      hsPill.fillStyle(0x1d4ed8, 0.85);
      hsPill.fillRoundedRect(hsX - w * 0.10, hsY - 22, w * 0.20, 44, 22);
      hsPill.lineStyle(3, 0xfde047, 1);
      hsPill.strokeRoundedRect(hsX - w * 0.10, hsY - 22, w * 0.20, 44, 22);
      this.add.image(hsX - w * 0.075, hsY, 'pokeball-icon').setScale(0.7);
      this.add.text(hsX - w * 0.05, hsY, `Bästa: ${hs}`, {
        fontFamily: 'Arial Black', fontSize: '20px',
        color: '#fde047', stroke: '#1e3a8a', strokeThickness: 4,
      }).setOrigin(0, 0.5);
    }

    // Cykel-väljare — trösklar baseras på totala stjärnor (12 nivåer × 3 = 36 max)
    this.totalStars = getTotalStars(createStorage());
    this.unlocked = unlockedCycles(this.totalStars);
    const savedId = createStorage().get(SELECTED_KEY);
    let savedIdx = this.unlocked.findIndex((c) => c.id === savedId);
    this.cycleIdx = savedIdx >= 0 ? savedIdx : this.unlocked.length - 1;

    this.cycleGroup = this.add.group();
    this.renderCycleSelector();

    // SPELA-knapp — FLUX-genererad lightning-bolt central som primary CTA
    const playY = h * 0.78;
    const playBtn = this.add.image(w / 2, playY, 'btn-play').setScale(0.36)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, playY, 'SPELA!', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.055) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 6,
    }).setOrigin(0.5).setShadow(0, 4, '#1e3a8a', 5, false, true);
    playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));
    this.tweens.add({
      targets: playBtn,
      scale: { from: 0.36, to: 0.40 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });

    // KLISTERMÄRKEN-knapp — pokemon-bok-ikon i nedre vänstra hörnet
    const bookX = w * 0.10;
    const bookY = h * 0.86;
    const bookBtn = this.add.image(bookX, bookY, 'btn-stickers').setScale(0.18)
      .setInteractive({ useHandCursor: true });
    this.add.text(bookX, bookY + h * 0.09, 'KLISTERMÄRKEN', {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.025) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 4,
    }).setOrigin(0.5);
    bookBtn.on('pointerdown', () => this.scene.start('StickerBookScene'));
  }

  renderCycleSelector() {
    this.cycleGroup.clear(true, true);
    const w = this.scale.width;
    const h = this.scale.height;
    const cy = h * 0.52;
    const cycle = this.unlocked[this.cycleIdx];
    const next = nextCycle(this.totalStars);
    const canSwitch = this.unlocked.length > 1;

    // Cykel-sprite
    const bikeKey = this.textures.exists(`bike-${cycle.id}`) ? `bike-${cycle.id}` : 'bike';
    const bikeSprite = this.add.image(w / 2, cy, bikeKey).setScale(0.7);
    if (bikeKey === 'bike' && cycle.tint !== 0xffffff) bikeSprite.setTint(cycle.tint);
    if (cycle.glow) bikeSprite.postFX.addGlow(cycle.tint, 6, 0, false, 0.1, 12);
    this.cycleGroup.add(bikeSprite);

    // Pilar
    const arrowL = this.add.text(w / 2 - 110, cy, '◀', {
      fontFamily: 'Arial Black', fontSize: '32px',
      color: canSwitch ? '#1d4ed8' : '#9ca3af',
      stroke: '#fde047', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const arrowR = this.add.text(w / 2 + 110, cy, '▶', {
      fontFamily: 'Arial Black', fontSize: '32px',
      color: canSwitch ? '#1d4ed8' : '#9ca3af',
      stroke: '#fde047', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    if (canSwitch) {
      arrowL.on('pointerdown', () => this.changeCycle(-1));
      arrowR.on('pointerdown', () => this.changeCycle(1));
    }
    this.cycleGroup.addMultiple([arrowL, arrowR]);

    // Namn + status (kompakt, för plats med ny layout)
    const nameTxt = this.add.text(w / 2, cy + 38, cycle.name, {
      fontFamily: 'Arial Black', fontSize: Math.floor(h * 0.028) + 'px',
      color: '#fde047', stroke: '#1d4ed8', strokeThickness: 4,
    }).setOrigin(0.5);
    this.cycleGroup.add(nameTxt);

    const statusText = next
      ? `Nästa: ${next.name} (${this.totalStars}/${next.threshold} ★)`
      : 'Alla cyklar upplåsta!';
    const status = this.add.text(w / 2, cy + 60, statusText, {
      fontFamily: 'Arial', fontSize: Math.floor(h * 0.022) + 'px',
      color: '#1f2937', backgroundColor: '#ffffffaa',
      padding: { x: 6, y: 2 },
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
    g.fillStyle(0xee1515, 1);
    g.slice(20, 20, 18, Math.PI, 0, false);
    g.fillPath();
    g.fillStyle(0xffffff, 1);
    g.slice(20, 20, 18, 0, Math.PI, false);
    g.fillPath();
    g.lineStyle(2.5, 0x000000, 1);
    g.strokeCircle(20, 20, 18);
    g.lineStyle(3, 0x000000, 1);
    g.beginPath();
    g.moveTo(2, 20);
    g.lineTo(38, 20);
    g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 6);
    g.lineStyle(2.5, 0x000000, 1);
    g.strokeCircle(20, 20, 6);
    g.generateTexture('pokeball-icon', 40, 40);
    g.destroy();
  }
}
