import Phaser from 'phaser';

export default class Boss {
  constructor(scene, x, y, health = 100, speed = 50, type = 'normal', imagePath = null, canSwitchLanes = false) {
    this.scene = scene;
    this.health = health;
    this.maxHealth = health;
    this.speed = parseFloat(speed) || 50; // Ensure speed is always a number
    this.type = type; // Boss type from database
    this.imagePath = imagePath; // Custom image path from database
    this.isBoss = true;
    this.destroyed = false; // Track if boss has been destroyed
    
    console.log(`[Boss] Constructor - Speed: ${speed} -> ${this.speed}, Health: ${health}, Type: ${type}, Image: ${imagePath}`);

    // Lane switching capability (can be enabled per boss)
    this.canSwitchLanes = canSwitchLanes;
    this.laneSwitchTimer = 0;
    this.laneSwitchInterval = 1000; // Base interval for lane switching
    this.currentLaneIndex = 0; // Track current lane
    this.lanePositions = scene.lanePositions || [scene.cameras.main.width * 0.3, scene.cameras.main.width * 0.7];

    // Scaling system - bosses grow as they take damage (same for both types)
    this.baseScale = 1.5;
    this.maxScale = 2.5;
    this.currentScale = this.baseScale;
    
    // Speed system - speed set at spawn based on health, remains constant
    this.baseSpeed = speed; // Speed determined by WaveManager based on health
    this.currentSpeed = this.baseSpeed; // Speed stays constant throughout boss life
    
    // Create boss graphic and get the texture key
    const textureKey = this.createBossGraphic();
    
    // IMPORTANT: Use fallback texture if custom texture isn't loaded yet
    // This ensures the sprite always has a valid texture and physics body
    const actualTextureKey = this.scene.textures.exists(textureKey) ? textureKey : 'boss_normal';
    
    console.log('[Boss] Creating sprite with texture:', actualTextureKey, 'requested:', textureKey, 'exists:', this.scene.textures.exists(textureKey));

    this.sprite = scene.physics.add.sprite(x, y, actualTextureKey);
    
    console.log('[Boss] Created sprite:', {
      texture: actualTextureKey,
      position: `(${x}, ${y})`,
      hasBody: !!this.sprite.body,
      bodyEnabled: this.sprite.body?.enable,
      bodyType: this.sprite.body?.constructor.name
    });
    
    // Handle scaling for custom images vs procedural textures
    if (this.imagePath) {
      // Custom images need to be scaled down to game size
      // Target display size: ~80px (larger than enemies but fits in lanes)
      const targetSize = 80; // Target display size in pixels
      
      // Wait for texture to be available, then scale appropriately
      if (this.scene.textures.exists(textureKey)) {
        const texture = this.scene.textures.get(textureKey);
        const frame = texture.get();
        const imageWidth = frame.width;
        const imageHeight = frame.height;
        const maxDimension = Math.max(imageWidth, imageHeight);
        
        // Calculate scale to fit target size
        const customScale = targetSize / maxDimension;
        this.baseScale = customScale;
        this.maxScale = customScale * 1.3; // Can grow up to 1.3x when damaged (not too big)
        this.currentScale = this.baseScale;
        
        console.log(`[Boss] Custom image size: ${imageWidth}x${imageHeight}, scale: ${customScale.toFixed(3)} (target: ${targetSize}px)`);
      } else {
        // Texture not loaded yet, use default scale temporarily
        this.baseScale = 0.15; // Fallback scale for large images (~80px)
      }
    } else {
      // Default procedural textures are 55x55, scale 1.45 = ~80px display
      this.baseScale = 1.45;
      this.maxScale = 1.9; // Max ~105px when damaged
      this.currentScale = this.baseScale;
    }
    
    this.sprite.setScale(this.baseScale); // Start at base scale
    
    // Configure physics body for collisions
    // Start with collision size that fits within fallback texture (55x55)
    // Will be updated when custom texture loads
    const initialCollisionSize = 50; // Fits within 55x55 boss_normal texture
    
    if (!this.sprite.body) {
      console.error('[Boss] CRITICAL: No physics body on sprite after creation!');
      // Try to add body manually
      this.scene.physics.add.existing(this.sprite);
    }
    
    if (this.sprite.body) {
      // Make collision body match the full sprite size for easier hitting
      // No offset needed - collision body should cover entire sprite
      const bodySize = Math.max(this.sprite.width, this.sprite.height);
      this.sprite.body.setSize(bodySize, bodySize);
      this.sprite.body.setOffset(0, 0); // No offset - body centered on sprite
      
      // CRITICAL: Configure body properties for movement
      this.sprite.body.enable = true;
      
      console.log(`[Boss] Physics body: ${bodySize}x${bodySize} (full sprite coverage), sprite: ${this.sprite.width}x${this.sprite.height}`);
    } else {
      console.error('[Boss] No physics body found on sprite after manual add attempt!');
    }
    
    this.sprite.health = this.health;
    this.sprite.isBoss = true;
    this.sprite.bossType = type; // Store type directly on sprite
    
    // Debug: Add collision box visualization using initial collision size
    const debugSize = 50; // Matches initial collision size
    this.debugRect = this.scene.add.rectangle(
      this.sprite.x, 
      this.sprite.y, 
      debugSize, 
      debugSize
    );
    this.debugRect.setStrokeStyle(2, 0x00ff00, 0.8);
    this.debugRect.setDepth(499);
    this.debugRect.setOrigin(0.5);
    
    // CRITICAL: Add ACTUAL physics body boundary visualization
    this.bodyDebugRect = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      debugSize,
      debugSize
    );
    this.bodyDebugRect.setStrokeStyle(3, 0xff0000, 1.0); // RED for actual body
    this.bodyDebugRect.setDepth(500);
    this.bodyDebugRect.setOrigin(0, 0); // Top-left origin to match physics body
    
