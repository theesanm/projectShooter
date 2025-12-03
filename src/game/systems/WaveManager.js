import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';

export default class WaveManager {
  constructor(scene, movementMode = 'full') {
    this.scene = scene;
    this.movementMode = 'lanes'; // Force lane mode
    this.currentWave = 1;
    this.enemiesPerWave = 10;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.waveActive = false;
    this.spawnTimer = 0;
    this.spawnInterval = 3000; // Spawn every 3 seconds
    this.bossSpawned = false;
    this.waveDuration = 180000; // 3 minutes wave duration
    this.waveStartTime = 0;
    this.bossCount = 0; // Track number of bosses spawned
    this.currentBoss = null; // Track current active boss
    this.pinkBossSpawned = false; // Track if pink boss has been spawned
    
    // Lane system
    this.scene = scene;
    this.lanePositions = scene.lanePositions || [];
    console.log('[WaveManager] Lane positions received:', this.lanePositions, 'from scene:', !!scene.lanePositions);
    if (scene.lanePositions) {
      console.log('[WaveManager] Scene lanePositions:', scene.lanePositions);
    }

    // Start first wave
    this.startWave();
  }

  startWave() {
    console.log(`[WaveManager] Starting wave ${this.currentWave}`);
    this.waveActive = true;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.waveStartTime = Date.now();
    this.lastBossSpawnTime = 0;
    this.lastNormalBossTime = 0; // Track normal boss spawns
    this.lastPinkBossTime = 0; // Track pink boss spawns
    this.bossSpawnInterval = 10000; // Pink boss every 10 seconds
    this.normalBossInterval = 6000; // Normal boss every 6 seconds
    this.currentBoss = null; // Track current active boss
    this.pinkBossSpawned = false; // Reset pink boss flag
    this.purpleBossSpawned = false; // Track purple boss spawning
    this.firstBossSpawned = false; // Track when first boss has been spawned
    this.purpleBossActive = false; // Track when purple boss is currently active
    
    // Single wave configuration
    this.enemiesPerWave = 200; // Reduced for 3 minutes (focus on bosses)
    this.spawnInterval = 900; // Spawn enemy every 0.9 seconds
    
    console.log(`[WaveManager] Wave ${this.currentWave}: ${this.enemiesPerWave} enemies, ${this.spawnInterval}ms interval, 3 minute duration`);

    // Show wave notification
    this.showWaveNotification();
    
    // First boss will be spawned in update() method at 15 seconds
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
    if (!this.waveActive || this.scene.gameOver) return;

    // Calculate elapsed time for boss spawning timing
    const elapsedTime = Date.now() - this.waveStartTime;

    // Spawn first boss at 15 seconds if not already spawned
    if (elapsedTime >= 15000 && !this.currentBoss && this.bossCount === 0) {
      console.log('[WaveManager] First boss incoming at 15 seconds!');
      this.spawnBoss('normal'); // First boss is always normal (red)
      this.lastNormalBossTime = Date.now();
      this.firstBossSpawned = true; // Mark that first boss has been spawned
    }

    // Spawn purple boss at 2.5 minutes (150 seconds) - final boss
    if (elapsedTime >= 150000 && !this.purpleBossSpawned) {
      console.log('[WaveManager] 🟣 PURPLE BOSS INCOMING! Final boss at 2.5 minutes!');
      // If there's a current boss, wait for it to be defeated first
      if (!this.currentBoss) {
        this.spawnBoss('purple');
        this.purpleBossSpawned = true;
        this.purpleBossActive = true; // Track that purple boss is now active
      } else {
        console.log('[WaveManager] Purple boss waiting for current boss to be defeated...');
      }
    }

    // Spawn bosses every 10 seconds (only if no current boss and before purple boss) - alternate between normal and pink
    if (!this.scene.gameOver && !this.currentBoss && this.bossCount > 0 && !this.purpleBossSpawned && !this.purpleBossActive) {
      const timeSinceLastBoss = Date.now() - Math.max(this.lastNormalBossTime, this.lastPinkBossTime || 0);
      if (timeSinceLastBoss >= this.bossSpawnInterval) {
        // Alternate between normal and pink bosses
        const nextBossType = this.bossCount % 2 === 0 ? 'pink' : 'normal';
        console.log(`[WaveManager] 🎯 SPAWNING ${nextBossType.toUpperCase()} BOSS #${this.bossCount} (every ${this.bossSpawnInterval/1000}s after first boss)`);
        if (nextBossType === 'pink') {
          console.log('[WaveManager] 🌸 PINK BOSS INCOMING! Look for the boss with the white X!');
        }
        this.spawnBoss(nextBossType);
        if (nextBossType === 'normal') {
          this.lastNormalBossTime = Date.now();
        } else {
          this.lastPinkBossTime = Date.now();
        }
      }
    }

    // Check if current boss is still active (clear if destroyed or reached bottom)
    const playerY = this.scene.playerLockedY || this.scene.cameras.main.height - 100;
    if (this.currentBoss && (!this.currentBoss.active || this.currentBoss.y > playerY - 20)) {
      console.log('[WaveManager] Current boss reached bottom or destroyed');
      if (this.currentBoss.y > playerY - 20 && !this.scene.gameOver) {
        this.scene.enemyReachedBottom(this.currentBoss);
      }
      
      // Check if this was the purple boss - if so, end the wave
      if (this.currentBoss.bossType === 'purple') {
        console.log('[WaveManager] 🟣 PURPLE BOSS DEFEATED! Wave complete!');
        this.waveComplete();
        return;
      }
      
      this.clearCurrentBoss();
      
      // If purple boss is pending and time has passed, spawn it now
      const elapsedTime = Date.now() - this.waveStartTime;
      if (elapsedTime >= 150000 && !this.purpleBossSpawned && !this.currentBoss) {
        console.log('[WaveManager] 🟣 Spawning pending purple boss now that previous boss is defeated!');
        this.spawnBoss('purple');
        this.purpleBossSpawned = true;
        this.purpleBossActive = true;
      }
    }

    // Boss spawning is handled above in the alternating logic

    // Spawn enemies
    if (this.enemiesSpawned < this.enemiesPerWave && !this.scene.gameOver && !this.purpleBossActive) {
      this.spawnTimer += delta;
      
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnEnemy();
        this.spawnTimer = 0;
      }
    }

