import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Powerup from '../entities/Powerup.js';
import WaveManager from '../systems/WaveManager.js';
import ProgressionManager from '../systems/ProgressionManager.js';
import ShooterManager from '../systems/ShooterManager.js';
import APIService from '../../services/APIService.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Initialize game state
    this.score = 0;
    this.kills = 0;
    this.gameOver = false;
    this.gameOverScreenShown = false;
    
    // Create a blank 1x1 texture for safe sprite cleanup
    if (!this.textures.exists('blank')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture('blank', 1, 1);
      g.destroy();
    }
    
    // Define lane system (2 lanes)
    this.laneCount = 2;
    this.laneWidth = width / this.laneCount;
    this.lanePositions = [
      width * 0.3,  // Left lane at 30% of screen width
      width * 0.7   // Right lane at 70% of screen width
    ];
    
    console.log('[GameScene] Lane positions set:', this.lanePositions, 'count:', this.lanePositions.length, 'screen width:', width);
    
    // Load progression data
    ProgressionManager.loadProgression();
    ShooterManager.loadShooterData();
    
    // Get movement mode from global window object
    this.movementMode = 'lanes'; // Force lane mode

    console.log('[GameScene] Movement mode:', this.movementMode);

    // Create player in left lane at bottom
    const playerY = height - 100;
    this.player = new Player(this, this.lanePositions[0], playerY, this.movementMode);
    this.player.lanePositions = this.lanePositions;
    this.player.currentLane = 0;
    this.playerLockedY = playerY;

    // Create bullet group
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: true
    });
    
    // Set bullet depth
    this.bullets.children.each(bullet => bullet.setDepth(90));

    // Create enemies group
    this.enemies = this.physics.add.group();
    
    // Create powerups group
    this.powerups = this.physics.add.group();
    this.powerupSpawnTimer = 0;
    this.powerupSpawnInterval = 3000; // Spawn powerup every 3 seconds (more frequent early game)
    this.powerupType = 'lvl1PowerUp'; // Start with lvl1, alternate between lvl1 and lvl2
    
    // Track powerup collections for diminishing returns
    this.lvl1PowerupsCollected = 0;
    this.lvl2PowerupsCollected = 0;

    // Create wave manager
    this.waveManager = new WaveManager(this, this.movementMode);

    // Setup collisions
    this.physics.add.overlap(
      this.bullets, 
      this.enemies, 
      this.hitEnemy, 
      (bullet, enemy) => {
        // Process callback - only allow collision if both are active
        return bullet.active && enemy.active;
      },
      this
    );
    
    // Powerup collection
    this.physics.add.overlap(
      this.player.sprite, 
      this.powerups, 
      this.collectPowerup, 
      (player, powerup) => {
        // Process callback - only collect if game is active and both are active
        const canCollect = !this.gameOver && player.active && powerup.active;
        if (canCollect) {
          console.log('[GameScene] Powerup overlap detected at player:', player.x, player.y, 'powerup:', powerup.x, powerup.y);
        }
        return canCollect;
      }, 
      this
    );
    
    // Player vs enemies - use overlap for better detection
    this.playerEnemyCollider = this.physics.add.overlap(
      this.player.sprite, 
      this.enemies, 
      (player, enemy) => {
        console.log('[GameScene] COLLISION DETECTED: Player hit by enemy!');
        // Call hitPlayer directly - immediate game over
        this.hitPlayer(player, enemy);
      },
      (player, enemy) => {
        // Process callback - only check collision if game is not over
        const canCollide = !this.gameOver && player.active && enemy.active;
        if (canCollide) {
          console.log('[GameScene] Checking collision: player active:', player.active, 'enemy active:', enemy.active, 'gameOver:', this.gameOver);
        }
        return canCollide;
      },
      this
    );
    
    console.log('[GameScene] Collisions set up - player vs enemies');

    // Create HUD
    this.createHUD();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'),
      down: this.input.keyboard.addKey('S'),
      left: this.input.keyboard.addKey('A'),
      right: this.input.keyboard.addKey('D')
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch controls for mobile
    this.setupTouchControls();

    console.log('[GameScene] Game started');
  }

  setupTouchControls() {
    // Track touch state
    this.touchState = {
      isMovingLeft: false,
      isMovingRight: false,
      isShooting: false
    };

    // Enable pointer events
    this.input.on('pointerdown', (pointer) => {
      const { width, height } = this.cameras.main;
      
      // Top half = shoot
      if (pointer.y < height * 0.7) {
        this.touchState.isShooting = true;
      }
      // Bottom half = move
      else {
        if (pointer.x < width / 2) {
          this.touchState.isMovingLeft = true;
        } else {
          this.touchState.isMovingRight = true;
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const { width, height } = this.cameras.main;
        
        // Update movement based on pointer position
        if (pointer.y >= height * 0.7) {
          this.touchState.isMovingLeft = pointer.x < width / 2;
          this.touchState.isMovingRight = pointer.x >= width / 2;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.touchState.isMovingLeft = false;
      this.touchState.isMovingRight = false;
      this.touchState.isShooting = false;
    });
  }

  createHUD() {
    const hudStyle = { fontSize: '16px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 8, y: 4 } };
    
    this.scoreText = this.add.text(10, 10, 'Score: 0', hudStyle);
    this.waveText = this.add.text(10, 35, 'Wave: 1', hudStyle);
    this.enemiesText = this.add.text(10, 60, 'Enemies: 0', hudStyle);
    
    // Show currency
    const currency = ProgressionManager.currency;
    this.currencyText = this.add.text(10, 85, `Coins: ${currency}`, { 
      fontSize: '16px', 
      color: '#ffff00', 
      backgroundColor: '#000000', 
      padding: { x: 8, y: 4 } 
    });
    
    // Show shooter name
    const shooterName = this.player.shooterConfig.name;
    this.add.text(this.cameras.main.width - 10, 10, shooterName, {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0);
  }

  update(time, delta) {
    if (this.gameOver) {
      // Stop all enemy rendering
      if (this.enemies) {
        this.enemies.children.each(e => {
          if (e.active) {
            e.setActive(false);
            e.setVisible(false);
          }
        });
      }
      
      // Stop all powerups
      if (this.powerups) {
        this.powerups.children.each(p => {
          if (p.active) {
            p.setActive(false);
            p.setVisible(false);
          }
        });
      }
      
      // Stop all bullets
      if (this.bullets) {
        this.bullets.children.each(b => {
          if (b.active) {
            b.setActive(false);
            b.setVisible(false);
          }
        });
      }
      
      return;
    }
    
    const { height } = this.cameras.main;

    // Movement controls (lane-based)
    if ((this.cursors.left.isDown || this.wasd.left.isDown || this.touchState.isMovingLeft) && !this.player.isMovingToLane) {
      // Move to left lane
      const targetLane = Math.max(0, this.player.currentLane - 1);
      this.player.switchToLane(targetLane);
    }
    if ((this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.isMovingRight) && !this.player.isMovingToLane) {
      // Move to right lane
      const targetLane = Math.min(this.lanePositions.length - 1, this.player.currentLane + 1);
      this.player.switchToLane(targetLane);
    }

    // Lock Y position at bottom
    this.player.sprite.y = this.playerLockedY;
    this.player.sprite.setVelocity(0, 0);

    // Shooting (with fire rate control)
    if ((this.spaceKey.isDown || this.touchState.isShooting) && this.player.canShoot(time)) {
      this.shoot();
      this.player.setLastFireTime(time);
    }

    // Update bullets
    this.bullets.children.each(bullet => {
      if (bullet.active && (bullet.x < 0 || bullet.x > this.cameras.main.width || bullet.y < 0 || bullet.y > this.cameras.main.height)) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });
    
    // Update powerups (remove if off screen)
    this.powerups.children.each(powerup => {
      if (powerup.active && powerup.y > height + 50) {
        powerup.destroy();
      }
    });
    
    // Spawn powerups periodically (more frequent before first boss, slower after)
    if (!this.gameOver && !this.waveManager.purpleBossActive) {
      // Adjust spawn rate based on game phase
      let currentInterval = this.powerupSpawnInterval;
      if (this.waveManager.firstBossSpawned) {
        // Slower spawn rate after first boss (every 8 seconds instead of 3)
        currentInterval = 8000;
      }
      
      this.powerupSpawnTimer += delta;
      if (this.powerupSpawnTimer >= currentInterval) {
        this.spawnPowerup();
        this.powerupSpawnTimer = 0;
      }
    }

    // Update wave manager
    this.waveManager.update(time, delta);

    // Update HUD
    this.updateHUD();
  }

  shoot() {
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;
    const streams = this.player.stats.bulletStreams;
    
    // Calculate spread for multiple streams
    if (streams === 1) {
      // Single bullet from center
      const bullet = this.bullets.get(playerX, playerY);
      if (bullet) {
        this.configureBullet(bullet, playerX, playerY, 0);
      }
    } else if (streams === 2) {
      // Two bullets side by side
      const offset = 15;
      const bullet1 = this.bullets.get(playerX - offset, playerY);
      const bullet2 = this.bullets.get(playerX + offset, playerY);
      
      if (bullet1) this.configureBullet(bullet1, playerX - offset, playerY, 0);
      if (bullet2) this.configureBullet(bullet2, playerX + offset, playerY, 0);
    } else if (streams >= 3) {
      // Three bullets: left, center, right
      const offset = 20;
      const bullet1 = this.bullets.get(playerX - offset, playerY);
      const bullet2 = this.bullets.get(playerX, playerY);
      const bullet3 = this.bullets.get(playerX + offset, playerY);
      
      if (bullet1) this.configureBullet(bullet1, playerX - offset, playerY, 0);
      if (bullet2) this.configureBullet(bullet2, playerX, playerY, 0);
      if (bullet3) this.configureBullet(bullet3, playerX + offset, playerY, 0);
    }
  }
  
  configureBullet(bullet, x, y, angleOffset) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(90);
    bullet.setPosition(x, y);
    
    bullet.setTexture('bullet');
    bullet.setVelocityY(-this.player.stats.bulletSpeed);
    bullet.body.setSize(6, 6);
    bullet.damage = 1; // Always 1 damage per bullet
  }

  hitEnemy(bullet, enemy) {
    // Don't process if bullet or enemy already destroyed/inactive
    if (!bullet.active || !enemy.active) return;
    
    // Immediately disable bullet to prevent hitting multiple enemies in same frame
    bullet.setActive(false);
    bullet.setVisible(false);
    
    // Check if it's a boss
    if (enemy.isBoss && enemy.bossRef) {
      // Apply damage multiplier for bosses
      const damage = this.player.stats.bulletDamage;
      console.log('[GameScene] Boss hit! Player damage per bullet:', damage, 'streams:', this.player.stats.bulletStreams, 'total damage:', damage);
      enemy.bossRef.takeDamage(damage);
      
      // Flash boss
      enemy.setTint(0xffff00);
      this.time.delayedCall(100, () => {
        if (enemy.active) enemy.clearTint();
      });
      
      console.log('[GameScene] Boss hit! Health:', enemy.bossRef.health, '/', enemy.bossRef.maxHealth);
      
      if (enemy.bossRef.health <= 0 && !enemy.bossRef.destroyed) {
        // Boss defeated - different handling based on type
        console.log('[GameScene] Boss defeated! Type:', enemy.bossType, 'Health was:', enemy.bossRef.health);
        if (enemy.bossType === 'pink') {
          this.score += 100; // Pink bosses worth more points
          
          // Spawn extra powerups after pink boss defeat
          this.spawnExtraPowerups();
          
          // Show pink boss defeated message
          const text = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'PINK BOSS DEFEATED!', {
            fontSize: '24px', // Smaller for mobile
            color: '#ff69b4',
            stroke: '#ff0000',
            strokeThickness: 4
          }).setOrigin(0.5).setDepth(1000);
          
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
          });
        } else if (enemy.bossType === 'purple') {
          this.score += 200; // Purple boss worth the most points
          
          // Show purple boss defeated message
          const text = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'PURPLE BOSS DEFEATED!', {
            fontSize: '28px', // Slightly larger for final boss
            color: '#800080',
            stroke: '#ff00ff',
            strokeThickness: 4
          }).setOrigin(0.5).setDepth(1000);
          
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 3000, // Longer display for final boss
            onComplete: () => text.destroy()
          });
          
          console.log('[GameScene] 🟣 PURPLE BOSS DEFEATED! Wave should complete now.');
        } else {
          this.score += 25; // Normal bosses worth fewer points
          
          // Spawn extra powerups after normal boss defeat too
          this.spawnExtraPowerupsAfterNormalBoss();
          
          // Show normal boss defeated message
          const text = this.add.text(enemy.x, enemy.y, 'BOSS!', {
            fontSize: '18px', // Smaller for mobile
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5).setDepth(100);
          
          this.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
          });
        }
        
        this.kills++;
        
        // Handle purple boss specially - trigger wave completion immediately
        if (enemy.bossType === 'purple') {
          console.log('[GameScene] Purple boss died - triggering wave completion');
          console.log('[GameScene] Boss sprite before destroy:', enemy.active, enemy.visible, enemy.x, enemy.y);
          enemy.bossRef.destroy();
          console.log('[GameScene] Boss sprite after destroy:', enemy.active, enemy.visible);
          this.waveManager.enemyKilled();
          this.waveManager.clearCurrentBoss(); // This will trigger waveComplete() for purple boss
          return; // Exit early for purple boss
        }
        
        enemy.bossRef.destroy();
        this.waveManager.enemyKilled();
        this.waveManager.clearCurrentBoss(); // Clear current boss so next one can spawn
      }
    } else {
      // Regular enemy - destroy immediately
      enemy.destroy();
      this.score += 10;
      this.kills++;
      this.waveManager.enemyKilled();
    }
  }
  
  spawnPowerup() {
    // Don't spawn powerups if game is over
    if (this.gameOver) {
      console.log('[GameScene] Game over - not spawning powerup');
      return;
    }
    
    // Randomly choose a lane
    const lane = Math.floor(Math.random() * this.lanePositions.length);
    const x = this.lanePositions[lane];
    const y = 50; // Spawn at top of screen (visible)
    
    // Alternate between lvl1 and lvl2 powerups
    this.powerupType = this.powerupType === 'lvl1PowerUp' ? 'lvl2PowerUp' : 'lvl1PowerUp';
    
    console.log('[GameScene] Spawning powerup type:', this.powerupType, 'at lane', lane, 'position x:', x, 'y:', y);
    
    try {
      const powerup = new Powerup(this, x, y, this.powerupType);
      this.powerups.add(powerup.sprite);
      
      // Ensure physics body is enabled and configured
      if (powerup.sprite.body) {
        powerup.sprite.body.enable = true;
        powerup.sprite.body.setAllowGravity(false);
        // Set slower velocity for easier collection (80 px/s instead of 100)
        powerup.sprite.body.setVelocityY(80);
        console.log('[GameScene] Velocity set to 80, current velocity:', powerup.sprite.body.velocity.y);
        console.log('[GameScene] Powerup body size:', powerup.sprite.body.width, 'x', powerup.sprite.body.height);
      } else {
        console.error('[GameScene] Powerup has no physics body after adding to group!');
      }
      
      console.log('[GameScene] Powerup added to group, total powerups:', this.powerups.getLength());
    } catch (error) {
      console.error('[GameScene] Error creating powerup:', error);
    }
  }
  
  spawnExtraPowerups() {
    // Spawn 4-6 extra powerups after pink boss defeat to help with next boss
    const numExtra = Phaser.Math.Between(4, 6);
    
    for (let i = 0; i < numExtra; i++) {
      // Delay each spawn slightly
      this.time.delayedCall(i * 300, () => {
        if (!this.gameOver) {
          this.spawnPowerup();
        }
      });
    }
    
    console.log('[GameScene] Spawning', numExtra, 'extra powerups after pink boss defeat');
  }
  
  spawnExtraPowerupsAfterNormalBoss() {
    // Spawn 2-3 extra powerups after normal boss defeat
    const numExtra = Phaser.Math.Between(2, 3);
    
    for (let i = 0; i < numExtra; i++) {
      // Delay each spawn slightly
      this.time.delayedCall(i * 400, () => {
        if (!this.gameOver) {
          this.spawnPowerup();
        }
      });
    }
    
    console.log('[GameScene] Spawning', numExtra, 'extra powerups after normal boss defeat');
  }
  
  collectPowerup(player, powerupSprite) {
    const type = powerupSprite.powerupType;
    
    if (type === 'lvl1PowerUp') {
      this.lvl1PowerupsCollected++;
      
      // Diminishing returns: starts at 2x speed increase, decreases to 1.2x
      // Formula: 2.0 - (collected * 0.1), minimum 1.2x
      const speedMultiplier = Math.max(1.2, 2.0 - (this.lvl1PowerupsCollected * 0.1));
      
      // Apply diminishing speed increase
      const oldFireRate = this.player.stats.fireRate;
      const waveMinFireRate = this.waveManager.getMinFireRate();
      this.player.stats.fireRate = Math.max(waveMinFireRate, this.player.stats.fireRate / speedMultiplier); // Cap at wave minimum
      
      console.log('[GameScene] lvl1PowerUp collected!', this.lvl1PowerupsCollected, 'total. Speed multiplier:', speedMultiplier.toFixed(1), 'Fire rate:', oldFireRate, '->', this.player.stats.fireRate);
      
      // Visual feedback
      const text = this.add.text(powerupSprite.x, powerupSprite.y, `+SPEED x${speedMultiplier.toFixed(1)}!`, {
        fontSize: '16px', // Smaller for mobile
        color: '#ffff00'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
      });
    } else if (type === 'lvl2PowerUp') {
      this.lvl2PowerupsCollected++;
      
      // Diminishing returns: starts at 1.5x damage increase, decreases to 1.1x
      // Formula: 1.5 - (collected * 0.05), minimum 1.1x
      const damageMultiplier = Math.max(1.1, 1.5 - (this.lvl2PowerupsCollected * 0.05));
      
      // Apply diminishing damage increase with wave-based cap
      const waveMaxDamage = this.waveManager.getMaxPlayerDamage();
      const oldDamage = this.player.stats.bulletDamage;
      this.player.stats.bulletDamage = Math.min(waveMaxDamage, this.player.stats.bulletDamage * damageMultiplier);
      this.player.stats.bulletDamage = Math.round(this.player.stats.bulletDamage); // Ensure whole number
      
      // Increase bullet streams up to wave-based max
      const waveMaxStreams = this.waveManager.getMaxBulletStreams();
      if (this.player.stats.bulletStreams < waveMaxStreams) {
        this.player.stats.bulletStreams++;
      }
      
      console.log('[GameScene] lvl2PowerUp collected!', this.lvl2PowerupsCollected, 'total. Damage multiplier:', damageMultiplier.toFixed(2), 'Damage:', oldDamage.toFixed(2), '->', this.player.stats.bulletDamage.toFixed(2), 'Streams:', this.player.stats.bulletStreams, '/', waveMaxStreams);
      
      // Visual feedback
      const damageText = `+DAMAGE x${damageMultiplier.toFixed(1)}!`;
      const streamsText = this.player.stats.bulletStreams > 1 ? `\n${this.player.stats.bulletStreams} STREAMS!` : '';
      const cappedText = this.player.stats.bulletDamage >= waveMaxDamage ? '\n[MAX REACHED]' : '';
      
      const text = this.add.text(powerupSprite.x, powerupSprite.y, damageText + streamsText + cappedText, {
        fontSize: '14px', // Smaller for mobile
        color: '#ff0000',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
      });
    }
    
    powerupSprite.destroy();
  }

  hitPlayer(player, enemy) {
    // Check if already game over to prevent multiple triggers
    if (this.gameOver) {
      console.log('[GameScene] hitPlayer called but game already over');
      return;
    }
    
    console.log('[GameScene] Player hit by enemy! Game over!');
    console.log('[GameScene] Player position:', player.x, player.y, 'Enemy position:', enemy.x, enemy.y);
    console.log('[GameScene] Player active:', player.active, 'Enemy active:', enemy.active);
    
    // Immediate game over on any collision
    this.gameOver = true;
    
    // Destroy collider to prevent further collisions
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.destroy();
      this.playerEnemyCollider = null;
    }
    
    // Stop physics and wave manager
    this.physics.pause();
    if (this.waveManager) {
      this.waveManager.stop();
    }
    
    // Flash player red for visual feedback
    if (player && player.active) {
      player.setTint(0xff0000);
      console.log('[GameScene] Player flashed red');
    }
    
    // Call endGame immediately
    console.log('[GameScene] Calling endGame()');
    this.endGame();
  }

  enemyReachedBottom(enemy) {
    // Check if already game over to prevent multiple triggers
    if (this.gameOver) {
      console.log('[GameScene] enemyReachedBottom called but game already over');
      return;
    }
    
    console.log('[GameScene] Enemy reached bottom! Game over!');
    
    // Immediate game over when enemy reaches bottom
    this.gameOver = true;
    
    // Destroy collider to prevent further collisions
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.destroy();
      this.playerEnemyCollider = null;
    }
    
    // Stop physics and wave manager
    this.physics.pause();
    if (this.waveManager) {
      this.waveManager.stop();
    }
    
    // Flash enemy red for visual feedback
    if (enemy && enemy.active) {
      enemy.setTint(0xff0000);
    }
    
    // Call endGame immediately
    this.endGame();
  }

  updateHUD() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
    this.enemiesText.setText(`Enemies: ${this.enemies.getLength()}`);
  }

  async endGame(isVictory = false) {
    // Prevent multiple calls
    if (this.gameOverScreenShown) {
      console.log('[GameScene] endGame already shown, skipping');
      return;
    }
    this.gameOverScreenShown = true;
    
    console.log('[GameScene] endGame() called - showing game over screen');
    
    this.gameOver = true;
    this.physics.pause();
    
    // Show game over screen IMMEDIATELY with high depth
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    overlay.setDepth(1000);
    
    console.log('[GameScene] Overlay created');
    
    const gameOverText = this.add.text(width / 2, height / 2 - 100, isVictory ? 'VICTORY!' : 'GAME OVER', {
      fontSize: '42px',
      color: isVictory ? '#00ff00' : '#ff0000'
    }).setOrigin(0.5).setDepth(1001);

    const scoreText = this.add.text(width / 2, height / 2 - 40, `Final Score: ${this.score}`, {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001);

    const waveText = this.add.text(width / 2, height / 2 - 5, `Wave Reached: ${this.waveManager.currentWave}`, {
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(1001);

    const killsText = this.add.text(width / 2, height / 2 + 25, `Kills: ${this.kills}`, {
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(1001);
    
    console.log('[GameScene] Game over text created');

    // Record session in progression system
    const sessionResult = ProgressionManager.recordGameSession(
      this.score,
      this.waveManager.currentWave,
      this.kills
    );

    // Save high score
    const highScore = localStorage.getItem('highScore') || 0;
    if (this.score > highScore) {
      localStorage.setItem('highScore', this.score);
    }

    // Show currency earned
    this.add.text(width / 2, height / 2 + 55, `+${sessionResult.currencyEarned} Coins`, {
      fontSize: '20px',
      color: '#ffff00'
    }).setOrigin(0.5).setDepth(1001);

    const restartText = this.add.text(width / 2, height / 2 + 100, 'Click or Press SPACE to Restart', {
      fontSize: '22px',
      color: '#00ff00'
    }).setOrigin(0.5).setDepth(1001);
    
    console.log('[GameScene] Restart text created');

    // Create a restart handler
    const restartGame = () => {
      console.log('[GameScene] Restarting game...');
      
      // Clean up all event listeners
      this.input.keyboard.removeAllListeners();
      this.input.removeAllListeners();
      restartText.removeAllListeners();
      
      // Stop and restart the scene
      this.scene.restart();
    };

    // Enable restart on click (interactive text)
    restartText.setInteractive({ useHandCursor: true });
    restartText.on('pointerdown', () => {
      console.log('[GameScene] Restart button clicked');
      restartGame();
    });
    
    // Enable restart on space key
    this.input.keyboard.on('keydown-SPACE', () => {
      console.log('[GameScene] Space pressed, restarting');
      restartGame();
    });
    
    // Also enable general pointer down anywhere on screen (fallback)
    this.input.on('pointerdown', () => {
      console.log('[GameScene] Screen tapped, restarting');
      restartGame();
    });
    
    console.log('[GameScene] Game over screen complete - waiting for user input');

    // API call (non-blocking - don't await)
    APIService.saveStats({
      score: this.score,
      wave: this.waveManager.currentWave,
      kills: this.kills,
      shooter: this.player.shooterConfig.id,
      timestamp: Date.now()
    }).catch(e => {
      console.log('[GameScene] API save failed (expected):', e.message);
    });
  }
}
