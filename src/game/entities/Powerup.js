import Phaser from 'phaser';

export default class Powerup {
  constructor(scene, x, y, type = 'firepower') {
    this.scene = scene;
    this.type = type;

    const textureName = `powerup_${type}`;
    
    console.log('[Powerup] Texture exists?', scene.textures.exists(textureName));
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, textureName);
    this.sprite.setDepth(200); // Very high depth to be on top of everything
    this.sprite.setScale(1.5); // Make bigger to see it
    
    // Configure physics body (velocity will be set after adding to group)
    if (this.sprite.body) {
      this.sprite.body.setSize(50, 50); // Larger collision box for easier collection
      this.sprite.body.setAllowGravity(false);
      console.log('[Powerup] Physics body configured');
    } else {
      console.error('[Powerup] No physics body found!');
    }
    
    // Make sure it's visible
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    
    // Store reference for collision
    this.sprite.powerupType = type;
    
    console.log('[Powerup] Sprite created:', {
      x: this.sprite.x,
      y: this.sprite.y, 
      depth: this.sprite.depth,
      texture: this.sprite.texture.key,
      visible: this.sprite.visible,
      alpha: this.sprite.alpha,
      displayWidth: this.sprite.displayWidth,
      displayHeight: this.sprite.displayHeight,
      hasBody: !!this.sprite.body,
      velocityY: this.sprite.body ? this.sprite.body.velocity.y : 'no body'
    });
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
