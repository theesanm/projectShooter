import Phaser from 'phaser';

export default class Boss {
  constructor(scene, x, y, health = 100, speed = 50, type = 'pink') {
    this.scene = scene;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed; // Custom speed based on boss count
    this.type = type; // 'pink', 'normal', or 'purple'
    this.isBoss = true;
    this.destroyed = false; // Track if boss has been destroyed

    // Lane switching for purple bosses
    this.canSwitchLanes = (type === 'purple');
    this.laneSwitchTimer = 0;
    this.laneSwitchInterval = 1000; // Base interval for purple bosses (will be randomized) - reduced for more frequent switching
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

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setScale(this.baseScale); // Start at base scale
    this.sprite.body.setSize(40, 40); // Same collision box for both boss types
    this.sprite.body.setOffset(5, 5);
    this.sprite.health = this.health;
    this.sprite.isBoss = true;
    this.sprite.bossType = type; // Store type directly on sprite
    
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
    // Textures are now created in BootScene, just return the appropriate key
    if (this.type === 'purple') {
      return 'boss_purple';
    }
    return this.type === 'pink' ? 'boss_pink' : 'boss_normal';
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
      const barColor = this.type === 'purple' ? 0x800080 : (this.type === 'pink' ? 0xff69b4 : 0xff0000);
      this.healthBar = this.scene.add.rectangle(barX, barY, 80, 10, barColor);
      this.healthBar.setDepth(501);
    }
    
    if (!this.bossLabel) {
      const labelColor = this.type === 'purple' ? '#800080' : (this.type === 'pink' ? '#ff69b4' : '#ff0000');
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
    
    // Handle lane switching for purple bosses
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
    
    // Health text position is updated in updateHealthBar, no need to update here
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
        
        console.log('[Boss] Purple boss randomly switching to lane', this.currentLaneIndex, 'at x:', targetX);
        
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
    
    // Update scale based on health percentage
    const healthPercent = this.health / this.maxHealth;
    this.currentScale = this.baseScale + ((this.maxScale - this.baseScale) * (1 - healthPercent));
    this.sprite.setScale(this.currentScale);
    
    // Update collision box to match new scale
    const scaledSize = 40 * (this.currentScale / this.baseScale);
    this.sprite.body.setSize(scaledSize, scaledSize);
    this.sprite.body.setOffset((this.sprite.width - scaledSize) / 2, (this.sprite.height - scaledSize) / 2);
    
    this.updateHealthBar();
    console.log('[Boss] Took', amount, 'damage. Health:', this.health, '/', this.maxHealth, 'Scale:', this.currentScale.toFixed(2), 'Speed:', this.currentSpeed.toFixed(1));
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
    
    // Finally destroy sprite after everything else is cleaned up
    try {
      if (this.sprite) {
        if (this.sprite.active) this.sprite.destroy();
        this.sprite = null;
      }
    } catch (e) {}
  }
}
