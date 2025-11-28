import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(400, 300, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // No assets to load - using placeholder graphics
    // Future: Load sprites, sounds, etc. here
  }

  create() {
    console.log('[BootScene] Boot complete');
    this.scene.start('MenuScene');
  }
}
