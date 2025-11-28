import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const movementMode = this.game.config.movementMode || 'full';

    // Title
    this.add.text(width / 2, height / 3, 'PROJECT SHOOTER', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions (change based on movement mode)
    const controls = movementMode === 'horizontal' 
      ? 'A/D or Left/Right Arrows to Move\nSPACE to Shoot'
      : 'WASD or Arrow Keys to Move\nSPACE to Shoot';
    
    this.add.text(width / 2, height / 2, controls, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Start button
    const startText = this.add.text(width / 2, height * 0.7, 'CLICK TO START', {
      fontSize: '32px',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Make it interactive
    startText.setInteractive({ useHandCursor: true });
    
    // Pulse effect
    this.tweens.add({
      targets: startText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    startText.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // High score from localStorage
    const highScore = localStorage.getItem('highScore') || 0;
    this.add.text(width / 2, height * 0.85, `High Score: ${highScore}`, {
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }
}
