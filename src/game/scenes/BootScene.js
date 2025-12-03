import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Load shooter sprites
    this.load.image('player', 'assets/shooters/greensoldier-transparent.png');
    
    // Load enemy sprite - dragon
    this.load.image('enemy', 'assets/shooters/grand-archivist-elieth-obsidian-armored-dragon-eldorian-library-16x9.png');
    
    // Add more as they become available:
    // this.load.image('player-blue', 'assets/shooters/blue-special-ops.png');
    // this.load.image('player-gold', 'assets/shooters/gold-commander.png');
  }

  create() {
    // Create lvl1PowerUp texture - yellow shooting speed boost
    if (!this.textures.exists('powerup_lvl1PowerUp')) {
      const graphics = this.add.graphics();
      
      // Yellow star for shooting speed boost
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(20, 20, 18);
      
      // Inner star shape
      graphics.fillStyle(0xffaa00, 1);
      graphics.fillCircle(20, 20, 12);
      
      // White center
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(20, 20, 6);
      
      graphics.generateTexture('powerup_lvl1PowerUp', 40, 40);
      graphics.destroy();
      
      console.log('[BootScene] Created lvl1PowerUp texture');
    }
    
    // Create lvl2PowerUp texture - red firepower boost
    if (!this.textures.exists('powerup_lvl2PowerUp')) {
      const graphics = this.add.graphics();
      
      // Red circle for firepower boost
      graphics.fillStyle(0xff0000, 1);
      graphics.fillCircle(20, 20, 18);
      
      // Inner circle
      graphics.fillStyle(0xaa0000, 1);
      graphics.fillCircle(20, 20, 12);
      
      // White center
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(20, 20, 6);
      
      graphics.generateTexture('powerup_lvl2PowerUp', 40, 40);
      graphics.destroy();
      
      console.log('[BootScene] Created lvl2PowerUp texture');
    }
    
    // Create boss textures
    if (!this.textures.exists('boss_normal')) {
      const graphics = this.add.graphics();
      
      // Red block for normal boss (similar to enemies but larger)
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 55, 55); // Slightly larger than original 50x50
      
      // Add eyes like enemies but larger
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(16.5, 16.5, 7);  // Left eye (scaled)
      graphics.fillCircle(38.5, 16.5, 7);  // Right eye (scaled)
      
      // Add a mouth
      graphics.fillStyle(0x000000, 1);
      graphics.fillRect(22, 33, 11, 4); // Mouth (scaled)
      
      graphics.generateTexture('boss_normal', 55, 55);
      graphics.destroy();
      
      console.log('[BootScene] Created boss_normal texture (55x55)');
    }
    
    if (!this.textures.exists('boss_pink')) {
      const graphics = this.add.graphics();
      
      // Pink block for special boss - same size as red boss
      graphics.fillStyle(0xff69b4, 1);
      graphics.fillRect(0, 0, 55, 55);
      
      // Add a big white X in the center for visibility
      graphics.lineStyle(4, 0xffffff, 1);
      graphics.lineBetween(11, 11, 44, 44); // Top-left to bottom-right
      graphics.lineBetween(44, 11, 11, 44); // Top-right to bottom-left
      
      // Add pink outline
      graphics.lineStyle(2, 0xff1493, 1);
      graphics.strokeRect(0, 0, 55, 55);
      
      graphics.generateTexture('boss_pink', 55, 55);
      graphics.destroy();
      
      console.log('[BootScene] Created boss_pink texture (55x55 - same size as red boss)');
    }
    
    if (!this.textures.exists('boss_purple')) {
      const graphics = this.add.graphics();
      
      // Purple block for final boss
      graphics.fillStyle(0x800080, 1);
      graphics.fillRect(0, 0, 55, 55);
      
      // Add a white star pattern for distinction
      graphics.lineStyle(3, 0xffffff, 1);
      // Draw a star shape
      const centerX = 27.5, centerY = 27.5, radius = 15;
      for (let i = 0; i < 5; i++) {
        const angle1 = (i * 72 - 90) * Math.PI / 180;
        const angle2 = ((i + 1) * 72 - 90) * Math.PI / 180;
        const x1 = centerX + Math.cos(angle1) * radius;
        const y1 = centerY + Math.sin(angle1) * radius;
        const x2 = centerX + Math.cos(angle2) * radius;
        const y2 = centerY + Math.sin(angle2) * radius;
        graphics.lineBetween(centerX, centerY, x1, y1);
        graphics.lineBetween(centerX, centerY, x2, y2);
      }
      
      // Add purple outline
      graphics.lineStyle(2, 0x4b0082, 1);
      graphics.strokeRect(0, 0, 55, 55);
      
      graphics.generateTexture('boss_purple', 55, 55);
      graphics.destroy();
      
      console.log('[BootScene] Created boss_purple texture (55x55 - final boss with star)');
    }
    
    // Create bullet texture
    if (!this.textures.exists('bullet')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('bullet', 6, 6);
      graphics.destroy();
      
      console.log('[BootScene] Created bullet texture');
    }
    
    console.log('[BootScene] Boot complete');
    this.scene.start('MenuScene');
  }
}
