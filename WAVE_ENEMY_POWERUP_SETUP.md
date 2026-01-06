# Wave Enemy & Powerup Configuration System

## Overview
Enhanced wave configuration system that allows per-wave customization of enemies and powerups through the admin panel.

## Database Schema

### New Tables

#### wave_enemy_pool
Configures which enemies can spawn in each wave:
- `wave_id` - Reference to waves table
- `enemy_id` - Reference to enemies table
- `spawn_weight` - Probability weight (higher = more likely to spawn)
- `min_spawn_time_ms` - Earliest this enemy can spawn
- `max_spawn_time_ms` - Latest this enemy can spawn (NULL = until wave ends)
- `health_multiplier` - Multiply base health (e.g., 1.5 = 50% more health)
- `speed_multiplier` - Multiply base speed
- `damage_multiplier` - Multiply base damage
- `is_active` - Enable/disable this enemy for the wave

#### wave_powerup_pool
Configures which powerups can drop in each wave:
- `wave_id` - Reference to waves table
- `powerup_id` - Reference to powerups table
- `drop_chance` - Percentage chance to drop (0-100)
- `min_spawn_time_ms` - Earliest this powerup can drop
- `max_spawn_time_ms` - Latest this powerup can drop (NULL = until wave ends)
- `is_active` - Enable/disable this powerup for the wave

## API Endpoints

### Enemies
- `GET /api/enemies` - Get all active enemies
- `GET /api/enemies/:id` - Get enemy by ID
- `POST /api/enemies` - Create new enemy (admin)
- `PUT /api/enemies/:id` - Update enemy (admin)
- `DELETE /api/enemies/:id` - Delete enemy (admin)

### Powerups
- `GET /api/powerups` - Get all active powerups
- `GET /api/powerups/:id` - Get powerup by ID
- `POST /api/powerups` - Create new powerup (admin)
- `PUT /api/powerups/:id` - Update powerup (admin)
- `DELETE /api/powerups/:id` - Delete powerup (admin)

### Wave Enemy/Powerup Pool
- `GET /api/waves/:waveNumber/enemies` - Get enemy pool for wave
- `POST /api/waves/:waveNumber/enemies` - Update enemy pool (admin)
- `GET /api/waves/:waveNumber/powerups` - Get powerup pool for wave
- `POST /api/waves/:waveNumber/powerups` - Update powerup pool (admin)

## Admin Panel Features

### New Pages

#### Enemies Management (`/enemies`)
- View all enemies with images and stats
- Create/edit enemies with image upload
- Configure: health, speed, damage, type, point value, currency drop
- Enemy types: Standard, Fast, Tank, Flying

#### Powerups Management (`/powerups`)
- View all powerups with images and rarity
- Create/edit powerups with image upload
- Configure: type, effect, duration, rarity
- Rarities: Common, Rare, Epic, Legendary
- Types: Weapon Upgrade, Health Boost, Speed Boost, Shield, Multi Shot, Rapid Fire, Extra Life

### Wave Editor Enhancement (TODO)
The Wave Editor will be enhanced to include:
1. **Enemy Pool Tab** - Select which enemies spawn in this wave
   - Add/remove enemies from pool
   - Set spawn weights (probability)
   - Set time windows (e.g., tough enemies only after 30s)
   - Adjust multipliers per wave (make enemies harder/easier)

2. **Powerup Pool Tab** - Select which powerups can drop
   - Add/remove powerups from pool
   - Set drop chances (%)
   - Set time windows for availability

## Usage Example

### Creating an Enemy
1. Navigate to **Enemies** page
2. Click **Add Enemy**
3. Fill in details:
   - Enemy Key: `enemy_basic_fighter`
   - Name: `Basic Fighter`
   - Type: `Standard`
   - Base Health: `100`
   - Base Speed: `150`
   - Base Damage: `5`
   - Upload image
4. Click **Create**

### Creating a Powerup
1. Navigate to **Powerups** page
2. Click **Add Powerup**
3. Fill in details:
   - Powerup Key: `powerup_shield`
   - Name: `Energy Shield`
   - Type: `Shield`
   - Rarity: `Rare`
   - Duration: `10000` (10 seconds)
   - Upload image
4. Click **Create**

### Configuring Wave Enemy Pool (API)
```javascript
POST /api/waves/1/enemies
{
  "enemyPool": [
    {
      "enemy_id": 1,
      "spawn_weight": 100,      // Common spawn
      "min_spawn_time_ms": 0,    // From start
      "max_spawn_time_ms": 30000, // Until 30 seconds
      "health_multiplier": 1.0,
      "speed_multiplier": 1.0,
      "damage_multiplier": 1.0
    },
    {
      "enemy_id": 2,
      "spawn_weight": 50,         // Less common
      "min_spawn_time_ms": 15000, // After 15 seconds
      "max_spawn_time_ms": null,  // Until wave ends
      "health_multiplier": 1.5,   // 50% more health
      "speed_multiplier": 1.2,    // 20% faster
      "damage_multiplier": 1.3    // 30% more damage
    }
  ]
}
```

