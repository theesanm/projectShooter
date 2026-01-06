# Wave Enemy & Powerup System Integration

## Overview
The wave system now fully integrates with the database configuration for enemies and powerups. All hardcoded defaults have been removed and replaced with database-driven spawning logic.

## What Changed

### 1. **WaveManager.js - Enemy Spawning Integration**

#### Removed Hardcoded Logic:
- ❌ Hardcoded 'basic' enemy type
- ❌ Progressive difficulty based on elapsed time (1-4 hits)
- ❌ Fixed enemy stats

#### Added Database Integration:
- ✅ Loads `wave_enemy_pool` from API on wave start
- ✅ **Weighted random selection** based on `spawn_weight`
- ✅ **Time window filtering** using `min_spawn_time_ms` and `max_spawn_time_ms`
- ✅ **Stat multipliers** applied to health, speed, and damage
- ✅ **Custom enemy images** loaded from database
- ✅ Enemy types from configuration (standard/fast/tank/flying)

#### Key Methods:
```javascript
async loadTemplates() {
  // Load enemy pool for this wave
  const enemyPoolResponse = await fetch(`http://localhost:3001/api/waves/${this.currentWave}/enemies`);
  this.enemyPool = await enemyPoolResponse.json();
  
  // Load powerup pool for this wave
  const powerupPoolResponse = await fetch(`http://localhost:3001/api/waves/${this.currentWave}/powerups`);
  this.powerupPool = await powerupPoolResponse.json();
}

spawnEnemy() {
  // Filter by time window
  const availableEnemies = this.enemyPool.filter(e => 
    elapsedTime >= (e.min_spawn_time_ms || 0) &&
    elapsedTime <= (e.max_spawn_time_ms || Infinity)
  );
  
  // Weighted random selection
  const totalWeight = availableEnemies.reduce((sum, e) => sum + e.spawn_weight, 0);
  let random = Math.random() * totalWeight;
  // ... select enemy based on weights
  
  // Apply multipliers
  const health = selectedEnemy.base_health * selectedEnemy.health_multiplier;
  const speed = selectedEnemy.base_speed * selectedEnemy.speed_multiplier;
  const damage = selectedEnemy.base_damage * selectedEnemy.damage_multiplier;
}
```

### 2. **Powerup Drop System**

#### New Features:
- ✅ Powerups drop when enemies are defeated
- ✅ **Drop chance percentage** determines spawn probability
- ✅ **Time window filtering** restricts powerup availability
- ✅ **Custom powerup images** from database
- ✅ **Rarity-based tinting** (common=green, rare=blue, epic=purple, legendary=gold)
- ✅ **Floating animation** for visual appeal
- ✅ **Player collision** for automatic pickup

#### Key Methods:
```javascript
tryDropPowerup(position) {
  // Filter by time window
  const availablePowerups = this.powerupPool.filter(p => 
    elapsedTime >= (p.min_spawn_time_ms || 0) &&
    elapsedTime <= (p.max_spawn_time_ms || Infinity)
  );
  
  // Roll for each powerup based on drop_chance
  for (const powerup of availablePowerups) {
    const roll = Math.random() * 100;
    if (roll <= powerup.drop_chance) {
      this.spawnPowerup(powerup, position);
      return; // Only drop one powerup per enemy
    }
  }
}

spawnPowerup(powerupConfig, position) {
  // Create sprite at enemy death position
  const powerup = this.scene.physics.add.sprite(position.x, position.y, textureKey);
  
  // Load custom image if configured
  if (powerupConfig.image) {
    this.scene.load.image(`powerup_${powerupConfig.powerup_id}`, imageUrl);
  }
  
  // Apply rarity tint and floating animation
  powerup.setTint(this.getPowerupTint(powerupConfig.rarity));
  
  // Add player collision for pickup
  this.scene.physics.add.overlap(this.scene.player, powerup, () => {
    this.collectPowerup(powerup);
  });
}
```

### 3. **GameScene.js - Enemy Defeat Integration**

Added powerup drop triggers when enemies are defeated:

```javascript
// Multi-hit enemy defeated
if (isDestroyed) {
  const dropPosition = { x: enemy.x, y: enemy.y };
  this.waveManager.tryDropPowerup(dropPosition);
  // ... destroy enemy
}

