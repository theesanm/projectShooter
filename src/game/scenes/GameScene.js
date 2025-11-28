import Phaser from 'phaser';
import Player from '../entities/Player.js';
import WaveManager from '../systems/WaveManager.js';
import APIService from '../../services/APIService.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Initialize game state
    this.score = 0;
    this.gameOver = false;
    this.movementMode = this.game.config.movementMode || 'full';

    // Create player (position depends on movement mode)
    const playerY = this.movementMode === 'horizontal' ? height - 60 : height / 2;
    this.player = new Player(this, width / 2, playerY, this.movementMode);

    // Create bullet group
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: true
    });

    // Create enemies group
    this.enemies = this.physics.add.group();

    // Create wave manager
    this.waveManager = new WaveManager(this, this.movementMode);

    // Setup collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player.sprite, this.enemies, this.hitPlayer, null, this);

    // Create HUD
    this.createHUD();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'),
      down: this.input.keyboard.addKey('S'),
      left: this.input.keyboard.addKey('A'),
      right: this.input.keyboard.addKey('D')
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    console.log('[GameScene] Game started');
  }

  createHUD() {
    const hudStyle = { fontSize: '18px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } };
    
    this.scoreText = this.add.text(10, 10, 'Score: 0', hudStyle);
    this.waveText = this.add.text(10, 40, 'Wave: 1', hudStyle);
    this.healthText = this.add.text(10, 70, 'Health: 100', hudStyle);
    this.enemiesText = this.add.text(10, 100, 'Enemies: 0', hudStyle);
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Player controls
    const speed = 200;
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) velocityX = -speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) velocityX = speed;
    
    // Only allow vertical movement in 'full' mode
    if (this.player.canMoveVertically()) {
      if (this.cursors.up.isDown || this.wasd.up.isDown) velocityY = -speed;
      if (this.cursors.down.isDown || this.wasd.down.isDown) velocityY = speed;
    }

    this.player.sprite.setVelocity(velocityX, velocityY);

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shoot();
    }

    // Update bullets
    this.bullets.children.each(bullet => {
      if (bullet.active && (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600)) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });

    // Update wave manager
    this.waveManager.update(time, delta);

    // Update HUD
    this.updateHUD();
  }

  shoot() {
    const bullet = this.bullets.get(this.player.sprite.x, this.player.sprite.y);
    
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      
      // Create bullet graphics if not exists
      if (!bullet.texture || bullet.texture.key === '__MISSING') {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('bullet', 6, 6);
        graphics.destroy();
      }
      
      bullet.setTexture('bullet');
      bullet.setVelocityY(-400);
      bullet.body.setSize(6, 6);
    }
  }

  hitEnemy(bullet, enemy) {
    bullet.setActive(false);
    bullet.setVisible(false);
    
    enemy.health -= 25;
    
    // Flash enemy
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (enemy.active) enemy.clearTint();
    });

    if (enemy.health <= 0) {
      this.score += 10;
      enemy.destroy();
      this.waveManager.enemyKilled();
    }
  }

  hitPlayer(player, enemy) {
    this.player.takeDamage(10);
    
    // Flash player
    player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      player.clearTint();
    });

    if (this.player.health <= 0) {
      this.endGame();
    }
  }

  updateHUD() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
    this.healthText.setText(`Health: ${this.player.health}`);
    this.enemiesText.setText(`Enemies: ${this.enemies.getLength()}`);
  }

  async endGame() {
    this.gameOver = true;
    this.physics.pause();

    // Save high score
    const highScore = localStorage.getItem('highScore') || 0;
    if (this.score > highScore) {
      localStorage.setItem('highScore', this.score);
    }

    // API call (currently logs only)
    await APIService.saveStats({
      score: this.score,
      wave: this.waveManager.currentWave,
      timestamp: Date.now()
    });

    // Game over text
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, `Final Score: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 60, `Wave Reached: ${this.waveManager.currentWave}`, {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const restartText = this.add.text(width / 2, height / 2 + 120, 'Click to Restart', {
      fontSize: '24px',
      color: '#00ff00'
    }).setOrigin(0.5);

    restartText.setInteractive({ useHandCursor: true });
    restartText.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