    // Add speed indicator text for debugging (after sprite is created)
    this.speedText = this.scene.add.text(this.sprite.x, this.sprite.y - 50, this.baseSpeed.toFixed(0) + 'px/s', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(504);
    
    // Health bar for all bosses
    this.createHealthBar();
  }

  createBossGraphic() {
    // If custom image path provided, try to load it
    if (this.imagePath) {
      const textureKey = 'boss_custom_' + this.imagePath.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Check if already loaded
      if (!this.scene.textures.exists(textureKey)) {
        console.log('[Boss] Loading custom image:', this.imagePath, 'as', textureKey);
        
        // Load synchronously to have texture available immediately
        this.scene.load.image(textureKey, this.imagePath);
        this.scene.load.once('complete', () => {
          console.log('[Boss] Custom image loaded:', textureKey);
          
          // Update sprite texture now that it's loaded
          if (this.sprite && this.sprite.active) {
            this.sprite.setTexture(textureKey);
            console.log('[Boss] Sprite texture updated to:', textureKey);
          }
          
          // Update scaling now that texture is loaded
          if (this.sprite) {
            const texture = this.scene.textures.get(textureKey);
            const frame = texture.get();
            const imageWidth = frame.width;
            const imageHeight = frame.height;
            const maxDimension = Math.max(imageWidth, imageHeight);
            const targetSize = 100;
            const customScale = targetSize / maxDimension;
            
            this.baseScale = customScale;
            this.maxScale = customScale * 1.5;
            this.currentScale = this.baseScale;
            this.sprite.setScale(this.baseScale);
            
            console.log(`[Boss] After setScale - sprite dimensions:`);
            console.log(`  width: ${this.sprite.width}`);
            console.log(`  height: ${this.sprite.height}`);
            console.log(`  displayWidth: ${this.sprite.displayWidth}`);
            console.log(`  displayHeight: ${this.sprite.displayHeight}`);
            console.log(`  scaleX: ${this.sprite.scaleX}`);
            console.log(`  scaleY: ${this.sprite.scaleY}`);
            console.log(`  frame.width: ${this.sprite.frame.width}`);
            console.log(`  frame.height: ${this.sprite.frame.height}`);
            
            // Update collision box now that sprite is bigger
            // FULL WIDTH collision for left-right gameplay
            const collisionWidth = Math.floor(this.sprite.width); // 100% of sprite width
            const collisionHeight = Math.floor(this.sprite.height); // 100% of sprite height
            
            console.log(`[Boss] Target collision size: ${collisionWidth}x${collisionHeight} (full sprite size)`);
            
            if (this.sprite.body) {
              // Store current velocity before body modifications
              const currentVelocityY = this.sprite.body.velocity.y;
              
              // Center the collision box on the sprite
              const offsetX = (this.sprite.width - collisionWidth) / 2;
              const offsetY = (this.sprite.height - collisionHeight) / 2;
              
              console.log(`[Boss] Collision box update: size=${collisionWidth}x${collisionHeight}, sprite=${this.sprite.width.toFixed(1)}x${this.sprite.height.toFixed(1)}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
              
              // Update body configuration
              this.sprite.body.setSize(collisionWidth, collisionHeight);
              this.sprite.body.setOffset(offsetX, offsetY);
              
              // Restore velocity after body modifications
              this.sprite.body.setVelocityY(currentVelocityY);
              
              // Ensure body stays enabled
              this.sprite.body.enable = true;
              
              console.log(`[Boss] Physics body UPDATED after texture load: ${collisionSize}x${collisionSize}, sprite: ${this.sprite.width.toFixed(1)}x${this.sprite.height.toFixed(1)}, display: ${this.sprite.displayWidth.toFixed(1)}x${this.sprite.displayHeight.toFixed(1)}, offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}), velocity: ${currentVelocityY.toFixed(1)}`);
              
              // Update debug rect size to match
              if (this.debugRect) {
                this.debugRect.width = collisionWidth;
                this.debugRect.height = collisionHeight;
              }
              
              // Update red physics body debug rect to show ACTUAL body dimensions
              if (this.bodyDebugRect) {
                this.bodyDebugRect.width = this.sprite.body.width;
                this.bodyDebugRect.height = this.sprite.body.height;
                console.log(`[Boss] Red debug rect updated to body size: ${this.sprite.body.width}x${this.sprite.body.height}`);
              }
              
              console.log(`[Boss] Physics body reconfigured: ${collisionWidth}x${collisionHeight}, sprite display: ${this.sprite.displayWidth.toFixed(1)}x${this.sprite.displayHeight.toFixed(1)}, offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
            }
            
            console.log(`[Boss] Updated scale after load: ${imageWidth}x${imageHeight} -> scale ${customScale.toFixed(3)}`);
          }
        });
        this.scene.load.start();
      }
      
      return textureKey;
    }
    
