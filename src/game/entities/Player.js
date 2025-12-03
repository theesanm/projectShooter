import Phaser from 'phaser';
import ShooterManager from '../systems/ShooterManager.js';
import ProgressionManager from '../systems/ProgressionManager.js';

export default class Player {
  constructor(scene, x, y, movementMode = 'full') {
    this.scene = scene;
    this.movementMode = movementMode;

    // Load shooter configuration
    const shooterConfig = ShooterManager.getCurrentShooter();
    const baseStats = shooterConfig.stats;
    
    // Apply progression upgrades to base stats
    this.stats = ProgressionManager.applyUpgradesToStats(baseStats);
    
    // Start with 3 base damage - bosses are scaled to match
    // With 500ms fire rate (2 shots/sec) = 6 DPS
    // First boss (100 HP) takes ~17 seconds to kill, giving time to collect powerups
    this.stats.bulletDamage = 3;
    
    // Add bullet streams for visual effect (red powerups increase this to max 3)
    this.stats.bulletStreams = 1;
    
    this.health = this.stats.health;
    this.maxHealth = this.stats.maxHealth;
    this.shooterConfig = shooterConfig;
    
    // Lane system
    this.currentLane = 0; // 0 = left, 1 = right
    this.isMovingToLane = false;
    this.lanePositions = []; // Will be set by scene
    
    console.log('[Player] Loaded shooter:', shooterConfig.name, 'Stats:', this.stats);

    // Create player sprite using graphics (placeholder)
    this.createPlayerGraphic();
    
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    
    // Scale down the sprite (original is 1024x1024, scale to ~64px display size)
    this.sprite.setScale(0.0625); // 64 / 1024 = 0.0625
    
    // Set depth to ensure player is always on top
    this.sprite.setDepth(100);
    
    this.sprite.setCollideWorldBounds(true);
    
    // Set collision box to match SCALED sprite size (tighter collision for better gameplay)
    // Sprite is 1024x1024 texture scaled to 0.0625 = 64px display
    // Use 800x800 in texture space which = 50x50 pixels after scaling
    this.sprite.body.setSize(800, 800); // In texture coordinates
    this.sprite.body.setOffset(112, 112); // Center it (1024-800)/2 = 112

    // If horizontal mode, lock Y position at bottom and disable vertical movement
    if (this.movementMode === 'horizontal') {
      const lockedY = scene.cameras.main.height - 60;
      this.sprite.y = lockedY;
      this.lockedY = lockedY;
      // Disable vertical velocity
      this.sprite.body.setAllowGravity(false);
      this.sprite.body.setImmovable(false);
      
      console.log('[Player] Horizontal mode - locked at Y:', lockedY);
    }

    // Fire rate control
    this.lastFireTime = 0;
    
    // Invulnerability after being hit
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1000; // 1 second
  }

  createPlayerGraphic() {
    // Try to load the actual sprite first
    const textureName = 'player';
    
    if (!this.scene.textures.exists(textureName)) {
      // Check if we should load from file
      const imagePath = this.shooterConfig.imagePath;
      
      // For now, create placeholder until image is loaded
      // Image should be placed in: public/assets/shooters/green-soldier.png
      const graphics = this.scene.add.graphics();
      
      // Draw a soldier-like placeholder (front-facing stance)
      // Body - green uniform
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillRect(22, 35, 20, 25); // Torso
      
      // Head/helmet - green
      graphics.fillStyle(0x00aa00, 1);
      graphics.fillCircle(32, 22, 12);
      
      // Face
      graphics.fillStyle(0xffcc99, 1);
      graphics.fillCircle(32, 24, 8);
      
      // Weapon - gray gun
      graphics.fillStyle(0x555555, 1);
      graphics.fillRect(28, 40, 8, 3);
      graphics.fillRect(32, 43, 4, 10);
      
      // Legs
      graphics.fillStyle(0x008800, 1);
      graphics.fillRect(24, 60, 7, 4);
      graphics.fillRect(33, 60, 7, 4);
      
      graphics.generateTexture(textureName, 64, 64);
      graphics.destroy();
      
      console.log('[Player] Created soldier placeholder (64x64)');
      console.log('[Player] Replace with:', imagePath);
    }
  }

  canMoveVertically() {
    return this.movementMode === 'full';
  }

  canShoot(currentTime) {
    return currentTime - this.lastFireTime >= this.stats.fireRate;
  }

  setLastFireTime(time) {
    this.lastFireTime = time;
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return false;
    
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // Make invulnerable temporarily
    this.isInvulnerable = true;
    this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
      this.isInvulnerable = false;
    });
    
    return true;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }
  
  switchToLane(lane) {
    if (lane < 0 || lane >= this.lanePositions.length) return;
    if (this.isMovingToLane) return;
    
    this.currentLane = lane;
    this.isMovingToLane = true;
    
    // Smoothly move to lane position
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.lanePositions[lane],
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isMovingToLane = false;
      }
    });
  }
  
  getCurrentDamage() {
    // Current damage = bullet damage per shot * number of streams
    return Math.round(this.stats.bulletDamage * this.stats.bulletStreams);
  }
}
