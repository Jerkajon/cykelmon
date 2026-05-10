import Phaser from 'phaser';
import { LEVELS } from '../data/levels.js';
import { createStorage, getAllLevelStars } from '../utils/storage.js';

// Node-positioner anpassade per värld baserat på de faktiska clearings
// i de DrawThings-genererade world-map-bakgrunderna.
const NODE_POSITIONS = {
  forest: [
    { x: 190, y: 470 },   // 1-1 (lower-left clearing där stigen börjar)
    { x: 620, y: 280 },   // 1-2 (centrum-öppning där stigar möts)
    { x: 1090, y: 360 },  // 1-3 (höger-mitten där stigen försvinner)
  ],
  beach: [
    { x: 230, y: 380 },   // 2-1 (vänster sandyta)
    { x: 620, y: 250 },   // 2-2 (center sand-clearing)
    { x: 1010, y: 410 },  // 2-3 (höger med palmer)
  ],
  cave: [
    { x: 190, y: 460 },   // 3-1 (vid första torch)
    { x: 640, y: 230 },   // 3-2 (största kristall-clearing)
    { x: 1080, y: 470 },  // 3-3 (höger sten-yta)
  ],
  ocean: [
    { x: 360, y: 480 },   // 4-1 (nedre vänster ö)
    { x: 640, y: 360 },   // 4-2 (mitten där broar möts)
    { x: 940, y: 200 },   // 4-3 (övre höger ö)
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
    this.load.image('worldmap-bike', 'characters/bike.png');
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

    // Cyklist på senaste klarade nod (eller nästa unlocked om alla klarade)
    let bikeNodeIdx = 0;
    for (let i = worldLevels.length - 1; i >= 0; i--) {
      if (levelStars[worldLevels[i].id]?.completed) {
        bikeNodeIdx = Math.min(i + 1, worldLevels.length - 1);
        break;
      }
    }
    const bikePos = positions[bikeNodeIdx];
    const bikeSprite = this.add.image(bikePos.x, bikePos.y - 70, 'worldmap-bike');
    bikeSprite.setScale(0.6);
    this.tweens.add({
      targets: bikeSprite,
      y: bikePos.y - 80,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: 'Sine.inOut',
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