### Configuring Wave Powerup Pool (API)
```javascript
POST /api/waves/1/powerups
{
  "powerupPool": [
    {
      "powerup_id": 1,
      "drop_chance": 10.0,        // 10% drop chance
      "min_spawn_time_ms": 0,
      "max_spawn_time_ms": null
    },
    {
      "powerup_id": 2,
      "drop_chance": 5.0,         // 5% drop chance (rarer)
      "min_spawn_time_ms": 30000, // Only after 30 seconds
      "max_spawn_time_ms": null
    }
  ]
}
```

## Integration with Game

### WaveManager Changes Needed
The `WaveManager.js` will need to be updated to:

1. **Load Enemy Pool** from API when wave starts
2. **Use Weighted Spawning** based on spawn_weight
3. **Check Time Windows** before spawning enemies
4. **Apply Multipliers** when creating enemy instances
5. **Load Powerup Pool** from API
6. **Use Drop Chances** when enemies are defeated
7. **Check Powerup Time Windows** before dropping

### Example Integration (Pseudocode)
```javascript
// In WaveManager.startWave()
const enemyPool = await api.get(`/waves/${waveNumber}/enemies`);
const powerupPool = await api.get(`/waves/${waveNumber}/powerups`);

// When spawning enemy
spawnEnemy() {
  const elapsedTime = Date.now() - this.waveStartTime;
  
  // Filter enemies available at this time
  const availableEnemies = this.enemyPool.filter(e => 
    elapsedTime >= e.min_spawn_time_ms &&
    (e.max_spawn_time_ms === null || elapsedTime <= e.max_spawn_time_ms)
  );
  
  // Weighted random selection
  const selectedEnemy = this.weightedRandom(availableEnemies, 'spawn_weight');
  
  // Create enemy with multipliers
  const enemy = new Enemy({
    ...selectedEnemy,
    health: selectedEnemy.base_health * selectedEnemy.health_multiplier,
    speed: selectedEnemy.base_speed * selectedEnemy.speed_multiplier,
    damage: selectedEnemy.base_damage * selectedEnemy.damage_multiplier
  });
}

// When enemy defeated
onEnemyDefeated(enemy) {
  const availablePowerups = this.powerupPool.filter(p => {
    const elapsed = Date.now() - this.waveStartTime;
    return elapsed >= p.min_spawn_time_ms &&
           (p.max_spawn_time_ms === null || elapsed <= p.max_spawn_time_ms);
  });
  
  // Check each powerup's drop chance
  availablePowerups.forEach(powerup => {
    if (Math.random() * 100 < powerup.drop_chance) {
      this.spawnPowerup(powerup, enemy.x, enemy.y);
    }
  });
}
```

## Files Created/Modified

### Backend
- ✅ `backend/src/routes/powerups.js` - New powerup CRUD API
- ✅ `backend/src/routes/enemies.js` - Enhanced with CRUD operations
- ✅ `backend/src/routes/waves.js` - Added enemy/powerup pool endpoints
- ✅ `backend/server.js` - Added powerups route

### Admin Portal
- ✅ `admin-portal/src/pages/Enemies.jsx` - New enemy management page
- ✅ `admin-portal/src/pages/Powerups.jsx` - New powerup management page
- ✅ `admin-portal/src/services/api.js` - Added enemiesService and powerupsService
- ✅ `admin-portal/src/App.jsx` - Added routes for Enemies and Powerups
- ✅ `admin-portal/src/components/Layout.jsx` - Added navigation menu items

### Database
- ✅ Created `wave_enemy_pool` table
- ✅ Created `wave_powerup_pool` table
- ✅ Added indexes for performance

## Next Steps (TODO)

1. **Enhance Wave Editor UI**
   - Add "Enemy Pool" section with drag-and-drop interface
   - Add "Powerup Pool" section with drop chance sliders
   - Visual timeline showing when enemies/powerups are available

2. **Update WaveManager.js**
   - Load enemy and powerup pools from API
   - Implement weighted enemy spawning
   - Implement powerup drop system with time windows

3. **Add Upload Endpoints**
   - `/api/upload/enemy-image` for enemy images
   - `/api/upload/powerup-image` for powerup images

4. **Testing**
   - Create sample enemies and powerups
   - Configure wave 1 with enemy/powerup pools
   - Test in-game spawning and difficulty curves

5. **Visual Feedback**
   - Show enemy type icons in game
   - Show powerup rarity with colored borders
   - Display multiplier effects (e.g., "Hardened: 1.5x HP")

## Benefits

- **Flexible Wave Design** - Each wave can have unique enemy compositions
- **Progressive Difficulty** - Use time windows to introduce harder enemies gradually
- **Balanced Rewards** - Control powerup availability per wave
- **Replayability** - Different enemy/powerup combinations create variety
- **Easy Testing** - Quickly adjust wave difficulty without code changes
- **Data-Driven** - All configuration in database, no hardcoded values
