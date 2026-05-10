import Phaser from 'phaser';
import { LEVELS } from '../data/levels.js';
import { createStorage, getAllLevelStars } from '../utils/storage.js';

const NODE_POSITIONS = {
  forest: [
    { x: 250, y: 540 },   // 1-1 (start, lower-left)
    { x: 640, y: 380 },   // 1-2 (mid)
    { x: 1030, y: 220 },  // 1-3 (upper-right)
  ],
  beach: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
  cave: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
  ocean: [
    { x: 250, y: 540 },
    { x: 640, y: 380 },
    { x: 1030, y: 220 },
  ],
};

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(data) {
    this.currentWorld = data?.worldId || 'forest';
  }

  preload() {
    this.load.image('worldmap-forest', 'worldmaps/forest.png');
    this.load.image('worldmap-beach', 'worldmaps/beach.png');
    this.load.image('worldmap-cave', 'worldmaps/cave.png');
    this.load.image('worldmap-ocean', 'worldmaps/ocean.png');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const storage = createStorage();
    const levelStars = getAllLevelStars(storage);

    // Bakgrund
    const bg = this.add.image(w / 2, h / 2, `worldmap-${this.currentWorld}`);
    bg.setDisplaySize(w, h);

    // Header med världsnamn
    const worldNames = { forest: 'SKOG', beach: 'STRAND', cave: 'GROTTA', ocean: 'HAV' };
    this.add.text(w / 2, 50, worldNames[this.currentWorld] || this.currentWorld.toUpperCase(), {
      fontSize: '48px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Render noder
    const positions = NODE_POSITIONS[this.currentWorld];
    const worldLevels = LEVELS.filter((l) => l.worldId === this.currentWorld);

    worldLevels.forEach((level, idx) => {
      const pos = positions[idx];
      const stars = levelStars[level.id]?.stars || 0;
      // Unlock-logik: första nivån alltid unlocked, övriga om föregående är completed
      const unlocked = idx === 0 || (worldLevels[idx - 1] && (levelStars[worldLevels[idx - 1].id]?.completed));
      this.renderNode(pos.x, pos.y, level, stars, unlocked);
    });

    // Hem-knapp
    const home = this.add.text(60, 50, '← HEM', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#222',
      padding: { x: 12, y: 6 },
      fontFamily: 'monospace',
    }).setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.scene.start('HomeScene'));
  }

  renderNode(x, y, level, stars, unlocked) {
    const bg = this.add.circle(x, y, 36, unlocked ? 0xffffff : 0x444444);
    bg.setStrokeStyle(4, unlocked ? 0x4a90d9 : 0x222222);

    if (unlocked) {
      this.add.text(x, y, level.id, {
        fontSize: '20px',
        color: '#333',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Stjärn-strip ovanför
      this.add.text(x, y - 60, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '20px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    } else {
      this.add.text(x, y, '🔒', { fontSize: '32px' }).setOrigin(0.5);
    }
  }
}