// Single-hit enemy defeated
const dropPosition = { x: enemy.x, y: enemy.y };
this.waveManager.tryDropPowerup(dropPosition);
// ... destroy enemy
```

## Configuration Flow

### Admin Portal → Database → Game

1. **Admin configures enemies** in Enemies page:
   - enemy_key, name, type, base_health, base_speed, base_damage
   - point_value, currency_drop, scale, color, image
   - Uploads custom enemy image

2. **Admin configures powerups** in Powerups page:
   - powerup_key, name, type, effect (JSON)
   - duration_ms, rarity, image
   - Uploads custom powerup image

3. **Admin configures wave pools** in Wave Editor:
   - **Enemy Pool**: Selects enemies, sets spawn_weight, time windows, multipliers
   - **Powerup Pool**: Selects powerups, sets drop_chance%, time windows

4. **Backend API** provides wave configuration:
   - `GET /api/waves/:waveNumber/enemies` returns enemy pool
   - `GET /api/waves/:waveNumber/powerups` returns powerup pool

5. **WaveManager loads** on wave start:
   - Fetches enemy pool and powerup pool from API
   - Stores in `this.enemyPool` and `this.powerupPool`

6. **Game spawns enemies**:
   - Filters by time window
   - Selects using weighted random
   - Applies multipliers
   - Uses custom images

7. **Powerups drop**:
   - When enemy defeated
   - Rolls drop_chance for each available powerup
   - Spawns at enemy death position

## Example Configurations

### Enemy Pool Example
```json
[
  {
    "enemy_id": 1,
    "enemy_name": "Basic Zombie",
    "enemy_type": "standard",
    "base_health": 100,
    "base_speed": 150,
    "base_damage": 5,
    "spawn_weight": 100,
    "min_spawn_time_ms": 0,
    "max_spawn_time_ms": 30000,
    "health_multiplier": 1.0,
    "speed_multiplier": 1.0,
    "damage_multiplier": 1.0,
    "image": "/assets/enemies/zombie.png"
  },
  {
    "enemy_id": 2,
    "enemy_name": "Tough Zombie",
    "enemy_type": "tank",
    "base_health": 300,
    "base_speed": 100,
    "base_damage": 10,
    "spawn_weight": 50,
    "min_spawn_time_ms": 30000,
    "max_spawn_time_ms": null,
    "health_multiplier": 2.0,
    "speed_multiplier": 0.8,
    "damage_multiplier": 1.5,
    "image": "/assets/enemies/tough_zombie.png"
  }
]
```

### Powerup Pool Example
```json
[
  {
    "powerup_id": 1,
    "powerup_name": "Health Pack",
    "powerup_type": "health",
    "rarity": "common",
    "drop_chance": 15.0,
    "min_spawn_time_ms": 0,
    "max_spawn_time_ms": null,
    "effect": {
      "health": 50
    },
    "duration_ms": 0,
    "image": "/assets/powerups/health_pack.png"
  },
  {
    "powerup_id": 2,
    "powerup_name": "Speed Boost",
    "powerup_type": "speed",
    "rarity": "rare",
    "drop_chance": 5.0,
    "min_spawn_time_ms": 20000,
    "max_spawn_time_ms": null,
    "effect": {
      "speed_multiplier": 1.5
    },
    "duration_ms": 10000,
    "image": "/assets/powerups/speed_boost.png"
  }
]
```

## Weighted Random Selection

Spawn weight determines probability:
- Enemy A: spawn_weight = 100
- Enemy B: spawn_weight = 50
- Enemy C: spawn_weight = 25

**Total weight = 175**
- Enemy A: 100/175 = 57% chance
- Enemy B: 50/175 = 29% chance
- Enemy C: 25/175 = 14% chance

## Time Windows

Example time progression:
- **0-15 seconds**: Only basic enemies (min=0, max=15000)
- **15-30 seconds**: Basic + medium enemies (min=15000, max=30000)
- **30+ seconds**: All enemies including tough ones (min=30000, max=null)

## Stat Multipliers

Base stats * multiplier = actual stats:
- base_health=100, health_multiplier=1.5 → 150 HP
- base_speed=150, speed_multiplier=0.8 → 120 speed
- base_damage=5, damage_multiplier=2.0 → 10 damage

## Benefits

### Before (Hardcoded):
- ❌ All enemies were 'basic' type
- ❌ Difficulty increased by time only (1-4 hits)
- ❌ No variety in enemy types
- ❌ No powerups from enemies
- ❌ Required code changes to adjust difficulty

### After (Database-Driven):
- ✅ Multiple enemy types per wave
- ✅ Configurable spawn probabilities
- ✅ Time-gated enemy spawns
- ✅ Stat multipliers for fine-tuning
- ✅ Custom enemy images
- ✅ Powerup drops with drop chances
- ✅ Rarity-based powerup tinting
- ✅ All configuration through admin panel
- ✅ No code changes needed

## Testing

1. **Configure enemies** in admin panel
2. **Configure powerups** in admin panel
3. **Set wave pools** in Wave Editor
4. **Start wave** - enemies spawn from pool
5. **Defeat enemies** - powerups drop based on chance
6. **Collect powerups** - effects applied

## Future Enhancements

- [ ] Visual feedback for stat multipliers (health bars)
- [ ] Enemy ability system (flying, teleporting, etc.)
- [ ] Powerup visual effects (particles, trails)
- [ ] Powerup stacking logic
- [ ] Enemy formations and spawn patterns
- [ ] Mini-boss support in enemy pool
- [ ] Currency drops from enemies
- [ ] Powerup duration UI (timer)

## Migration Notes

**No migration needed!** The system gracefully handles:
- Empty enemy pools → No enemies spawn (logs warning)
- Empty powerup pools → No powerups drop
- Missing images → Uses default textures
- Null time windows → Available at all times

## API Endpoints Used

- `GET /api/waves/:waveNumber/enemies` - Get enemy pool
- `GET /api/waves/:waveNumber/powerups` - Get powerup pool
- Images served from: `http://localhost:3001/assets/enemies/...`
- Images served from: `http://localhost:3001/assets/powerups/...`
