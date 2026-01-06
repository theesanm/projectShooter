import Phaser from 'phaser';

export default class Powerup {
  constructor(scene, x, y, powerupConfig) {
    this.scene = scene;
    this.config = powerupConfig;
    this.powerupId = Date.now().toString();
    this.spawnTime = Date.now();
    
    // Create default powerup graphic (fallback)
    this.createPowerupGraphic();
    
    // Create sprite with default texture first
    this.sprite = scene.physics.add.sprite(x, y, 'powerup_tex');
    this.sprite.setDepth(300); // Above everything
    this.sprite.setScale(1); // Default scale for 60px circle
    
    // Store configuration reference on sprite for collision detection
    this.sprite.powerupConfig = powerupConfig;
    this.sprite.powerupId = this.powerupId;
    this.sprite.spawnTime = this.spawnTime;
    this.sprite.powerupRef = this; // Reference back to Powerup instance
    
    console.log('[Powerup] ✨ Created:', powerupConfig.powerup_name, 'Type:', powerupConfig.powerup_type, 'at', x, y, 'Has custom image:', !!powerupConfig.image);
    
    // Load custom image if configured
    if (powerupConfig.image) {
      this.loadCustomImage(powerupConfig.image, powerupConfig.powerup_id);
    }
  }
  
  loadCustomImage(imagePath, powerupId) {
    if (!imagePath) {
      console.log('[Powerup] No image path provided, using default magenta circle');
      return;
    }
    
    const imageUrl = `http://localhost:3001${imagePath}`;
    const imageKey = `powerup_${powerupId}`;
    
    console.log('[Powerup] 🖼️ Loading custom image:', imageUrl, 'Key:', imageKey);
    
    // Check if already loaded
    if (this.scene.textures.exists(imageKey)) {
      console.log('[Powerup] ✅ Using cached texture:', imageKey);
      this.sprite.setTexture(imageKey);
      this.sprite.setScale(0.08); // Small scale for custom images (~40px)
      return;
    }
    
    // Load the image
    this.scene.load.image(imageKey, imageUrl);
    this.scene.load.once('complete', () => {
      if (this.sprite && this.sprite.active) {
        console.log('[Powerup] ✅ Custom image loaded, switching texture to:', imageKey);
        this.sprite.setTexture(imageKey);
        this.sprite.setScale(0.08); // Small scale for custom images (~40px)
      }
    });
    this.scene.load.on('loaderror', (file) => {
      if (file.key === imageKey) {
        console.error('[Powerup] ❌ Failed to load image:', imageUrl);
      }
    });
    this.scene.load.start();
  }
  
  // Call this after adding sprite to physics group
  setupPhysics() {
    if (this.sprite.body) {
      this.sprite.body.setAllowGravity(false);
      this.sprite.body.enable = true;
      this.sprite.body.setVelocityY(50); // Fall slowly toward player
      this.sprite.body.setVelocityX(0);
      // Set collision body based on display size
      const displayWidth = this.sprite.displayWidth;
      const displayHeight = this.sprite.displayHeight;
      this.sprite.body.setSize(displayWidth * 1.5, displayHeight * 1.5, true); // 1.5x for easier collection
      
      console.log('[Powerup] ⚙️ Physics configured for', this.config.powerup_name, '- Body size:', this.sprite.body.width, 'x', this.sprite.body.height, 'Position:', this.sprite.x.toFixed(0), this.sprite.y.toFixed(0));
    } else {
      console.error('[Powerup] ❌ No physics body for', this.config.powerup_name);
    }
  }
  
  createPowerupGraphic() {
    // Only create texture if it doesn't exist
    if (!this.scene.textures.exists('powerup_tex')) {
      const graphics = this.scene.add.graphics();
      
      // Draw a bright magenta circle (40px diameter - small)
      graphics.fillStyle(0xff00ff, 1);
      graphics.fillCircle(20, 20, 20);
      
      graphics.generateTexture('powerup_tex', 40, 40);
      graphics.destroy();
    }
  }
  
  destroy() {
    console.log('[Powerup] 💥 Destroying powerup:', this.config.powerup_name, 'Type:', this.config.powerup_type, 'ID:', this.powerupId);
    console.trace('[Powerup] Destroy called from:');
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
