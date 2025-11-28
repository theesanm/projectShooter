import Enemy from '../entities/Enemy.js';

export default class WaveManager {
  constructor(scene, movementMode = 'full') {
    this.scene = scene;
    this.movementMode = movementMode;
    this.currentWave = 1;
    this.enemiesPerWave = 5;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.waveActive = false;
    this.spawnTimer = 0;
    this.spawnInterval = 2000; // 2 seconds between spawns

    // Start first wave
    this.startWave();
  }

  startWave() {
    console.log(`[WaveManager] Starting wave ${this.currentWave}`);
    this.waveActive = true;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.spawnTimer = 0;

    // Show wave notification
    this.showWaveNotification();
  }

  showWaveNotification() {
    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add.text(width / 2, height / 2, `WAVE ${this.currentWave}`, {
      fontSize: '48px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  update(time, delta) {
    if (!this.waveActive) return;

    // Spawn enemies
    if (this.enemiesSpawned < this.enemiesPerWave) {
      this.spawnTimer += delta;
      
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnEnemy();
        this.spawnTimer = 0;
      }
    }

    // Check if wave is complete
    if (this.enemiesKilled >= this.enemiesPerWave) {
      this.waveComplete();
    }

    // Move enemies (behavior depends on movement mode)
    this.scene.enemies.children.each(enemy => {
      if (enemy.active) {
        if (this.movementMode === 'horizontal') {
          // Enemies move straight down in horizontal mode
          enemy.setVelocityY(80 + (this.currentWave * 10));
          enemy.setVelocityX(0);
        } else {
          // Enemies move toward player in full mode
          this.scene.physics.moveToObject(enemy, this.scene.player.sprite, 50 + (this.currentWave * 5));
        }
      }
    });
  }

  spawnEnemy() {
    const { width, height } = this.scene.cameras.main;
    
    // Spawn position depends on movement mode
    let x, y;
    
    if (this.movementMode === 'horizontal') {
      // Enemies spawn from top only
      x = Phaser.Math.Between(50, width - 50);
      y = -20;
    } else {
      // Random spawn position on edges (full movement mode)
      const side = Phaser.Math.Between(0, 3);
      
      switch(side) {
        case 0: // Top
          x = Phaser.Math.Between(0, width);
          y = -20;
          break;
        case 1: // Right
          x = width + 20;
          y = Phaser.Math.Between(0, height);
          break;
        case 2: // Bottom
          x = Phaser.Math.Between(0, width);
          y = height + 20;
          break;
        case 3: // Left
          x = -20;
          y = Phaser.Math.Between(0, height);
          break;
      }
    }

    const enemy = this.scene.enemies.create(x, y, 'enemy');
    enemy.health = 75 + (this.currentWave * 25); // Increase health per wave
    
    // Create enemy graphic if needed
    if (!this.scene.textures.exists('enemy')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 30, 30);
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(10, 10, 4);
      graphics.fillCircle(20, 10, 4);
      graphics.generateTexture('enemy', 30, 30);
      graphics.destroy();
    }

    this.enemiesSpawned++;
  }

  enemyKilled() {
    this.enemiesKilled++;
  }

  waveComplete() {
    this.waveActive = false;
    this.currentWave++;
    
    // Calculate enemies for next wave
    this.enemiesPerWave = 5 + (this.currentWave * 2);
    
    // Show completion message
    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add.text(width / 2, height / 2, `WAVE ${this.currentWave - 1} COMPLETE!`, {
      fontSize: '36px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        text.destroy();
        this.startWave();
      }
    });
  }
}