    // Move enemies straight down in their lanes
    this.scene.enemies.children.each(enemy => {
      if (enemy.active) {
        // Bosses have health-based spawn speed, regular enemies have fixed speed
        let speed;
        if (enemy.isBoss && enemy.bossRef) {
          speed = enemy.bossRef.currentSpeed;
          // Log boss speed every 60 frames (roughly once per second)
          if (!enemy.speedLogFrame) enemy.speedLogFrame = 0;
          enemy.speedLogFrame++;
          if (enemy.speedLogFrame % 60 === 0) {
            console.log('[WaveManager] Boss moving at speed:', speed.toFixed(1), 'px/s, health:', enemy.bossRef.health, '/', enemy.bossRef.maxHealth);
          }
        } else {
          speed = 100; // Regular enemies
        }
        
        enemy.setVelocityY(speed);
        enemy.setVelocityX(0);
        
        // Update boss health text position
        if (enemy.isBoss && enemy.bossRef && !enemy.bossRef.destroyed) {
          try {
            enemy.bossRef.update();
          } catch (e) {
            // If update fails, the boss is being destroyed
            console.log('[WaveManager] Boss update error, marking for cleanup');
          }
        }
        
        // Check if enemy reached the bottom (player's position) - game over!
        const playerY = this.scene.playerLockedY || this.scene.cameras.main.height - 100;
        if (enemy.y > playerY - 20) { // Trigger when enemy is close to player's position
          console.log('[WaveManager] Enemy reached bottom at y:', enemy.y, 'player at y:', playerY);
          this.scene.enemyReachedBottom(enemy);
          return; // Don't process further for this enemy
        }
        
        // Remove enemy if it goes way off screen (fallback cleanup)
        if (enemy.y > this.scene.cameras.main.height + 50) {
          enemy.destroy();
        }
      }
    });
  }

  spawnEnemy() {
    const { width, height } = this.scene.cameras.main;
    
    // Get lane positions from scene (ensure we have the latest)
    const lanePositions = this.scene.lanePositions || [this.scene.cameras.main.width * 0.3, this.scene.cameras.main.width * 0.7];
    
    // Randomly choose a lane
    const lane = Math.floor(Math.random() * lanePositions.length);
    const x = lanePositions[lane];
    const y = -20; // Spawn from top

    console.log('[WaveManager] Spawning enemy - lanePositions:', lanePositions, 'chosen lane:', lane, 'x position:', x);

    const enemy = this.scene.enemies.create(x, y, 'enemy');
    enemy.health = 1; // Each enemy takes 1 bullet
    enemy.lane = lane; // Track which lane the enemy is in
    
    console.log('[WaveManager] Enemy created at x:', enemy.x, 'y:', enemy.y);
    
    // Scale dragon to appropriate size for lanes
    enemy.setScale(0.08); // Adjust scale to fit in lane (16x9 image needs small scale)
    enemy.body.setSize(enemy.width * 0.6, enemy.height * 0.6); // Collision box smaller than sprite

    this.enemiesSpawned++;
  }

  enemyKilled() {
    this.enemiesKilled++;
  }

  waveComplete() {
    this.waveActive = false;
    this.currentBoss = null; // Clear the purple boss reference
    
    // Purple boss defeated - show wave complete screen
    console.log('[WaveManager] 🟣 PURPLE BOSS DEFEATED! Wave complete!');
    console.log('[WaveManager] Showing wave completion screen...');
    
    // Stop physics and wave manager
    this.scene.physics.pause();
    this.scene.gameOver = true;
    console.log('[WaveManager] Physics paused, gameOver set to true');
    
    // Show wave completion message and prompt restart
    const { width, height } = this.scene.cameras.main;
    console.log('[WaveManager] Creating completion text at', width/2, height/2);
    const text = this.scene.add.text(width / 2, height / 2 - 40, 'WAVE 1 COMPLETE!', {
      fontSize: '24px', // Smaller for mobile
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);
    
    const restartText = this.scene.add.text(width / 2, height / 2 + 20, 'Tap or Press SPACE to Restart', {
      fontSize: '18px', // Smaller for mobile
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);
    
    console.log('[WaveManager] Completion text created, setting up input handlers');
    
    // Listen for restart
    this.scene.input.keyboard.once('keydown-SPACE', () => {
      console.log('[WaveManager] SPACE pressed - restarting game');
      this.scene.scene.restart();
    });
    
    // Also enable general pointer down anywhere on screen (mobile friendly)
    this.scene.input.once('pointerdown', () => {
      console.log('[WaveManager] Screen tapped - restarting game');
      this.scene.scene.restart();
    });
    
    console.log('[WaveManager] Wave completion screen setup complete');
  }
  
  endGame() {
    this.waveActive = false;
    console.log('[WaveManager] 3 minutes complete - Game ending');
    
    // Stop all enemies
    this.scene.physics.pause();
    
    // Show completion message
    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add.text(width / 2, height / 2 - 30, 'TIME UP!', {
      fontSize: '32px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);
    
    const restartText = this.scene.add.text(width / 2, height / 2 + 30, 'Press SPACE to Restart', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000);
    
    // Listen for restart
    this.scene.input.keyboard.once('keydown-SPACE', () => {
      this.scene.scene.restart();
    });
  }

  spawnBoss(type = 'normal') {
    if (!this.waveActive || this.currentBoss) return; // Only one boss at a time
    
    this.bossCount++;
    
    // Different spawning patterns for different boss types
    let x, y = -50;
    // All bosses now spawn in random lanes
    const lanePositions = this.scene.lanePositions || [this.scene.cameras.main.width * 0.3, this.scene.cameras.main.width * 0.7];
    const lane = Math.floor(Math.random() * lanePositions.length);
    x = lanePositions[lane];
    
    let bossHealth, bossSpeed;
    if (type === 'purple') {
      // Purple boss health = pink boss health x 1.5
      const currentPlayerDamage = Math.round(this.scene.player.getCurrentDamage());
      const pinkBossHealth = currentPlayerDamage * 100; // Base pink boss health
      bossHealth = Math.round(pinkBossHealth * 1.5); // 1.5x pink boss health
      bossSpeed = 15; // Purple bosses are slowest of all
      console.log('[WaveManager] Purple boss calc - player damage:', currentPlayerDamage, 'pink health:', pinkBossHealth, 'purple health:', bossHealth);
    } else if (type === 'pink') {
      // Pink boss health proportional to current player damage at spawn time
      const currentPlayerDamage = Math.round(this.scene.player.getCurrentDamage());
      bossHealth = currentPlayerDamage * 100; // 100x current player damage (already whole number)
      bossSpeed = 25; // Pink bosses start much slower (they're larger)
      console.log('[WaveManager] Pink boss calc - player damage:', currentPlayerDamage, 'boss health:', bossHealth);
    } else {
      // Normal boss health doubles every spawn
      const baseHealth = 100; // Starting health for first normal boss
      bossHealth = baseHealth * Math.pow(2, this.bossCount - 1); // Doubles each spawn (whole numbers)
      bossSpeed = 60; // Normal bosses start faster
      console.log('[WaveManager] Normal boss calc - spawn count:', this.bossCount, 'boss health:', bossHealth);
    }
    
    // Apply wave-based health cap
    const maxBossHealth = this.getMaxBossHealth();
    bossHealth = Math.min(bossHealth, maxBossHealth);
    
    // Calculate speed based on health - higher health = slower speed from spawn
    // Different speed ranges for different boss types
    let minSpeed, maxSpeed;
    if (type === 'purple') {
      minSpeed = 10; // Purple bosses minimum speed (slowest)
      maxSpeed = 15; // Purple bosses maximum speed (when health is low)
    } else if (type === 'pink') {
      minSpeed = 15; // Pink bosses minimum speed
      maxSpeed = 25; // Pink bosses maximum speed (when health is low)
    } else {
      minSpeed = 15; // Normal bosses minimum speed  
      maxSpeed = 50; // Normal bosses maximum speed (when health is low)
    }
    
    const healthRatio = bossHealth / maxBossHealth;
    bossSpeed = maxSpeed - ((maxSpeed - minSpeed) * healthRatio); // Higher health = slower speed
    bossSpeed = Math.max(minSpeed, bossSpeed); // Minimum speed
    
    console.log('[WaveManager] Boss speed calc - health:', bossHealth, 'maxHealth:', maxBossHealth, 'ratio:', healthRatio.toFixed(3), 'speed:', bossSpeed.toFixed(1), 'type:', type);
    
    const boss = new Boss(this.scene, x, y, bossHealth, bossSpeed, type);
    this.scene.enemies.add(boss.sprite);
    
    // Set boss reference on the sprite for collision detection
    boss.sprite.bossRef = boss;
    boss.sprite.isBoss = true;
    boss.sprite.bossType = type;
    
    // Track current boss
    this.currentBoss = boss.sprite;
    
    // Set initial velocity for boss using its current speed
    boss.sprite.setVelocityY(boss.currentSpeed);
    
    console.log('[WaveManager]', type, 'boss spawned with', bossHealth, 'HP (spawn #', this.bossCount, ', capped at', maxBossHealth, ') at x:', x, 'initial speed:', boss.currentSpeed);
    
    console.log('[WaveManager] Boss type:', type, '- Texture key:', boss.sprite.texture.key, '- Color should be:', type === 'pink' ? 'hot pink' : 'red');
  }

  stop() {
    this.waveActive = false;
    console.log('[WaveManager] Wave stopped');
  }

  getMaxPlayerDamage() {
    // Wave-based damage cap: increases with wave but with diminishing returns
    // Wave 1: 50, Wave 2: 75, Wave 3: 93.75, Wave 4: 107.8, Wave 5: 118.2, etc.
    return 50 * Math.pow(1.2, this.currentWave - 1);
  }
  
  getMaxBulletStreams() {
    // Wave-based stream cap: increases slowly
    // Wave 1-2: 3, Wave 3-4: 4, Wave 5+: 5
    return Math.min(5, 2 + Math.floor(this.currentWave / 2));
  }
  
  getMaxBossHealth() {
    // Wave-based boss health cap: increases but with diminishing returns
    // Wave 1: 10000, Wave 2: 11500, Wave 3: 13225, etc.
    return Math.round(10000 * Math.pow(1.15, this.currentWave - 1));
  }
  
  getMinFireRate() {
    // Wave-based minimum fire rate: decreases with wave (faster shooting)
    // Wave 1: 50ms, Wave 2: 40ms, Wave 3: 35ms, Wave 4: 32ms, Wave 5: 30ms, etc.
    return Math.max(25, 50 - (this.currentWave * 5));
  }
  
  clearCurrentBoss() {
    if (this.currentBoss && this.currentBoss.bossType === 'purple') {
      this.purpleBossActive = false;
      console.log('[WaveManager] 🟣 PURPLE BOSS CLEARED! Calling waveComplete()');
      this.waveComplete();
      return; // Don't set currentBoss to null yet, waveComplete() will handle it
    }
    this.currentBoss = null;
  }
}
