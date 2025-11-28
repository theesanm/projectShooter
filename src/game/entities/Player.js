import Phaser from 'phaser';

export default class Player {
  constructor(scene, x, y, movementMode = 'full') {
    this.scene = scene;
    this.health = 100;
    this.maxHealth = 100;
    this.movementMode = movementMode;

    // Create player sprite using graphics (placeholder)
    this.createPlayerGraphic();
    
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(30, 30);

    // If horizontal mode, lock Y position at bottom
    if (this.movementMode === 'horizontal') {
      this.sprite.y = scene.cameras.main.height - 60;
    }
  }

  createPlayerGraphic() {
    if (!this.scene.textures.exists('player')) {
      const graphics = this.scene.add.graphics();
      
      // Draw a simple triangle for the player (spaceship-like)
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillTriangle(20, 5, 5, 35, 35, 35);
      
      // Add some detail
      graphics.fillStyle(0x00aa00, 1);
      graphics.fillRect(18, 20, 4, 15);
      
      graphics.generateTexture('player', 40, 40);
      graphics.destroy();
    }
  }

  canMoveVertically() {
    return this.movementMode === 'full';
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }
}
