import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

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
  scene: [GameScene],
};

new Phaser.Game(config);
