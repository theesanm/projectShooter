import Phaser from 'phaser';

export default class Enemy {
  constructor(scene, x, y, type = 'basic', hitPoints = 1) {
    this.scene = scene;
    this.type = type;
    this.hitPoints = hitPoints; // How many hits to destroy (1-4)
    this.currentHits = hitPoints; // Remaining hits
    this.health = 100;
    this.speed = 50;
    this.visualSprites = []; // Array to hold visual sprite copies

    // Create enemy graphic (placeholder)
    this.createEnemyGraphic();

    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    // Collision box for 50x50 enemy sprite
    this.sprite.body.setSize(45, 45); // Slightly smaller for better gameplay
    this.sprite.body.setOffset(2.5, 2.5); // Center it
    this.sprite.health = this.health;
    this.sprite.hitPoints = hitPoints;
    this.sprite.currentHits = hitPoints;
    this.sprite.enemyRef = this; // Reference back to Enemy instance
    
    // Create visual sprite copies for multi-hit enemies
    if (hitPoints > 1) {
      this.createVisualSprites(hitPoints);
    }
  }

  createEnemyGraphic() {
    if (!this.scene.textures.exists('enemy')) {
      const graphics = this.scene.add.graphics();
      
      // Draw a simple rectangle for enemy (zombie-like) - 50x50
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 50, 50);
      
      // Add eyes
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(15, 15, 5);
      graphics.fillCircle(35, 15, 5);
      
      graphics.generateTexture('enemy', 50, 50);
      graphics.destroy();
    }
  }

  createVisualSprites(hitPoints) {
    const baseX = this.sprite.x;
    const baseY = this.sprite.y;
    const spriteSize = 30; // Size of each visual sprite
    const spacing = 8; // Spacing between sprites

    // Create visual sprites arranged in different patterns based on hit points
    switch (hitPoints) {
      case 2:
        // Two sprites side by side
        this.visualSprites.push(this.scene.add.sprite(baseX - spacing/2, baseY, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX + spacing/2, baseY, 'enemy').setScale(0.06).setDepth(50));
        break;
      case 3:
        // Three sprites in a triangle formation
        this.visualSprites.push(this.scene.add.sprite(baseX, baseY - spacing/2, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX - spacing/2, baseY + spacing/2, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX + spacing/2, baseY + spacing/2, 'enemy').setScale(0.06).setDepth(50));
        break;
      case 4:
        // Four sprites in a square formation
        this.visualSprites.push(this.scene.add.sprite(baseX - spacing/2, baseY - spacing/2, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX + spacing/2, baseY - spacing/2, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX - spacing/2, baseY + spacing/2, 'enemy').setScale(0.06).setDepth(50));
        this.visualSprites.push(this.scene.add.sprite(baseX + spacing/2, baseY + spacing/2, 'enemy').setScale(0.06).setDepth(50));
        break;
    }
  }

  takeDamage() {
    this.currentHits--;
    if (this.sprite) {
      this.sprite.currentHits = this.currentHits;
    }
    
    // Remove one visual sprite per hit
    if (this.visualSprites.length > 0) {
      const spriteToRemove = this.visualSprites.pop();
      spriteToRemove.destroy();
      
      // Flash remaining visual sprites red
      this.visualSprites.forEach(visualSprite => {
        visualSprite.setTint(0xff0000);
      });
      
      // Clear tint after a short delay
      this.scene.time.delayedCall(100, () => {
        this.visualSprites.forEach(visualSprite => {
          if (visualSprite && visualSprite.active) {
            visualSprite.clearTint();
          }
        });
      });
    }
    
    return this.currentHits <= 0; // Return true if enemy is destroyed
  }
  
  updateHitTextPosition() {
    // Update positions of visual sprites to follow the main sprite
    if (this.sprite && this.visualSprites.length > 0) {
      const baseX = this.sprite.x;
      const baseY = this.sprite.y;
      const spacing = 8;
      
      switch (this.currentHits + this.visualSprites.length) { // Total original hit points
        case 2:
          if (this.visualSprites.length >= 1) {
            this.visualSprites[0].setPosition(baseX - spacing/2, baseY);
          }
          break;
        case 3:
          if (this.visualSprites.length >= 1) {
            this.visualSprites[0].setPosition(baseX, baseY - spacing/2);
          }
          if (this.visualSprites.length >= 2) {
            this.visualSprites[1].setPosition(baseX - spacing/2, baseY + spacing/2);
          }
          break;
        case 4:
          if (this.visualSprites.length >= 1) {
            this.visualSprites[0].setPosition(baseX - spacing/2, baseY - spacing/2);
          }
          if (this.visualSprites.length >= 2) {
            this.visualSprites[1].setPosition(baseX + spacing/2, baseY - spacing/2);
          }
          if (this.visualSprites.length >= 3) {
            this.visualSprites[2].setPosition(baseX - spacing/2, baseY + spacing/2);
          }
          break;
      }
    }
  }
  
  destroy() {
    // Destroy all visual sprites
    this.visualSprites.forEach(visualSprite => {
      if (visualSprite) {
        visualSprite.destroy();
      }
    });
    this.visualSprites = [];
    
    if (this.sprite) {
      this.sprite.destroy();
    }
  }

  moveTo(targetX, targetY) {
    this.scene.physics.moveToObject(this.sprite, { x: targetX, y: targetY }, this.speed);
  }
}
