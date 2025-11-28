import Phaser from 'phaser';
import config from './game/config.js';
import BootScene from './game/scenes/BootScene.js';
import MenuScene from './game/scenes/MenuScene.js';
import GameScene from './game/scenes/GameScene.js';

// Initialize Phaser game
const gameConfig = {
  ...config,
  scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(gameConfig);

console.log('[Game] Project Shooter initialized');
