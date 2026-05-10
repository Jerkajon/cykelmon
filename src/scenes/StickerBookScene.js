import Phaser from 'phaser';
import { POKEMON, pokemonByBiome } from '../data/pokemon.js';
import { BIOMES } from '../data/biomes.js';
import { StickerBook } from '../systems/StickerBook.js';
import { createStorage } from '../utils/storage.js';

export default class StickerBookScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StickerBookScene' });
  }

  preload() {
    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `pokemon/${p.id}.png`);
    }
  }

  create() {
    this.book = new StickerBook({
      storage: createStorage(),
      key: 'pokemoncykelspel.stickers',
    });

    // Glitter-textur (delas med GameScene om den finns redan)
    const glitterKey = 'glitter';
    if (!this.textures.exists(glitterKey)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(glitterKey, 8, 8);
      g.destroy();
    }

    // Sidor: en per biom + glittriga
    this.pages = BIOMES.map((b) => ({
      title: b.name,
      pokemons: pokemonByBiome(b.id),
      shinyPage: false,
    }));
    this.pages.push({ title: 'Glittriga!', pokemons: POKEMON, shinyPage: true });

    this.pageIdx = 0;
    this.renderPage();

    // Navigation
    const w = this.scale.width;
    const h = this.scale.height;

    const prevBtn = this.add.text(40, h / 2, '◀', {
      fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => this.prevPage());

    const nextBtn = this.add.text(w - 40, h / 2, '▶', {
      fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextPage());

    const homeBtn = this.add.text(20, 20, '← Hem', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true });
    homeBtn.on('pointerdown', () => this.scene.start('HomeScene'));
  }

  prevPage() {
    this.pageIdx = (this.pageIdx - 1 + this.pages.length) % this.pages.length;
    this.renderPage();
  }

  nextPage() {
    this.pageIdx = (this.pageIdx + 1) % this.pages.length;
    this.renderPage();
  }

  renderPage() {
    if (this.pageGroup) this.pageGroup.destroy(true);
    this.pageGroup = this.add.group();

    const w = this.scale.width;
    const h = this.scale.height;
    const page = this.pages[this.pageIdx];

    this.cameras.main.setBackgroundColor(page.shinyPage ? 0x1f1147 : 0xfff7e6);

    const titleColor = page.shinyPage ? '#fde047' : '#7c2d12';
    const titleStroke = page.shinyPage ? '#1d4ed8' : null;
    const title = this.add.text(w / 2, 60, page.title, {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: titleColor,
      stroke: titleStroke || undefined,
      strokeThickness: titleStroke ? 6 : 0,
    }).setOrigin(0.5);
    this.pageGroup.add(title);

    // Shiny-sida visar bara fångade shinies (löser dubblet-känslan).
    const visible = page.shinyPage
      ? page.pokemons.filter((p) => this.book.isShinySeen(p.id))
      : page.pokemons;

    if (page.shinyPage && visible.length === 0) {
      const empty = this.add.text(w / 2, h / 2, 'Inga glittriga än! ✨\n\nFortsätt spela för\natt hitta shiny-pokémon!', {
        fontFamily: 'Arial Black', fontSize: '32px',
        color: '#fde047', stroke: '#1d4ed8', strokeThickness: 5,
        align: 'center',
      }).setOrigin(0.5);
      this.pageGroup.add(empty);
      this.addPageIndicator();
      return;
    }

    const cols = page.shinyPage ? (visible.length <= 8 ? 4 : 6) : 6;
    const rows = Math.max(1, Math.ceil(visible.length / cols));
    const cellW = w * 0.7 / cols;
    const cellH = (h - 200) / rows;
    const startX = w * 0.15 + cellW / 2;
    const startY = 130 + cellH / 2;

    visible.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      if (page.shinyPage) {
        this.renderShinyCard(p, x, y, cellW, cellH);
      } else {
        this.renderRegularSticker(p, x, y, cellH);
      }
    });

    this.addPageIndicator();
  }

  renderRegularSticker(p, x, y, cellH) {
    const seen = this.book.isSeen(p.id);
    const count = this.book.getCount(p.id);
    const sprite = this.add.image(x, y, `pokemon-${p.id}`).setScale(2);
    if (!seen) {
      sprite.setTint(0x000000);
      sprite.setAlpha(0.25);
    }
    const label = this.add.text(x, y + cellH * 0.35, seen ? p.name : '???', {
      fontFamily: 'Arial', fontSize: '16px', color: '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.addMultiple([sprite, label]);
    if (count > 1) {
      const badge = this.add.text(x + 30, y - 30, `×${count}`, {
        fontFamily: 'Arial Black', fontSize: '14px',
        color: '#ffffff', stroke: '#7c2d12', strokeThickness: 3,
      }).setOrigin(0.5);
      this.pageGroup.add(badge);
    }
  }

  renderShinyCard(p, x, y, cellW, cellH) {
    const cardW = Math.min(cellW * 0.85, 130);
    const cardH = Math.min(cellH * 0.85, 170);

    // Holo-kort: gradient bakgrund + gul ram
    const cardBg = this.add.graphics();
    cardBg.fillGradientStyle(0xfde68a, 0xfca5a5, 0xa5b4fc, 0x86efac, 1);
    cardBg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
    cardBg.lineStyle(4, 0xfacc15, 1);
    cardBg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);

    const sprite = this.add.image(x, y - 8, `pokemon-${p.id}`).setScale(2);
    sprite.setTint(0xffffaa);
    sprite.postFX.addShine(0.4, 1, 8, false);

    this.tweens.add({
      targets: sprite,
      angle: { from: -3, to: 3 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const sparkle = this.add.particles(x, y, 'glitter', {
      lifespan: 700,
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      tint: [0xffd700, 0xffffff, 0xff99ff, 0xffffaa],
      quantity: 1,
      frequency: 220,
      blendMode: 'ADD',
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH) },
    });

    const label = this.add.text(x, y + cardH / 2 - 14, p.name, {
      fontFamily: 'Arial Black', fontSize: '14px',
      color: '#1f1147', stroke: '#fde047', strokeThickness: 3,
    }).setOrigin(0.5);

    this.pageGroup.addMultiple([cardBg, sprite, sparkle, label]);
  }

  addPageIndicator() {
    const w = this.scale.width;
    const h = this.scale.height;
    const indicator = this.add.text(w / 2, h - 30, `${this.pageIdx + 1} / ${this.pages.length}`, {
      fontFamily: 'Arial', fontSize: '20px',
      color: this.pages[this.pageIdx].shinyPage ? '#fde047' : '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.add(indicator);
  }
}
