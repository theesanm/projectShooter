import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Powerup from '../entities/Powerup.js';
import WaveManager from '../systems/WaveManager.js';
import ProgressionManager from '../systems/ProgressionManager.js';
import ShooterManager from '../systems/ShooterManager.js';
import SoundManager from '../services/SoundManager.js';
import APIService from '../../services/APIService.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    console.log('[GameScene] Preload started');
    // Create sound manager (templates loaded synchronously in constructor)
    this.soundManager = new SoundManager(this);
    
    // Preload sound files
    this.soundManager.preloadSounds();

    // Load wave 1 background
    this.load.image('wave1_background', 'assets/scenes/wave1_background.png');
    
    console.log('[GameScene] Preload completed');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Add wave 1 background (behind all entities, above base background)
    this.add.image(width / 2, height / 2, 'wave1_background').setDepth(-1);

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
        const canCollide = bullet.active && enemy.active;
        
        // Log all collision attempts for bosses
        if (enemy.isBoss) {
          const bodyEnabled = enemy.body?.enable !== false;
          const bodyExists = !!enemy.body;
          const inWorld = enemy.body?.world !== null && enemy.body?.world !== undefined;
          
          console.log('[GameScene] 🎯 Boss collision check:', {
            canCollide,
            bulletActive: bullet.active,
            enemyActive: enemy.active,
            bodyExists,
            bodyEnabled,
            inWorld,
            bossType: enemy.bossType,
            distance: Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y).toFixed(1)
          });
          
          if (!bodyEnabled || !bodyExists || !inWorld) {
            console.error('[GameScene] ❌ Boss collision BLOCKED - body issue');
            
            // Emergency fix: re-enable body if it exists
            if (bodyExists && !bodyEnabled) {
              console.warn('[GameScene] EMERGENCY: Re-enabling boss body during collision check');
              enemy.body.enable = true;
              return true; // Allow collision after fixing
            }
          }
        }
        
        return canCollide;
      },
      this
    );
    
    // Powerup collection - CRITICAL
    this.powerupCollider = this.physics.add.overlap(
      this.player.sprite, 
      this.powerups, 
      (player, powerup) => {
        console.log('[GameScene] 🎉🎉🎉 POWERUP COLLISION CALLBACK FIRED!', powerup.powerupId);
        console.log('[GameScene] Powerup has powerupConfig:', !!powerup.powerupConfig);
        if (powerup.powerupConfig) {
          console.log('[GameScene] Config:', powerup.powerupConfig.powerup_name, powerup.powerupConfig.powerup_type);
        }
        this.collectPowerup(player, powerup);
      },
      (player, powerup) => {
        // Process callback - check if collection should happen
        const canCollect = !this.gameOver && player.active && powerup.active;
        if (canCollect && powerup.powerupConfig) {
          console.log('[GameScene] ⚡ OVERLAP DETECTED - Player:', player.x.toFixed(0), player.y.toFixed(0), 'Powerup:', powerup.x.toFixed(0), powerup.y.toFixed(0), 'Distance:', Phaser.Math.Distance.Between(player.x, player.y, powerup.x, powerup.y).toFixed(0));
          console.log('[GameScene] ⚡ Powerup details:', powerup.powerupConfig.powerup_name, 'Type:', powerup.powerupConfig.powerup_type, 'ID:', powerup.powerupId);
        } else if (!canCollect) {
          console.log('[GameScene] ❌ Collection blocked - gameOver:', this.gameOver, 'player active:', player.active, 'powerup active:', powerup.active);
        }
        return canCollect;
      }, 
      this
    );
    console.log('[GameScene] ✅ Powerup collision overlap configured - player:', this.player.sprite, 'powerups group:', this.powerups);
    
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

    // Unlock audio context
    this.soundManager.unlockAudio();

    // Decode loaded audio files
    this.soundManager.decodeLoadedAudio().catch(error => {
      console.error('[GameScene] Failed to decode audio:', error);
    });

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
    
    // Update powerups - keep them alive much longer
    const powerupCount = this.powerups.getLength();
    
    // Always log if there are powerups
    if (powerupCount > 0) {
      if (this.time.now % 1000 < 20) {
        console.log('[GameScene] 🎮 Powerups on screen:', powerupCount);
        // Log each powerup
        this.powerups.children.each(p => {
          if (p.active) {
            console.log('  - Powerup at', p.x.toFixed(0), p.y.toFixed(0), 'hasConfig:', !!p.powerupConfig, 'type:', p.powerupConfig?.powerup_type, 'id:', p.powerupId);
          }
        });
      }
    } else {
      // Log once per second that there are no powerups
      if (this.time.now % 2000 < 20) {
        console.log('[GameScene] No powerups on screen');
      }
    }
    
    // Only destroy powerups after 20 seconds OR if way off bottom of screen
    // (Powerups fall at 50px/s, from top y=-50 to player y=620 takes ~13 seconds)
    this.powerups.children.each(powerup => {
      if (!powerup.active) return;
      
      const aliveTime = Date.now() - (powerup.spawnTime || 0);
      const screenHeight = this.cameras.main.height;
      
      // Don't destroy powerups that just spawned (give them 2 seconds to enter screen)
      if (aliveTime < 2000) return;
      
      // Destroy if 20 seconds old OR way off bottom of screen (only check bottom, not top)
      if (aliveTime > 20000 || powerup.y > screenHeight + 200) {
        console.log('[GameScene] 🗑️ Removing powerup', powerup.powerupId, 'age:', (aliveTime/1000).toFixed(1), 's', 'y:', powerup.y);
        powerup.destroy();
      }
    });
    
    // OLD powerup spawning system disabled - now using database-driven powerup drops from WaveManager
    // Powerups now drop from enemies based on wave_powerup_pool configuration
    // if (!this.gameOver && this.waveManager.waveActive) {
    //   let currentInterval = this.powerupSpawnInterval;
    //   if (this.waveManager.firstBossSpawned) {
    //     currentInterval = 8000;
    //   }
    //   
    //   this.powerupSpawnTimer += delta;
    //   if (this.powerupSpawnTimer >= currentInterval) {
    //     this.spawnPowerup();
    //     this.powerupSpawnTimer = 0;
    //   }
    // }

    // CRITICAL: Ensure all boss physics bodies stay enabled every frame
    this.enemies.children.each(enemy => {
      if (enemy.active && enemy.isBoss && enemy.body) {
        // Always force enable, don't just check
        const wasDisabled = !enemy.body.enable;
        enemy.body.enable = true;
        
        if (wasDisabled) {
          console.error('[GameScene] ⚠️⚠️⚠️ Boss body was disabled! Re-enabled. Boss:', enemy.bossType);
        }
        
        // Also ensure body is in physics world
        if (!enemy.body.world) {
          console.error('[GameScene] Boss body not in physics world! Re-adding.');
          this.physics.world.enable(enemy);
        }
      }
    });

    // Update wave manager
    this.waveManager.update(time, delta);

    // Update HUD
    this.updateHUD();
  }

  shoot() {
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;
    const streams = this.player.stats.bulletStreams;
    
    // Play weapon shoot sound
    this.soundManager.playWeaponSound('basicPistol', 'shoot');
    
    console.log('[GameScene] 🔫 Shooting with', streams, 'bullet streams. Full stats:', JSON.stringify(this.player.stats));
    
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
    } else if (streams === 3) {
      // Three bullets: left, center, right
      const offset = 20;
      const bullet1 = this.bullets.get(playerX - offset, playerY);
      const bullet2 = this.bullets.get(playerX, playerY);
      const bullet3 = this.bullets.get(playerX + offset, playerY);
      
      if (bullet1) this.configureBullet(bullet1, playerX - offset, playerY, 0);
      if (bullet2) this.configureBullet(bullet2, playerX, playerY, 0);
      if (bullet3) this.configureBullet(bullet3, playerX + offset, playerY, 0);
    } else {
      // 4+ bullets: spread them out in a fan pattern
      const baseOffset = 15; // Base spacing between bullets
      const totalWidth = baseOffset * (streams - 1);
      const startX = playerX - (totalWidth / 2);
      
      for (let i = 0; i < streams; i++) {
        const x = startX + (i * baseOffset);
        const bullet = this.bullets.get(x, playerY);
        if (bullet) {
          // Optional: Add slight angle for wider spreads
          const angle = 0; // Could add spread angle for visual effect
          this.configureBullet(bullet, x, playerY, angle);
        }
      }
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
    if (!bullet.active || !enemy.active) {
      console.log('[GameScene] Hit skipped - bullet active:', bullet.active, 'enemy active:', enemy.active);
      return;
    }
    
    console.log('[GameScene] Hit detected! Bullet at:', bullet.x.toFixed(1), bullet.y.toFixed(1), 'Enemy at:', enemy.x.toFixed(1), enemy.y.toFixed(1), 'Is Boss:', enemy.isBoss);
    
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
        // Boss defeated
        console.log('[GameScene] Boss defeated! Type:', enemy.bossType, 'Health was:', enemy.bossRef.health);
        
        // Stop boss alive sound and play death sound
        const bossIdMap = {
          'normal': 'normalRed',
          'tank': 'pinkSpecial',
          'boss': 'purpleLaneSwitcher',
          'golden': 'goldenTank'
        };
        const bossId = bossIdMap[enemy.bossType] || 'normalRed';
        this.soundManager.stopBossSound(bossId, 'alive');
        this.soundManager.playBossSound(bossId, 'death');
        
        // Play player victory vocal
        this.soundManager.playPlayerVocal('defaultPlayer', 'bossDefeat');
        
        // Award points based on boss
        const baseScore = 50;
        this.score += baseScore;
        
        // Spawn powerups after boss defeat
        this.spawnExtraPowerupsAfterNormalBoss();
        
        // Show boss defeated message
        const text = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'BOSS DEFEATED!', {
          fontSize: '28px',
          color: '#ff0000',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5).setDepth(1000);
        
        this.tweens.add({
          targets: text,
          alpha: 0,
          duration: 2000,
          onComplete: () => text.destroy()
        });
        
        this.kills++;
        
        // Handle main boss specially - trigger wave completion
        if (enemy.isMainBoss) {
          console.log('[GameScene] Main boss died - triggering wave completion');
          console.log('[GameScene] Boss sprite before destroy:', enemy.active, enemy.visible, enemy.x, enemy.y);
          enemy.bossRef.destroy();
          console.log('[GameScene] Boss sprite after destroy:', enemy.active, enemy.visible);
          
          // Remove from enemies group to prevent collision checks on dead boss
          this.enemies.remove(enemy, true, true); // remove, destroyChild, removeFromScene
          
          this.waveManager.enemyKilled();
          this.waveManager.clearCurrentBoss(); // This will trigger waveComplete() for main boss
          return; // Exit early for main boss
        }
        
        enemy.bossRef.destroy();
        
        // Remove from enemies group to prevent collision checks on dead boss
        this.enemies.remove(enemy, true, true); // remove, destroyChild, removeFromScene
        
        this.waveManager.enemyKilled();
        this.waveManager.clearCurrentBoss(); // Clear current boss so next one can spawn
      }
    } else {
      // Regular enemy - check if multi-hit enemy
      if (enemy.enemyRef && enemy.currentHits > 1) {
        // Multi-hit enemy - take damage
        const isDestroyed = enemy.enemyRef.takeDamage();
        
        // Flash enemy on hit
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          if (enemy.active) enemy.clearTint();
        });
        
        if (isDestroyed) {
          // Enemy destroyed after taking enough hits
          console.log('[GameScene] Multi-hit enemy destroyed after', enemy.hitPoints, 'hits');
          
          // Try to drop powerup
          const dropPosition = { x: enemy.x, y: enemy.y };
          this.waveManager.tryDropPowerup(dropPosition);
          
          if (enemy.enemyRef) {
            enemy.enemyRef.destroy();
          }
          enemy.destroy();
          this.score += 10 * enemy.hitPoints; // More points for multi-hit enemies
          this.kills++;
          this.waveManager.enemyKilled();
        } else {
          console.log('[GameScene] Multi-hit enemy hit! Remaining hits:', enemy.currentHits);
        }
      } else {
        // Regular single-hit enemy - destroy immediately
        
        // Try to drop powerup
        const dropPosition = { x: enemy.x, y: enemy.y };
        this.waveManager.tryDropPowerup(dropPosition);
        
        if (enemy.enemyRef) {
          enemy.enemyRef.destroy();
        }
        enemy.destroy();
        this.score += 10;
        this.kills++;
        this.waveManager.enemyKilled();
      }
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
        if (!this.gameOver && this.waveManager.waveActive) {
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
        if (!this.gameOver && this.waveManager.waveActive) {
          this.spawnPowerup();
        }
      });
    }
    
    console.log('[GameScene] Spawning', numExtra, 'extra powerups after normal boss defeat');
  }
  
  collectPowerup(player, powerupSprite) {
    console.log('[GameScene] ========== collectPowerup CALLED ==========');
    console.log('[GameScene] Powerup:', powerupSprite.x, powerupSprite.y, 'has powerupConfig:', !!powerupSprite.powerupConfig, 'has powerupType:', !!powerupSprite.powerupType);
    
    // Handle both old powerups (powerupType) and new database powerups (powerupConfig)
    if (powerupSprite.powerupConfig) {
      // New database-driven powerup - let WaveManager handle everything
      const config = powerupSprite.powerupConfig;
      console.log('[GameScene] 🎁 Collected database powerup:', config.powerup_name, 'Type:', config.powerup_type, 'Effect:', config.effect);
      console.log('[GameScene] Player stats BEFORE:', JSON.stringify(this.player.stats));
      
      // Let WaveManager handle the effect AND destruction
      this.waveManager.collectPowerup(powerupSprite);
      
      console.log('[GameScene] Player stats AFTER:', JSON.stringify(this.player.stats));
      console.log('[GameScene] ========== collectPowerup DONE ==========');
      return;
    }
    
    // Old hardcoded powerup system (fallback)
    const type = powerupSprite.powerupType;
    
    // Play powerup collection sound
    this.soundManager.playPowerupSound(type);
    
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
    
    // CRITICAL: Re-enable all boss physics bodies after powerup collection
    // Powerup collection can sometimes affect collision detection state
    this.enemies.children.each(enemy => {
      if (enemy.active && enemy.isBoss && enemy.body) {
        if (!enemy.body.enable) {
          console.warn('[GameScene] Re-enabling boss body after powerup collection');
          enemy.body.enable = true;
        }
      }
    });
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
    
    // Stop all sounds
    this.soundManager.stopAllMusic();
    
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
    
    // Stop all sounds
    this.soundManager.stopAllMusic();
    
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
