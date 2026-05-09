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

    // Sidor: en per biom + shinies
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

    this.cameras.main.setBackgroundColor(0xfff7e6);

    const title = this.add.text(w / 2, 60, page.title, {
      fontFamily: 'Arial Black', fontSize: '48px', color: '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.add(title);

    // Grid: 4 kolumner × 2 rader för 8 Pokémon (för shiny-sidan: 6×4 om 24)
    const cols = page.shinyPage ? 6 : 4;
    const rows = Math.ceil(page.pokemons.length / cols);
    const cellW = w * 0.7 / cols;
    const cellH = (h - 200) / rows;
    const startX = w * 0.15 + cellW / 2;
    const startY = 130 + cellH / 2;

    page.pokemons.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const seen = page.shinyPage ? this.book.isShinySeen(p.id) : this.book.isSeen(p.id);
      const sprite = this.add.image(x, y, `pokemon-${p.id}`).setScale(2);
      if (!seen) {
        sprite.setTint(0x000000);
        sprite.setAlpha(0.25);
      } else if (page.shinyPage) {
        sprite.setTint(0xffffaa);
      }

      const label = this.add.text(x, y + cellH * 0.35, seen ? p.name : '???', {
        fontFamily: 'Arial', fontSize: '16px', color: '#7c2d12',
      }).setOrigin(0.5);

      this.pageGroup.addMultiple([sprite, label]);
    });

    // Sid-indikator
    const indicator = this.add.text(w / 2, h - 30, `${this.pageIdx + 1} / ${this.pages.length}`, {
      fontFamily: 'Arial', fontSize: '20px', color: '#7c2d12',
    }).setOrigin(0.5);
    this.pageGroup.add(indicator);
  }
}
