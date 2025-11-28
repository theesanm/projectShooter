import Phaser from 'phaser';

export default class Enemy {
  constructor(scene, x, y, type = 'basic') {
    this.scene = scene;
    this.type = type;
    this.health = 100;
    this.speed = 50;

    // Create enemy graphic (placeholder)
    this.createEnemyGraphic();

    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.body.setSize(30, 30);
    this.sprite.health = this.health;
  }

  createEnemyGraphic() {
    if (!this.scene.textures.exists('enemy')) {
      const graphics = this.scene.add.graphics();
      
      // Draw a simple rectangle for enemy (zombie-like)
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 30, 30);
      
      // Add eyes
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(10, 10, 4);
      graphics.fillCircle(20, 10, 4);
      
      graphics.generateTexture('enemy', 30, 30);
      graphics.destroy();
    }
  }

  moveTo(targetX, targetY) {
    this.scene.physics.moveToObject(this.sprite, { x: targetX, y: targetY }, this.speed);
  }
}
