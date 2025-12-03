import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const movementMode = window.GAME_MOVEMENT_MODE || 'full';

    // Title
    this.add.text(width / 2, height / 4, 'PROJECT\nSHOOTER', {
      fontSize: '42px',
      color: '#00ff00',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Instructions (change based on movement mode)
    const controls = movementMode === 'horizontal' 
      ? 'A/D or Left/Right Arrows\nto Move\n\nSPACE to Shoot'
      : 'WASD or Arrow Keys\nto Move\n\nSPACE to Shoot';
    
    this.add.text(width / 2, height / 2, controls, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Start button
    const startText = this.add.text(width / 2, height * 0.68, 'TAP TO START', {
      fontSize: '28px',
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
    this.add.text(width / 2, height * 0.88, `High Score: ${highScore}`, {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }
}