    // If no custom image, create a placeholder
    console.warn('[Boss] No image path provided, using placeholder');
    return 'boss_normal'; // Fallback to red boss texture
  }

  createHealthBar() {
    // Position health bar above the boss sprite (use current position)
    this.updateHealthBar();
  }

  updateHealthBar() {
    if (this.destroyed || !this.sprite || !this.sprite.active) return;
    
    const barX = this.sprite.x;
    const barY = this.sprite.y - 40;
    
    const healthPercent = this.health / this.maxHealth;
    
    // Create elements if they don't exist
    if (!this.healthBarBg) {
      this.healthBarBg = this.scene.add.rectangle(barX, barY, 80, 10, 0x000000);
      this.healthBarBg.setDepth(500);
    }
    
    if (!this.healthBar) {
      const barColor = 0xff0000; // Red health bar for all bosses
      this.healthBar = this.scene.add.rectangle(barX, barY, 80, 10, barColor);
      this.healthBar.setDepth(501);
    }
    
    if (!this.bossLabel) {
      const labelColor = '#ff0000'; // Red label for all bosses
      this.bossLabel = this.scene.add.text(barX, barY - 15, 'BOSS', {
        fontSize: '12px',
        color: labelColor,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(502);
    }
    
    if (!this.healthText) {
      this.healthText = this.scene.add.text(barX, barY - 25, Math.round(this.health).toString(), {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(503);
    }
    
    // Update positions and sizes
    if (this.healthBarBg && this.healthBarBg.active) {
      this.healthBarBg.setPosition(barX, barY);
    }
    
    if (this.healthBar && this.healthBar.active) {
      this.healthBar.width = 80 * healthPercent;
      this.healthBar.setPosition(barX - (80 * (1 - healthPercent)) / 2, barY); // Center the health bar
    }
    
    if (this.bossLabel && this.bossLabel.active) {
      this.bossLabel.setPosition(barX, barY - 15);
    }
    
    // Update health text above boss
    if (this.healthText && this.healthText.active && this.sprite.active) {
      try {
        this.healthText.setText(Math.round(this.health).toString());
        this.healthText.setPosition(barX, barY - 25);
      } catch (e) {
        console.error('[Boss] Error updating health text:', e);
        // If there's an error, destroy the health text
        if (this.healthText) {
          this.healthText.destroy();
          this.healthText = null;
        }
      }
    }
  }
  
  update() {
    // Skip if destroyed or sprite is deactivated
    if (this.destroyed || !this.sprite || !this.sprite.active || !this.sprite.visible) {
      return;
    }
    
    // Update health bar position every frame to follow the boss
    this.updateHealthBar();
    
    // Handle lane switching if enabled for this boss
    if (this.canSwitchLanes) {
      this.laneSwitchTimer += 16; // Approximate 60fps delta
      if (this.laneSwitchTimer >= this.laneSwitchInterval) {
        console.log('[Boss] Lane switch timer triggered, calling switchLane()');
        this.switchLane();
        this.laneSwitchTimer = 0;
      }
    }
    
    // Update speed text position
    if (this.speedText && this.speedText.active) {
      this.speedText.setPosition(this.sprite.x, this.sprite.y - 50);
    }
    
    // Update debug collision box position
    if (this.debugRect && this.debugRect.active) {
      this.debugRect.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // CRITICAL: Update ACTUAL physics body visualization
    if (this.bodyDebugRect && this.bodyDebugRect.active && this.sprite.body) {
      // Position at the actual physics body's world position
      this.bodyDebugRect.setPosition(this.sprite.body.x, this.sprite.body.y);
      this.bodyDebugRect.setSize(this.sprite.body.width, this.sprite.body.height);
      
      // Log body position every 60 frames for debugging
      if (!this.bodyLogFrame) this.bodyLogFrame = 0;
      this.bodyLogFrame++;
      if (this.bodyLogFrame % 60 === 0) {
        console.log('[Boss] Physics body:', {
          spritePos: `${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)}`,
          bodyPos: `${this.sprite.body.x.toFixed(1)}, ${this.sprite.body.y.toFixed(1)}`,
          bodySize: `${this.sprite.body.width}x${this.sprite.body.height}`,
          offset: `${this.sprite.body.offset.x.toFixed(1)}, ${this.sprite.body.offset.y.toFixed(1)}`,
          enabled: this.sprite.body.enable
        });
      }
    }
  }
  
  switchLane() {
    if (!this.canSwitchLanes || this.lanePositions.length <= 1) return;
    
    console.log('[Boss] switchLane called successfully, currentLaneIndex:', this.currentLaneIndex, 'lanePositions:', this.lanePositions);
    
    // More dramatic flash effect - scale up and change color
    console.log('[Boss] Flashing boss before lane switch');
    const originalScale = this.sprite.scale;
    this.sprite.setTint(0xffff00); // Bright yellow flash
    this.sprite.setScale(originalScale * 1.2); // Scale up for visibility
    
    // Clear flash after 400ms and then switch lanes
    this.scene.time.delayedCall(400, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
        this.sprite.setScale(originalScale); // Return to normal scale
        
        // Randomly select a different lane (don't stay in current lane)
        let newLaneIndex;
        do {
          newLaneIndex = Math.floor(Math.random() * this.lanePositions.length);
        } while (newLaneIndex === this.currentLaneIndex && this.lanePositions.length > 1);
        
        this.currentLaneIndex = newLaneIndex;
        const targetX = this.lanePositions[this.currentLaneIndex];
        
        // Smoothly move to the new lane
        this.scene.tweens.add({
          targets: this.sprite,
          x: targetX,
          duration: 500, // 0.5 seconds to switch lanes
          ease: 'Linear'
        });
        
        console.log('[Boss] Boss randomly switching to lane', this.currentLaneIndex, 'at x:', targetX);
        
        // Set a new random interval for the next lane switch (1-2 seconds for more frequent switching)
        this.laneSwitchInterval = 1000 + Math.random() * 1000;
      }
    });
  }
  
  getCurrentSpeed() {
    return this.currentSpeed;
  }
  
  cleanupHealthText() {
    if (this.healthText) {
      try {
        if (this.healthText.active) {
          this.healthText.destroy();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.healthText = null;
    }
  }

  takeDamage(amount) {
    if (this.destroyed || !this.sprite || !this.sprite.active) return;
    
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // Round health to whole number for display
    this.health = Math.round(this.health);
    
    // REMOVED: Do NOT scale boss based on health - causes collision box issues
    // Bosses should maintain consistent size for reliable collision detection
    // this.currentScale = this.baseScale + ((this.maxScale - this.baseScale) * (1 - healthPercent));
    // this.sprite.setScale(this.currentScale);
    
    // REMOVED: Do NOT modify collision box on damage - causes hitbox to become unhittable
    // const scaledSize = 40 * (this.currentScale / this.baseScale);
    // this.sprite.body.setSize(scaledSize, scaledSize);
    // this.sprite.body.setOffset((this.sprite.width - scaledSize) / 2, (this.sprite.height - scaledSize) / 2);
    
    this.updateHealthBar();
    console.log('[Boss] Took', amount, 'damage. Health:', this.health, '/', this.maxHealth);
  }

  destroy() {
    if (this.destroyed) {
      console.log('[Boss] Already destroyed, skipping');
      return; // Prevent double destroy
    }
    this.destroyed = true;
    console.log('[Boss] Destroying boss, type:', this.type, 'health:', this.health);
    
    // Immediately deactivate sprite to stop rendering FIRST
    try {
      if (this.sprite && this.sprite.active) {
        console.log('[Boss] Deactivating sprite');
        this.sprite.setActive(false);
        this.sprite.setVisible(false);
        if (this.sprite.body) this.sprite.body.enable = false;
      }
    } catch (e) {
      console.error('[Boss] Error deactivating sprite:', e);
    }
    try {
      if (this.healthText) {
        if (this.healthText.active) this.healthText.destroy();
        this.healthText = null;
      }
    } catch (e) {}
    
    try {
      if (this.bossLabel) {
        if (this.bossLabel.active) this.bossLabel.destroy();
        this.bossLabel = null;
      }
    } catch (e) {}
    
    try {
      if (this.healthBar) {
        if (this.healthBar.active) this.healthBar.destroy();
        this.healthBar = null;
      }
    } catch (e) {}
    
    try {
      if (this.healthBarBg) {
        if (this.healthBarBg.active) this.healthBarBg.destroy();
        this.healthBarBg = null;
      }
    } catch (e) {}
    
    try {
      if (this.speedText) {
        if (this.speedText.active) this.speedText.destroy();
        this.speedText = null;
      }
    } catch (e) {}
    
    try {
      if (this.debugRect) {
        if (this.debugRect.active) this.debugRect.destroy();
        this.debugRect = null;
      }
    } catch (e) {}
    
    try {
      if (this.bodyDebugRect) {
        if (this.bodyDebugRect.active) this.bodyDebugRect.destroy();
        this.bodyDebugRect = null;
      }
    } catch (e) {}
    
    // Finally destroy sprite after everything else is cleaned up
    try {
      if (this.sprite) {
        if (this.sprite.active) this.sprite.destroy();
        this.sprite = null;
      }
    } catch (e) {}
    
    console.log('[Boss] Boss fully destroyed and cleaned up');
  }
}
