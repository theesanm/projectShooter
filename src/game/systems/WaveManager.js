import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Powerup from '../entities/Powerup.js';
import apiService from '../../services/APIService.js';

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
    this.multiEnemySpawnEnabled = false; // Enable after 20 seconds
    this.lastMultiSpawnTime = 0; // Track last multi-spawn
    this.multiSpawnInterval = 5000; // Spawn multiple enemies every 5 seconds after 20 seconds
    
    // Template system
    this.waveTemplates = null;
    this.bossTemplates = null;
    this.currentWaveConfig = null;
    this.enemyTemplates = null; // Store enemy data from API
    this.enemyPool = []; // Store wave-specific enemy pool
    this.powerupPool = []; // Store wave-specific powerup pool
    this.lastPowerupDropTime = 0; // Track last powerup drop for cooldown
    
    // API Service (imported as singleton instance)
    this.apiService = apiService;
    
    // Lane system
    this.scene = scene;
    this.lanePositions = scene.lanePositions || [];
    console.log('[WaveManager] Lane positions received:', this.lanePositions, 'from scene:', !!scene.lanePositions);
    if (scene.lanePositions) {
      console.log('[WaveManager] Scene lanePositions:', scene.lanePositions);
    }

    // Load templates
    this.loadTemplates();
    
    // Start first wave
    this.startWave();
  }

  async loadTemplates() {
    try {
      // Load wave configuration from API
      const waveResult = await this.apiService.getWaveConfig(this.currentWave);
      if (waveResult.success) {
        this.currentWaveConfig = waveResult.data;
        console.log('[WaveManager] Wave config loaded from API:', this.currentWaveConfig);
        console.log('[WaveManager] Boss sequence:', this.currentWaveConfig.bossSequence);
        console.log('[WaveManager] All config keys:', Object.keys(this.currentWaveConfig));
        
        // Update wave config now that API data is loaded
        if (this.waveActive) {
          this.loadWaveConfig();
        }
      } else {
        console.warn('[WaveManager] Failed to load wave config from API:', waveResult);
      }
      
      // Load enemy pool for this wave
      try {
        const enemyPoolResponse = await fetch(`http://localhost:3001/api/waves/${this.currentWave}/enemies`);
        if (enemyPoolResponse.ok) {
          this.enemyPool = await enemyPoolResponse.json();
          console.log('[WaveManager] Enemy pool loaded:', this.enemyPool.length, 'enemies');
        } else {
          this.enemyPool = [];
          console.warn('[WaveManager] No enemy pool configured for this wave');
        }
      } catch (error) {
        console.error('[WaveManager] Failed to load enemy pool:', error);
        this.enemyPool = [];
      }
      
      // Load powerup pool for this wave
      try {
        const powerupPoolResponse = await fetch(`http://localhost:3001/api/waves/${this.currentWave}/powerups`);
        if (powerupPoolResponse.ok) {
          this.powerupPool = await powerupPoolResponse.json();
          console.log('[WaveManager] Powerup pool loaded:', this.powerupPool.length, 'powerups');
        } else {
          this.powerupPool = [];
          console.warn('[WaveManager] No powerup pool configured for this wave');
        }
      } catch (error) {
        console.error('[WaveManager] Failed to load powerup pool:', error);
        this.powerupPool = [];
      }
      
      // Load boss templates (fallback to local file)
      const bossResponse = await fetch('/config/bosses/bossTemplates.json');
      this.bossTemplates = await bossResponse.json();
      
      console.log('[WaveManager] Templates loaded successfully');
    } catch (error) {
      console.error('[WaveManager] Failed to load templates:', error);
      // Fallback to hardcoded behavior if templates fail to load
    }
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
    this.bossSpawnInterval = 10000; // Boss spawn interval
    this.normalBossInterval = 6000; // Normal boss every 6 seconds
    this.currentBoss = null; // Track current active boss
    this.firstBossSpawned = false; // Track when first boss has been spawned
    this.multiEnemySpawnEnabled = false; // Reset multi-enemy spawn
    this.mainBossActive = false; // Track if main boss is currently active
    this.lastMultiSpawnTime = 0;
    
    // Load wave configuration from template
    this.loadWaveConfig();
    
    // Start wave music and ambient sounds (wait for audio to be ready)
    this.startWaveAudio();
    
    // Show wave notification
    this.showWaveNotification();
    
    // First boss will be spawned in update() method at 15 seconds
  }

  startWaveAudio() {
    const waveId = `wave${this.currentWave}`;
    
    // Check if audio is ready, if not, wait for it
    if (this.scene.soundManager.isAudioReady) {
      this.scene.soundManager.playWaveMusic(waveId);
      this.scene.soundManager.playWaveAmbient(waveId);
    } else {
      // Wait for audio to be ready, then play
      const checkAudioReady = () => {
        if (this.scene.soundManager.isAudioReady) {
          this.scene.soundManager.playWaveMusic(waveId);
          this.scene.soundManager.playWaveAmbient(waveId);
        } else {
          // Check again in next frame
          this.scene.time.delayedCall(100, checkAudioReady);
        }
      };
      this.scene.time.delayedCall(100, checkAudioReady);
    }
  }

  loadWaveConfig() {
    // Use API data if available
    if (this.currentWaveConfig) {
      console.log(`[WaveManager] Using wave config from API:`, this.currentWaveConfig);
      console.log(`[WaveManager] Boss sequence count:`, this.currentWaveConfig.bossSequence?.length || 0);
      
      // Apply API settings
      this.enemiesPerWave = this.currentWaveConfig.max_enemies || 200;
      this.spawnInterval = this.currentWaveConfig.enemy_spawn_rate_ms || 2000;
      this.waveDuration = this.currentWaveConfig.duration_ms || 60000;
      
      console.log(`[WaveManager] Wave ${this.currentWave} (${this.currentWaveConfig.name}): ${this.enemiesPerWave} enemies, ${this.spawnInterval}ms interval, ${this.waveDuration/1000}s duration`);
      return;
    }
    
    console.log('[WaveManager] No API config available, checking templates...');
    
    // Fallback to template system
    const waveId = `wave${this.currentWave}`;
    
    if (this.waveTemplates && this.waveTemplates.waves && this.waveTemplates.waves[waveId]) {
      this.currentWaveConfig = this.waveTemplates.waves[waveId];
      console.log(`[WaveManager] Loaded wave config for ${waveId}:`, this.currentWaveConfig.name);
      
      // Apply template settings
      this.enemiesPerWave = this.currentWaveConfig.maxEnemies || 200;
      this.spawnInterval = this.currentWaveConfig.enemySpawnRate || 900;
      this.waveDuration = this.currentWaveConfig.duration || 180000;
      
      console.log(`[WaveManager] Wave ${this.currentWave} (${this.currentWaveConfig.name}): ${this.enemiesPerWave} enemies, ${this.spawnInterval}ms interval, ${this.waveDuration/1000}s duration`);
    } else {
      // Fallback to hardcoded wave 1 configuration
      console.log('[WaveManager] No template found, using hardcoded wave 1 config');
      this.enemiesPerWave = 200;
      this.spawnInterval = 900;
      this.waveDuration = 180000;
      this.currentWaveConfig = {
        name: 'WAVE 1',
        description: 'The invasion begins...'
      };
    }
  }

  showWaveNotification() {
    const { width, height } = this.scene.cameras.main;
    const waveName = this.currentWaveConfig ? this.currentWaveConfig.name : `WAVE ${this.currentWave}`;
    const text = this.scene.add.text(width / 2, height / 2, waveName, {
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

    // Check if wave duration has been reached (but not if main boss is active)
    if (elapsedTime >= this.waveDuration && !this.mainBossActive) {
      console.log('[WaveManager] Wave duration reached, ending wave');
      this.waveComplete();
      return;
    }

    // Enable multi-enemy spawning after 15 seconds for increased difficulty
    if (elapsedTime >= 15000 && !this.multiEnemySpawnEnabled) {
      this.multiEnemySpawnEnabled = true;
      console.log('[WaveManager] Multi-enemy spawning ENABLED at 15 seconds!');
    }

    // Use template-based boss spawning if available
    console.log('[WaveManager] Checking wave config:', {
      hasConfig: !!this.currentWaveConfig,
      hasBossSequence: !!(this.currentWaveConfig && this.currentWaveConfig.bossSequence),
      bossCount: this.currentWaveConfig?.bossSequence?.length || 0
    });
    
    if (this.currentWaveConfig && this.currentWaveConfig.bossSequence && this.currentWaveConfig.bossSequence.length > 0) {
      console.log('[WaveManager] Using API boss sequence with', this.currentWaveConfig.bossSequence.length, 'bosses');
      this.updateTemplateBosses(elapsedTime);
    } else {
      // Fallback to hardcoded wave 1 logic
      console.log('[WaveManager] Using hardcoded boss logic (no API config available)');
      this.updateHardcodedBosses(elapsedTime);
    }

    // Check if current boss is still active (clear if destroyed or reached bottom)
    const playerY = this.scene.playerLockedY || this.scene.cameras.main.height - 100;
    if (this.currentBoss && (!this.currentBoss.active || this.currentBoss.y > playerY - 20)) {
      console.log('[WaveManager] Current boss reached bottom or destroyed');
      if (this.currentBoss.y > playerY - 20 && !this.scene.gameOver) {
        this.scene.enemyReachedBottom(this.currentBoss);
      }
      
      // Check if this was the main boss - if so, end the wave
      if (this.currentBoss.isMainBoss) {
        console.log('[WaveManager] 🏆 MAIN BOSS DEFEATED! Wave complete!');
        this.mainBossActive = false;
        this.waveComplete();
        return;
      }
      
      this.clearCurrentBoss();
    }

    // Spawn enemies (but not if main boss is active)
    if (this.enemiesSpawned < this.enemiesPerWave && !this.scene.gameOver && !this.mainBossActive) {
      this.spawnTimer += delta;
      
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnEnemy();
        this.spawnTimer = 0;
      }
      
      // Spawn multiple enemies after 20 seconds
      if (this.multiEnemySpawnEnabled) {
        const timeSinceLastMultiSpawn = Date.now() - this.lastMultiSpawnTime;
        if (timeSinceLastMultiSpawn >= this.multiSpawnInterval) {
          this.spawnMultipleEnemies();
          this.lastMultiSpawnTime = Date.now();
        }
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
            console.log('[WaveManager] Boss moving at speed:', speed.toFixed(1), 'px/s, health:', enemy.bossRef.health, '/', enemy.bossRef.maxHealth, 'body enabled:', enemy.body?.enable, 'actual velocity:', enemy.body?.velocity.y.toFixed(1));
          }
          
          // Ensure boss physics body stays enabled
          if (enemy.body && !enemy.body.enable) {
            console.warn('[WaveManager] Boss body was disabled! Re-enabling...');
            enemy.body.enable = true;
          }
        } else {
          speed = 100; // Regular enemies
        }
        
        enemy.setVelocityY(speed);
        enemy.setVelocityX(0); // CRITICAL: No horizontal movement
        
        // Update enemy hit text position for multi-hit enemies
        if (enemy.enemyRef && enemy.enemyRef.updateHitTextPosition) {
          enemy.enemyRef.updateHitTextPosition();
        }
        
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

  updateTemplateBosses(elapsedTime) {
    // Initialize spawned bosses tracking if not exists
    if (!this.spawnedBossIds) {
      this.spawnedBossIds = new Set();
      console.log('[WaveManager] Initialized spawnedBossIds set');
    }

    console.log('[WaveManager] updateTemplateBosses - elapsed:', elapsedTime, 'ms, boss sequence length:', this.currentWaveConfig.bossSequence?.length || 0);

    // Check each boss in the sequence
    for (const bossConfig of this.currentWaveConfig.bossSequence) {
      const spawnTime = bossConfig.spawn_time_ms || bossConfig.spawnTime;
      const bossId = bossConfig.boss_id || bossConfig.bossId;
      
      console.log('[WaveManager] Boss check:', bossConfig.boss_name, 'spawn at:', spawnTime, 'elapsed:', elapsedTime, 'spawned:', this.spawnedBossIds.has(bossId), 'has current boss:', !!this.currentBoss);
      
      if (elapsedTime >= spawnTime && !this.spawnedBossIds.has(bossId)) {
        if (!this.currentBoss) {
          console.log(`[WaveManager] Spawning boss from API: ${bossConfig.boss_name} at ${spawnTime}ms (elapsed: ${elapsedTime}ms)`);
          this.spawnBossFromAPI(bossConfig);
          this.spawnedBossIds.add(bossId);
          
          // Store boss config on the current boss entity for later reference
          if (this.currentBoss) {
            this.currentBoss.bossConfig = bossConfig;
          }
          
          if (bossConfig.is_main_boss) {
            console.log(`[WaveManager] ${bossConfig.boss_name} is MAIN BOSS - wave will end when defeated`);
            console.log('[WaveManager] 🛑 ENEMY SPAWNING STOPPED - Main boss is now active!');
            this.mainBossSpawned = true;
            this.mainBossActive = true;
          }
        } else {
          // Boss is ready to spawn but waiting for current boss to be defeated
          if (!this.pendingBoss) {
            console.log(`[WaveManager] Boss ${bossConfig.boss_name} is pending (waiting for current boss)`);
            this.pendingBoss = bossConfig;
          }
        }
      }
    }
    
    // If current boss is defeated and there's a pending boss, spawn it
    if (!this.currentBoss && this.pendingBoss) {
      const bossId = this.pendingBoss.boss_id || this.pendingBoss.bossId;
      if (!this.spawnedBossIds.has(bossId)) {
        console.log(`[WaveManager] Spawning pending boss: ${this.pendingBoss.boss_name}`);
        this.spawnBossFromAPI(this.pendingBoss);
        this.spawnedBossIds.add(bossId);
        
        // Store boss config on the current boss entity
        if (this.currentBoss) {
          this.currentBoss.bossConfig = this.pendingBoss;
        }
        
        this.pendingBoss = null;
      }
    }
  }

  updateHardcodedBosses(elapsedTime) {
    // FALLBACK: Simple boss spawning when API is unavailable
    // Only spawns basic 'normal' type bosses (red fallback texture)
    
    // Spawn first boss at 15 seconds
    if (elapsedTime >= 15000 && !this.currentBoss && this.bossCount === 0) {
      console.log('[WaveManager] FALLBACK: Spawning first boss at 15 seconds (normal type)');
      this.spawnBoss('normal');
      this.lastNormalBossTime = Date.now();
      this.firstBossSpawned = true;
    }

    // Spawn additional bosses every 20 seconds after the first
    if (!this.scene.gameOver && !this.currentBoss && this.bossCount > 0) {
      const timeSinceLastBoss = Date.now() - this.lastNormalBossTime;
      if (timeSinceLastBoss >= 20000) { // Every 20 seconds
        console.log(`[WaveManager] FALLBACK: Spawning boss #${this.bossCount + 1} (normal type)`);
        this.spawnBoss('normal');
        this.lastNormalBossTime = Date.now();
      }
    }
  }

  isBossSpawned(bossId) {
    // Track spawned bosses to avoid duplicates
    if (!this.spawnedBosses) this.spawnedBosses = new Set();
    return this.spawnedBosses.has(bossId);
  }

  markBossAsSpawned(bossId) {
    if (!this.spawnedBosses) this.spawnedBosses = new Set();
    this.spawnedBosses.add(bossId);
  }

  spawnEnemy() {
    // Check if we have enemy pool configured
    if (!this.enemyPool || this.enemyPool.length === 0) {
      console.warn('[WaveManager] No enemy pool configured, skipping spawn');
      return;
    }

    const { width, height } = this.scene.cameras.main;
    const elapsedTime = Date.now() - this.waveStartTime;
    
    // Filter enemies available at this time
    const availableEnemies = this.enemyPool.filter(e => 
      elapsedTime >= (e.min_spawn_time_ms || 0) &&
      (e.max_spawn_time_ms === null || e.max_spawn_time_ms === undefined || elapsedTime <= e.max_spawn_time_ms)
    );
    
    if (availableEnemies.length === 0) {
      console.log('[WaveManager] No enemies available at this time');
      return;
    }
    
    // Weighted random selection
    const totalWeight = availableEnemies.reduce((sum, e) => sum + (e.spawn_weight || 100), 0);
    let random = Math.random() * totalWeight;
    let selectedEnemy = availableEnemies[0];
    
    for (const enemy of availableEnemies) {
      random -= (enemy.spawn_weight || 100);
      if (random <= 0) {
        selectedEnemy = enemy;
        break;
      }
    }
    
    // Get lane positions from scene
    const lanePositions = this.scene.lanePositions || [this.scene.cameras.main.width * 0.3, this.scene.cameras.main.width * 0.7];
    
    // Randomly choose a lane
    const lane = Math.floor(Math.random() * lanePositions.length);
    const x = lanePositions[lane];
    const y = -20; // Spawn from top

    // Calculate stats with multipliers
    const health = Math.round((selectedEnemy.base_health || 100) * (selectedEnemy.health_multiplier || 1.0));
    const speed = Math.round((selectedEnemy.base_speed || 150) * (selectedEnemy.speed_multiplier || 1.0));
    const damage = Math.round((selectedEnemy.base_damage || 5) * (selectedEnemy.damage_multiplier || 1.0));
    
    // Convert health to hit points (basic formula)
    const hitPoints = Math.max(1, Math.ceil(health / 100));

    console.log('[WaveManager] Spawning enemy:', selectedEnemy.enemy_name, 'HP:', hitPoints, 'Speed:', speed, 'Damage:', damage);

    // Create Enemy instance with configured stats
    const enemyInstance = new Enemy(this.scene, x, y, selectedEnemy.enemy_type || 'basic', hitPoints);
    
    // Store enemy configuration for later use
    enemyInstance.sprite.enemyConfig = selectedEnemy;
    enemyInstance.sprite.baseSpeed = speed;
    enemyInstance.sprite.damage = damage;
    
    // If enemy has custom image, load it
    if (selectedEnemy.image) {
      const imageUrl = `http://localhost:3001${selectedEnemy.image}`;
      const imageKey = `enemy_${selectedEnemy.enemy_id}`;
      
      // Only load if not already loaded
      if (!this.scene.textures.exists(imageKey)) {
        this.scene.load.image(imageKey, imageUrl);
        this.scene.load.once('complete', () => {
          if (enemyInstance.sprite && enemyInstance.sprite.active) {
            enemyInstance.sprite.setTexture(imageKey);
          }
        });
        this.scene.load.start();
      } else {
        enemyInstance.sprite.setTexture(imageKey);
      }
    }
    
    // Add the enemy sprite to the physics group
    this.scene.enemies.add(enemyInstance.sprite);
    
    // Set additional properties
    enemyInstance.sprite.lane = lane;
    
    // Scale based on enemy type/config
    const scale = selectedEnemy.scale_min || 0.08;
    enemyInstance.sprite.setScale(scale);
    enemyInstance.sprite.body.setSize(enemyInstance.sprite.width * 0.6, enemyInstance.sprite.height * 0.6);

    this.enemiesSpawned++;
  }

  spawnMultipleEnemies() {
    // Check if we have enemy pool configured
    if (!this.enemyPool || this.enemyPool.length === 0) {
      console.warn('[WaveManager] No enemy pool configured, skipping multi-spawn');
      return;
    }

    // Spawn 2-4 enemies in a random lane
    const numEnemies = Math.floor(Math.random() * 3) + 2; // 2-4 enemies
    const { width, height } = this.scene.cameras.main;
    const lanePositions = this.scene.lanePositions || [this.scene.cameras.main.width * 0.3, this.scene.cameras.main.width * 0.7];
    
    // Choose a random lane
    const lane = Math.floor(Math.random() * lanePositions.length);
    const x = lanePositions[lane];
    
    console.log(`[WaveManager] Spawning ${numEnemies} enemies in lane ${lane}`);
    
    const elapsedTime = Date.now() - this.waveStartTime;
    
    // Spawn enemies with slight vertical spacing
    for (let i = 0; i < numEnemies; i++) {
      const y = -20 - (i * 40); // Vertical spacing between enemies
      
      // Filter enemies available at this time
      const availableEnemies = this.enemyPool.filter(e => 
        elapsedTime >= (e.min_spawn_time_ms || 0) &&
        (e.max_spawn_time_ms === null || e.max_spawn_time_ms === undefined || elapsedTime <= e.max_spawn_time_ms)
      );
      
      if (availableEnemies.length === 0) continue;
      
      // Weighted random selection
      const totalWeight = availableEnemies.reduce((sum, e) => sum + (e.spawn_weight || 100), 0);
      let random = Math.random() * totalWeight;
      let selectedEnemy = availableEnemies[0];
      
      for (const enemy of availableEnemies) {
        random -= (enemy.spawn_weight || 100);
        if (random <= 0) {
          selectedEnemy = enemy;
          break;
        }
      }
      
      // Calculate stats with multipliers
      const health = Math.round((selectedEnemy.base_health || 100) * (selectedEnemy.health_multiplier || 1.0));
      const speed = Math.round((selectedEnemy.base_speed || 150) * (selectedEnemy.speed_multiplier || 1.0));
      const damage = Math.round((selectedEnemy.base_damage || 5) * (selectedEnemy.damage_multiplier || 1.0));
      const hitPoints = Math.max(1, Math.ceil(health / 100));
      
      // Create Enemy instance which manages the sprite
      const enemyInstance = new Enemy(this.scene, x, y, selectedEnemy.enemy_type || 'basic', hitPoints);
      
      // Store enemy configuration
      enemyInstance.sprite.enemyConfig = selectedEnemy;
      enemyInstance.sprite.baseSpeed = speed;
      enemyInstance.sprite.damage = damage;
      
      // If enemy has custom image, load it
      if (selectedEnemy.image) {
        const imageUrl = `http://localhost:3001${selectedEnemy.image}`;
        const imageKey = `enemy_${selectedEnemy.enemy_id}`;
        
        if (!this.scene.textures.exists(imageKey)) {
          this.scene.load.image(imageKey, imageUrl);
          this.scene.load.once('complete', () => {
            if (enemyInstance.sprite && enemyInstance.sprite.active) {
              enemyInstance.sprite.setTexture(imageKey);
            }
          });
          this.scene.load.start();
        } else {
          enemyInstance.sprite.setTexture(imageKey);
        }
      }
      
      // Add the enemy sprite to the physics group
      this.scene.enemies.add(enemyInstance.sprite);
      
      // Set additional properties
      enemyInstance.sprite.lane = lane;
      
      // Scale based on enemy type/config
      const scale = selectedEnemy.scale_min || 0.08;
      enemyInstance.sprite.setScale(scale);
      enemyInstance.sprite.body.setSize(enemyInstance.sprite.width * 0.6, enemyInstance.sprite.height * 0.6);
      
      this.enemiesSpawned++;
    }
  }

  enemyKilled() {
    this.enemiesKilled++;
  }

  tryDropPowerup(position) {
    console.log('[WaveManager] tryDropPowerup called at position:', position, 'Pool size:', this.powerupPool?.length);
    
    // Check if we have powerup pool configured
    if (!this.powerupPool || this.powerupPool.length === 0) {
      console.warn('[WaveManager] No powerup pool configured!');
      return; // No powerups configured
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - this.waveStartTime;
    
    // Cooldown: Don't drop powerups more frequently than every 1 second
    const cooldownMs = 1000;
    const timeSinceLastDrop = currentTime - this.lastPowerupDropTime;
    if (timeSinceLastDrop < cooldownMs) {
      console.log('[WaveManager] Powerup on cooldown -', (cooldownMs - timeSinceLastDrop).toFixed(0), 'ms remaining');
      return;
    }
    
    // Filter powerups available at this time
    const availablePowerups = this.powerupPool.filter(p => 
      elapsedTime >= (p.min_spawn_time_ms || 0) &&
      (p.max_spawn_time_ms === null || p.max_spawn_time_ms === undefined || elapsedTime <= p.max_spawn_time_ms)
    );
    
    if (availablePowerups.length === 0) {
      return; // No powerups available at this time
    }
    
    // Try to drop a powerup based on drop chance
    // Global drop rate modifier (0.5 = half as likely, 2.0 = twice as likely)
    const globalDropModifier = 0.3; // 30% of configured drop rate for better balance
    
    for (const powerup of availablePowerups) {
      const roll = Math.random() * 100;
      const adjustedChance = (powerup.drop_chance || 0) * globalDropModifier;
      
      if (roll <= adjustedChance) {
        console.log('[WaveManager] 💎 Powerup drop! Roll:', roll.toFixed(1), 'Adjusted Chance:', adjustedChance.toFixed(1), 'Name:', powerup.powerup_name);
        this.lastPowerupDropTime = Date.now(); // Update cooldown timer
        this.spawnPowerup(powerup, position);
        return; // Only drop one powerup per enemy
      }
    }
    
    console.log('[WaveManager] No powerup dropped (roll failed)');
  }

  spawnPowerup(powerupConfig, position) {
    console.log('[WaveManager] ⭐⭐⭐ SPAWNING POWERUP ⭐⭐⭐');
    console.log('[WaveManager] Config:', powerupConfig.powerup_name, 'Type:', powerupConfig.powerup_type);
    console.log('[WaveManager] Position:', position.x, position.y);
    
    // Create Powerup entity
    const powerup = new Powerup(this.scene, position.x, position.y, powerupConfig);
    console.log('[WaveManager] Powerup entity created, has sprite:', !!powerup.sprite);
    
    // Add sprite to powerups group
    this.scene.powerups.add(powerup.sprite);
    console.log('[WaveManager] Added to powerups group, total count:', this.scene.powerups.getLength());
    
    // Setup physics AFTER adding to group
    powerup.setupPhysics();
    
    console.log('[WaveManager] ⭐ Powerup spawn complete:', powerupConfig.powerup_name, 'at', position.x, position.y);
  }
  getPowerupTint(rarity) {
    switch (rarity) {
      case 'legendary': return 0xffaa00; // Gold
      case 'epic': return 0xaa00ff; // Purple
      case 'rare': return 0x0088ff; // Blue
      case 'common': return 0x00ff00; // Green
      default: return 0xffffff; // White
    }
  }

  collectPowerup(powerup) {
    const config = powerup.powerupConfig;
    console.log('[WaveManager] 🎁 ========== POWERUP COLLECTED ==========');
    console.log('[WaveManager] Name:', config.powerup_name);
    console.log('[WaveManager] Type:', config.powerup_type, '(typeof:', typeof config.powerup_type + ')');
    console.log('[WaveManager] Effect:', config.effect);
    console.log('[WaveManager] Duration:', config.duration_ms, 'ms');
    
    // Apply powerup effect based on type BEFORE destroying
    if (config.effect) {
      try {
        const effect = typeof config.effect === 'string' ? JSON.parse(config.effect) : config.effect;
        console.log('[WaveManager] Parsed effect:', effect);
        this.applyPowerupEffect(effect, config.duration_ms, config.powerup_type, config.powerup_name);
      } catch (e) {
        console.error('[WaveManager] Failed to parse powerup effect:', e);
      }
    } else {
      // Even without effect JSON, still apply type-specific logic
      console.log('[WaveManager] No effect JSON, applying type-specific logic for:', config.powerup_type, config.powerup_name);
      this.applyPowerupEffect({}, config.duration_ms, config.powerup_type, config.powerup_name);
    }
    
    // Play pickup sound if available
    if (this.scene.soundManager) {
      this.scene.soundManager.playPowerupSound(config.powerup_key);
    }
    
    // Destroy the powerup sprite AFTER applying effect
    powerup.destroy();
    console.log('[WaveManager] ========== COLLECTION COMPLETE ==========');
  }

  applyPowerupEffect(effect, duration, powerupType, powerupName) {
    // Apply the effect to the player
    console.log('[WaveManager] ====== APPLYING POWERUP EFFECT ======');
    console.log('[WaveManager] Effect:', JSON.stringify(effect));
    console.log('[WaveManager] Duration:', duration, 'ms');
    console.log('[WaveManager] Type:', powerupType, '(type of:', typeof powerupType + ')');
    console.log('[WaveManager] Name:', powerupName);
    
    // Check player stats exist
    if (!this.scene.player || !this.scene.player.stats) {
      console.error('[WaveManager] Cannot apply effect - player or player.stats not found!');
      return;
    }
    
    console.log('[WaveManager] Player stats BEFORE:', JSON.stringify(this.scene.player.stats));
    
    // Check for multishot in multiple ways
    const typeStr = String(powerupType || '').toLowerCase();
    const nameStr = String(powerupName || '').toLowerCase();
    const isMultiShot = typeStr.includes('multi') || typeStr.includes('shot') || 
                        nameStr.includes('multi') || nameStr.includes('shot') ||
                        (effect && (effect.bullet_streams || effect.bulletStreams || effect.streams));
    
    console.log('[WaveManager] Is MultiShot?', isMultiShot, '(typeStr:', typeStr, 'nameStr:', nameStr + ')');
    
    // Special handling for Multi Shot powerup
    if (isMultiShot) {
      // Initialize damage multiplier if not exists
      if (!this.scene.player.stats.multishotDamageMultiplier) {
        this.scene.player.stats.multishotDamageMultiplier = 1;
      }
      
      const oldStreams = this.scene.player.stats.bulletStreams || 1;
      const oldMultiplier = this.scene.player.stats.multishotDamageMultiplier;
      
      // ALWAYS double the damage multiplier (no cap)
      const newMultiplier = oldMultiplier * 2;
      this.scene.player.stats.multishotDamageMultiplier = newMultiplier;
      
      // Cap visual streams at 4 to keep bullets in lanes
      const newStreams = Math.min(oldStreams * 2, 4);
      this.scene.player.stats.bulletStreams = newStreams;
      
      // Apply damage multiplier to base bullet damage
      const baseDamage = 3; // Original starting damage
      this.scene.player.stats.bulletDamage = Math.round(baseDamage * newMultiplier);
      
      console.log('[WaveManager] 🔫🔫🔫 Multi Shot collected!');
      console.log('[WaveManager]   Streams:', oldStreams, '→', newStreams, '(capped at 4)');
      console.log('[WaveManager]   Damage Multiplier:', oldMultiplier, '→', newMultiplier, 'x');
      console.log('[WaveManager]   Bullet Damage:', baseDamage * oldMultiplier, '→', this.scene.player.stats.bulletDamage);
      console.log('[WaveManager] Player stats AFTER:', JSON.stringify(this.scene.player.stats));
      
      // Visual feedback
      if (this.scene.add) {
        const { width, height } = this.scene.cameras.main;
        const streamText = newStreams < 4 ? `${newStreams} STREAMS` : 'MAX STREAMS';
        const text = this.scene.add.text(width / 2, height / 2, `MULTI SHOT x${newMultiplier}!\n${streamText}`, {
          fontSize: '32px',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }).setOrigin(0.5).setDepth(1000);
        
        this.scene.tweens.add({
          targets: text,
          y: text.y - 100,
          alpha: 0,
          duration: 2000,
          onComplete: () => text.destroy()
        });
      }
      return; // Multi Shot handled, don't process other effects
    }
    
    // Check for rapid fire (must check BEFORE multishot since both might contain "fire")
    const isRapidFire = typeStr.includes('rapid_fire') || typeStr === 'rapid fire' ||
                        nameStr.includes('rapid fire') || nameStr.includes('rapidfire') ||
                        powerupType === 'rapid_fire' || powerupType === 'Rapid Fire';
    
    console.log('[WaveManager] Is RapidFire?', isRapidFire, '(typeStr:', typeStr, 'nameStr:', nameStr + ')');
    
    // Special handling for Rapid Fire powerup - multiply fire rate by 1.5x
    if (isRapidFire) {
      // Initialize fire rate multiplier if not exists
      if (!this.scene.player.stats.rapidFireMultiplier) {
        this.scene.player.stats.rapidFireMultiplier = 1;
      }
      
      const oldFireRate = this.scene.player.stats.fireRate || 500;
      const oldMultiplier = this.scene.player.stats.rapidFireMultiplier;
      
      // Multiply fire rate speed by 1.5x (lower fireRate = faster shooting)
      const newMultiplier = oldMultiplier * 1.5;
      this.scene.player.stats.rapidFireMultiplier = newMultiplier;
      
      // Reduce fire rate (smaller number = faster)
      const baseFireRate = 500; // Original starting fire rate
      this.scene.player.stats.fireRate = Math.round(baseFireRate / newMultiplier);
      
      // Cap at minimum 50ms to prevent excessive shooting
      this.scene.player.stats.fireRate = Math.max(50, this.scene.player.stats.fireRate);
      
      console.log('[WaveManager] ⚡⚡⚡ Rapid Fire collected!');
      console.log('[WaveManager]   Fire Rate:', oldFireRate, '→', this.scene.player.stats.fireRate, 'ms');
      console.log('[WaveManager]   Speed Multiplier:', oldMultiplier, '→', newMultiplier, 'x');
      console.log('[WaveManager]   Shots per second:', (1000/oldFireRate).toFixed(1), '→', (1000/this.scene.player.stats.fireRate).toFixed(1));
      console.log('[WaveManager] Player stats AFTER:', JSON.stringify(this.scene.player.stats));
      
      // Visual feedback
      if (this.scene.add) {
        const { width, height } = this.scene.cameras.main;
        const shotsPerSec = (1000 / this.scene.player.stats.fireRate).toFixed(1);
        const text = this.scene.add.text(width / 2, height / 2, `RAPID FIRE x${newMultiplier.toFixed(1)}!\n${shotsPerSec} shots/sec`, {
          fontSize: '32px',
          color: '#ff6600',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }).setOrigin(0.5).setDepth(1000);
        
        this.scene.tweens.add({
          targets: text,
          y: text.y - 100,
          alpha: 0,
          duration: 2000,
          onComplete: () => text.destroy()
        });
      }
      return; // Rapid Fire handled, don't process other effects
    }
    
    // Other powerup effects:
    if (effect.speed_multiplier && this.scene.player) {
      const originalSpeed = this.scene.player.body.velocity.x;
      this.scene.player.setVelocityX(originalSpeed * effect.speed_multiplier);
      
      // Revert after duration
      this.scene.time.delayedCall(duration, () => {
        this.scene.player.setVelocityX(originalSpeed);
      });
    }
    
    if (effect.damage_multiplier && this.scene.player && this.scene.player.stats) {
      const oldDamage = this.scene.player.stats.bulletDamage || 10;
      this.scene.player.stats.bulletDamage = Math.round(oldDamage * effect.damage_multiplier);
      console.log('[WaveManager] Damage increased:', oldDamage, '→', this.scene.player.stats.bulletDamage);
    }
    
    if (effect.health && this.scene.player) {
      // Heal player (you'll need to implement health system)
      console.log('[WaveManager] Health effect not yet implemented');
    }
  }

  waveComplete() {
    this.waveActive = false;
    this.currentBoss = null; // Clear the purple boss reference
    
    // Stop wave sounds
    const waveId = `wave${this.currentWave}`;
    this.scene.soundManager.stopWaveSounds(waveId);
    
    // Purple boss defeated - show wave complete screen
    const waveName = this.currentWaveConfig ? this.currentWaveConfig.name : `Wave ${this.currentWave}`;
    console.log(`[WaveManager] 🟣 PURPLE BOSS DEFEATED! ${waveName} complete!`);
    console.log('[WaveManager] Showing wave completion screen...');
    
    // Stop physics and wave manager
    this.scene.physics.pause();
    this.scene.gameOver = true;
    console.log('[WaveManager] Physics paused, gameOver set to true');
    
    // Show wave completion message and prompt restart
    const { width, height } = this.scene.cameras.main;
    console.log('[WaveManager] Creating completion text at', width/2, height/2);
    const text = this.scene.add.text(width / 2, height / 2 - 40, `${waveName} COMPLETE!`, {
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
    
    // Stop all sounds
    this.scene.soundManager.stopAllMusic();
    
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

  spawnBoss(type = 'normal', customStats = null) {
    if (!this.waveActive || this.currentBoss) return; // Only one boss at a time
    
    this.bossCount++;
    
    // Different spawning patterns for different boss types
    let x, y = -50;
    // All bosses now spawn in random lanes
    const lanePositions = this.scene.lanePositions || [this.scene.cameras.main.width * 0.3, this.scene.cameras.main.width * 0.7];
    const lane = Math.floor(Math.random() * lanePositions.length);
    x = lanePositions[lane];
    
    let bossHealth, bossSpeed;
    
    // If custom stats provided from API, use those directly
    if (customStats) {
      bossHealth = customStats.health || 100;
      bossSpeed = customStats.speed || 60;
      console.log(`[WaveManager] Using API stats - Health: ${bossHealth}, Speed: ${bossSpeed}, Type: ${type}`);
    } else {
      // Otherwise use hardcoded calculation logic
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
      
      // Apply wave-based health cap only for hardcoded bosses
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
    }
    
    // Extract custom image path if provided in customStats
    const imagePath = customStats?.image || null;
    
    const boss = new Boss(this.scene, x, y, bossHealth, bossSpeed, type, imagePath);
    this.scene.enemies.add(boss.sprite);
    
    // CRITICAL: Ensure physics body is properly configured after adding to group
    if (boss.sprite.body) {
      boss.sprite.body.enable = true;
      boss.sprite.body.setAllowGravity(false);
      console.log('[WaveManager] Boss body after group add - enabled:', boss.sprite.body.enable, 'size:', boss.sprite.body.width, 'x', boss.sprite.body.height);
    } else {
      console.error('[WaveManager] CRITICAL: Boss has no physics body after adding to group!');
      // Try to add physics manually
      this.scene.physics.add.existing(boss.sprite);
      if (boss.sprite.body) {
        boss.sprite.body.enable = true;
        boss.sprite.body.setAllowGravity(false);
        console.log('[WaveManager] Manually added physics body to boss');
      }
    }
    
    // Set boss reference on the sprite for collision detection
    boss.sprite.bossRef = boss;
    boss.sprite.isBoss = true;
    boss.sprite.bossType = type;
    boss.sprite.isMainBoss = customStats?.isMainBoss || false; // Mark if this is the wave's main boss
    
    // Track current boss
    this.currentBoss = boss.sprite;
    
    // Set initial velocity for boss using its current speed
    boss.sprite.setVelocityY(boss.currentSpeed);
    console.log('[WaveManager] Boss initial velocity set to:', boss.currentSpeed, 'actual velocity:', boss.sprite.body.velocity.y);
    
    // Play boss spawn sound
    const bossIdMap = {
      'normal': 'normalRed',
      'fast': 'normalRed',
      'tank': 'pinkSpecial',
      'boss': 'purpleLaneSwitcher',
      'flying': 'normalRed',
      'ranged': 'normalRed'
    };
    const bossId = bossIdMap[type] || 'normalRed';
    this.scene.soundManager.playBossSound(bossId, 'spawn');
    // Start boss alive sound loop
    this.scene.soundManager.playBossSound(bossId, 'alive');
    
    console.log('[WaveManager]', type, 'boss spawned with', bossHealth, 'HP (spawn #', this.bossCount, ') at x:', x, 'initial speed:', boss.currentSpeed);
    
    console.log('[WaveManager] Boss type:', type, '- Texture key:', boss.sprite.texture.key, '- Color should be:', type === 'pink' ? 'hot pink' : 'red');
  }

  spawnBossFromTemplate(bossId) {
    // Map template boss IDs to internal types and call the original spawnBoss method
    const bossTypeMap = {
      'normalRed': 'normal',
      'pinkSpecial': 'pink', 
      'purpleLaneSwitcher': 'purple',
      'goldenTank': 'golden'
    };
    
    const internalType = bossTypeMap[bossId] || 'normal';
    console.log(`[WaveManager] Spawning template boss ${bossId} as internal type ${internalType}`);
    
    this.spawnBoss(internalType);
  }

  spawnBossFromAPI(bossConfig) {
    // Spawn boss using configuration from API
    console.log('[WaveManager] Spawning boss from API config:', bossConfig);
    
    // Use the boss type directly from database
    const bossType = bossConfig.type || 'normal';
    console.log(`[WaveManager] API boss "${bossConfig.boss_name}" type: ${bossType}, is main: ${bossConfig.is_main_boss}`);
    
    // Use calculated stats from API (base_stat * multiplier) - parse as numbers
    const customStats = {
      health: parseFloat(bossConfig.calculated_health || bossConfig.base_health),
      speed: parseFloat(bossConfig.calculated_speed || bossConfig.base_speed),
      damage: parseFloat(bossConfig.calculated_damage || bossConfig.base_damage),
      image: bossConfig.image, // Pass custom image path
      isMainBoss: bossConfig.is_main_boss || false // Track if this is the wave's main boss
    };
    
    console.log(`[WaveManager] API boss stats - Health: ${customStats.health}, Speed: ${customStats.speed}, Damage: ${customStats.damage}, Image: ${customStats.image}, Main Boss: ${customStats.isMainBoss}`);
    
    // Spawn using existing method with custom stats
    this.spawnBoss(bossType, customStats);
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
    if (this.currentBoss) {
      // Check if this was the main boss for the current wave
      const isMainBoss = this.currentBoss.bossConfig && this.currentBoss.bossConfig.is_main_boss;
      
      if (isMainBoss) {
        console.log(`[WaveManager] 🟣 MAIN BOSS (${this.currentBoss.bossConfig.boss_name}) DEFEATED! Calling waveComplete()`);
        this.waveComplete();
        return; // Don't set currentBoss to null yet, waveComplete() will handle it
      }
      
      console.log(`[WaveManager] Mini-boss defeated, continuing wave...`);
    }
    
    this.currentBoss = null;
  }

  isMainBoss(bossType) {
    // Check if the current boss has a bossConfig with is_main_boss flag
    if (this.currentBoss && this.currentBoss.bossConfig) {
      return this.currentBoss.bossConfig.is_main_boss === true;
    }
    
    // Fallback: purple boss is always main boss in hardcoded mode
    return bossType === 'purple';
  }
}
