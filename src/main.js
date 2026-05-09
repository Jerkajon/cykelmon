import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import GameScene from './scenes/GameScene.js';
import StickerBookScene from './scenes/StickerBookScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
    },
  },
  scene: [HomeScene, GameScene, StickerBookScene],
};

new Phaser.Game(config);
