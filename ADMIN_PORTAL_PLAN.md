# Admin Portal & Database Implementation Plan

## Overview
This document outlines the plan to create a PostgreSQL database and web-based admin portal for managing game balancing, waves, bosses, enemies, and user data.

---

## Phase 1: Database Setup (PostgreSQL)

### 1.1 Prerequisites
- [ ] Install PostgreSQL (v14 or higher)
- [ ] Install pgAdmin 4 or DBeaver for database management
- [ ] Install Node.js (v18+) for backend

### 1.2 Database Schema Design

#### Core Tables

**users**
```sql
- id (UUID, PRIMARY KEY)
- username (VARCHAR(50), UNIQUE)
- email (VARCHAR(100), UNIQUE)
- password_hash (VARCHAR(255))
- role (ENUM: 'player', 'admin', 'super_admin')
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
```

**player_stats**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- total_score (INTEGER)
- highest_wave (INTEGER)
- total_kills (INTEGER)
- total_deaths (INTEGER)
- play_time_seconds (INTEGER)
- currency (INTEGER DEFAULT 0)        # In-game currency for purchases
- premium_currency (INTEGER DEFAULT 0) # Premium currency (optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**waves**
```sql
- id (SERIAL, PRIMARY KEY)
- wave_number (INTEGER, UNIQUE)
- name (VARCHAR(100))
- description (TEXT)
- scene_id (VARCHAR(50))
- duration_ms (INTEGER)
- enemy_spawn_rate_ms (INTEGER)
- max_enemies (INTEGER)
- is_active (BOOLEAN)
- created_by (UUID, FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**bosses**
```sql
- id (SERIAL, PRIMARY KEY)
- boss_key (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- description (TEXT)
- type (VARCHAR(50))
- base_health (INTEGER)
- base_speed (INTEGER)
- scale_min (DECIMAL(3,2))
- scale_max (DECIMAL(3,2))
- color (VARCHAR(8))
- image (VARCHAR(255))
- defeat_reward (INTEGER)
- currency_drop (INTEGER DEFAULT 0)    # Currency dropped on defeat
- abilities (JSONB)
- sounds (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**wave_boss_sequence**
```sql
- id (SERIAL, PRIMARY KEY)
- wave_id (INTEGER, FOREIGN KEY → waves.id)
- boss_id (INTEGER, FOREIGN KEY → bosses.id)
- spawn_time_ms (INTEGER)
- is_main_boss (BOOLEAN)
- sequence_order (INTEGER)
- created_at (TIMESTAMP)
```

**enemies**
```sql
- id (SERIAL, PRIMARY KEY)
- enemy_key (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- type (VARCHAR(50))
- base_health (INTEGER)
- base_speed (INTEGER)
- base_damage (INTEGER)
- point_value (INTEGER)
- currency_drop (INTEGER DEFAULT 0)    # Currency dropped on kill
- scale_min (DECIMAL(3,2))
- scale_max (DECIMAL(3,2))
- color (VARCHAR(8))
- image (VARCHAR(255))
- abilities (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**weapons**
```sql
- id (SERIAL, PRIMARY KEY)
- weapon_key (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- description (TEXT)
- tier (INTEGER)                       # 1, 2, 3, etc. for progression
- damage (INTEGER)
- fire_rate (INTEGER)                  # Shots per second
- projectile_speed (INTEGER)
- projectile_size (DECIMAL(3,2))
- pierce_count (INTEGER DEFAULT 1)     # How many enemies it pierces
- spread_angle (INTEGER DEFAULT 0)     # For multi-shot weapons
- projectile_count (INTEGER DEFAULT 1) # Bullets per shot
- reload_time (INTEGER DEFAULT 0)
- ammo_capacity (INTEGER)
- special_effects (JSONB)              # Explosions, chains, etc.
- image (VARCHAR(255))
- projectile_image (VARCHAR(255))
- sound (VARCHAR(255))
- unlock_requirement (JSONB)           # Wave, kills, or achievement
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**player_skins**
```sql
- id (SERIAL, PRIMARY KEY)
- skin_key (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- description (TEXT)
- rarity (ENUM: 'common', 'rare', 'epic', 'legendary', 'mythic')
- image (VARCHAR(255))
- animated (BOOLEAN DEFAULT FALSE)
- special_effects (JSONB)              # Trails, auras, etc.
- unlock_requirement (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**shop_items**
```sql
- id (SERIAL, PRIMARY KEY)
- item_type (ENUM: 'weapon', 'skin', 'powerup', 'upgrade')
- item_id (INTEGER)                    # References weapons, skins, etc.
- price_currency (INTEGER)
- price_premium (INTEGER DEFAULT 0)
- discount_percent (INTEGER DEFAULT 0)
- is_featured (BOOLEAN DEFAULT FALSE)
- is_limited (BOOLEAN DEFAULT FALSE)
- available_from (TIMESTAMP)
- available_until (TIMESTAMP)
- purchase_limit (INTEGER)             # Max purchases per player
- display_order (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**player_inventory**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- item_type (ENUM: 'weapon', 'skin', 'powerup', 'upgrade')
- item_id (INTEGER)
- quantity (INTEGER DEFAULT 1)
- is_equipped (BOOLEAN DEFAULT FALSE)
- acquired_at (TIMESTAMP)
- UNIQUE(user_id, item_type, item_id)
```

**player_loadout**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- loadout_slot (INTEGER DEFAULT 1)     # Support multiple loadouts
- equipped_weapon_id (INTEGER, FOREIGN KEY → weapons.id)
- equipped_skin_id (INTEGER, FOREIGN KEY → player_skins.id)
- equipped_powerups (JSONB)            # Array of powerup IDs
- is_active (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, loadout_slot)
```

**purchase_history**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- shop_item_id (INTEGER, FOREIGN KEY → shop_items.id)
- item_type (ENUM: 'weapon', 'skin', 'powerup', 'upgrade')
- item_id (INTEGER)
- price_paid_currency (INTEGER)
- price_paid_premium (INTEGER)
- purchased_at (TIMESTAMP)
```

**weapon_upgrades**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- weapon_id (INTEGER, FOREIGN KEY → weapons.id)
- upgrade_level (INTEGER DEFAULT 1)
- damage_bonus (INTEGER DEFAULT 0)
- fire_rate_bonus (INTEGER DEFAULT 0)
- ammo_bonus (INTEGER DEFAULT 0)
- special_bonus (JSONB)                # Custom upgrades
- total_spent (INTEGER)                # Total currency spent on this weapon
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, weapon_id)
```

**powerups**
```sql
- id (SERIAL, PRIMARY KEY)
- powerup_key (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- type (VARCHAR(50))
- effect (JSONB)
- duration_ms (INTEGER)
- rarity (ENUM: 'common', 'rare', 'epic', 'legendary')
- image (VARCHAR(255))
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**wave_settings**
```sql
- id (SERIAL, PRIMARY KEY)
- wave_id (INTEGER, FOREIGN KEY → waves.id)
- powerup_spawn_interval_ms (INTEGER)
- allowed_powerup_types (JSONB)
- difficulty_multiplier (DECIMAL(3,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**game_sessions**
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- wave_reached (INTEGER)
- final_score (INTEGER)
- total_kills (INTEGER)
- session_duration_seconds (INTEGER)
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
```

**leaderboard**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- score (INTEGER)
- wave_reached (INTEGER)
- achieved_at (TIMESTAMP)
- INDEX on (score DESC, achieved_at DESC)
```

**audit_log**
```sql
- id (SERIAL, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id)
- action (VARCHAR(100))
- entity_type (VARCHAR(50))
- entity_id (INTEGER)
- changes (JSONB)
- created_at (TIMESTAMP)
```

### 1.3 Template System

Following the existing pattern from `config/bosses/bossTemplates.json` and `config/enemies/enemyTemplates.json`, create:

**config/weapons/weaponTemplates.json**
```json
{
  "weapons": {
    "basicPistol": {
      "name": "Basic Pistol",
      "description": "Standard starting weapon",
      "tier": 1,
      "damage": 10,
      "fireRate": 300,
      "projectileSpeed": 400,
      "projectileSize": 1.0,
      "pierceCount": 1,
      "spreadAngle": 0,
      "projectileCount": 1,
      "reloadTime": 0,
      "ammoCapacity": 999,
      "specialEffects": {},
      "image": "weapon_pistol.png",
      "projectileImage": "bullet_basic.png",
      "sound": "pistol_fire.mp3",
      "unlockRequirement": { "type": "default", "value": 0 },
      "shopPrice": 0
    },
    "shotgun": {
      "name": "Shotgun",
      "description": "Close range powerhouse",
      "tier": 2,
      "damage": 8,
      "fireRate": 800,
      "projectileSpeed": 350,
      "projectileSize": 1.2,
      "pierceCount": 1,
      "spreadAngle": 25,
      "projectileCount": 5,
      "reloadTime": 1000,
      "ammoCapacity": 24,
      "specialEffects": { "knockback": 1.5 },
      "image": "weapon_shotgun.png",
      "projectileImage": "bullet_shotgun.png",
      "sound": "shotgun_fire.mp3",
      "unlockRequirement": { "type": "wave", "value": 2 },
      "shopPrice": 500
    },
    "assaultRifle": {
      "name": "Assault Rifle",
      "description": "High fire rate automatic weapon",
      "tier": 3,
      "damage": 15,
      "fireRate": 150,
      "projectileSpeed": 500,
      "projectileSize": 1.0,
      "pierceCount": 2,
      "spreadAngle": 5,
      "projectileCount": 1,
      "reloadTime": 1500,
      "ammoCapacity": 30,
      "specialEffects": {},
      "image": "weapon_rifle.png",
      "projectileImage": "bullet_rifle.png",
      "sound": "rifle_fire.mp3",
      "unlockRequirement": { "type": "wave", "value": 5 },
      "shopPrice": 1500
    },
    "sniper": {
      "name": "Sniper Rifle",
      "description": "High damage, precision weapon",
      "tier": 4,
      "damage": 100,
      "fireRate": 1200,
      "projectileSpeed": 800,
      "projectileSize": 1.5,
      "pierceCount": 5,
      "spreadAngle": 0,
      "projectileCount": 1,
      "reloadTime": 2000,
      "ammoCapacity": 10,
      "specialEffects": { "criticalChance": 0.3 },
      "image": "weapon_sniper.png",
      "projectileImage": "bullet_sniper.png",
      "sound": "sniper_fire.mp3",
      "unlockRequirement": { "type": "kills", "value": 1000 },
      "shopPrice": 3000
    }
  }
}
```

**config/skins/skinTemplates.json**
```json
{
  "skins": {
    "defaultHero": {
      "name": "Default Hero",
      "description": "Standard hero appearance",
      "rarity": "common",
      "image": "player_default.png",
      "animated": false,
      "specialEffects": {},
      "unlockRequirement": { "type": "default", "value": 0 },
      "shopPrice": 0
    },
    "eliteWarrior": {
      "name": "Elite Warrior",
      "description": "Battle-hardened veteran skin",
      "rarity": "rare",
      "image": "player_elite.png",
      "animated": false,
      "specialEffects": { "trail": "fire" },
      "unlockRequirement": { "type": "wave", "value": 5 },
      "shopPrice": 800
    },
    "cyberNinja": {
      "name": "Cyber Ninja",
      "description": "Futuristic ninja with neon effects",
      "rarity": "epic",
      "image": "player_cyber.png",
      "animated": true,
      "specialEffects": { "trail": "neon", "aura": "blue" },
      "unlockRequirement": { "type": "wave", "value": 10 },
      "shopPrice": 2000
    },
    "dragonKnight": {
      "name": "Dragon Knight",
      "description": "Legendary dragon-themed armor",
      "rarity": "legendary",
      "image": "player_dragon.png",
      "animated": true,
      "specialEffects": { "trail": "dragon_fire", "aura": "gold", "particles": "scales" },
      "unlockRequirement": { "type": "achievement", "value": "complete_wave_20" },
      "shopPrice": 5000
    }
  }
}
```

### 1.4 Database Setup Script
Create: `database/setup.sql`
- Database creation
- Table schemas
- Indexes
- Constraints
- Initial seed data from templates

### 1.5 Migration System
- Use **node-pg-migrate** or **Knex.js** for migrations
- Version-controlled schema changes
- Rollback capabilities
- **Template Import Scripts:**
  - `database/seeds/import-weapons.js` - Import weapon templates to DB
  - `database/seeds/import-skins.js` - Import skin templates to DB
  - `database/seeds/import-existing-data.js` - Migrate existing boss/enemy/wave templates

---

## Phase 2: Backend API (Node.js + Express)

### 2.1 Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database Client:** pg (node-postgres)
- **ORM (Optional):** Prisma or Sequelize
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** express-validator or Joi
- **Environment:** dotenv
- **CORS:** cors middleware

### 2.2 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   └── auth.js              # JWT config
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── admin.js             # Admin role check
│   │   └── validator.js         # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Wave.js
│   │   ├── Boss.js
│   │   ├── Enemy.js
│   │   ├── Weapon.js
│   │   ├── PlayerSkin.js
│   │   ├── ShopItem.js
│   │   ├── Inventory.js
│   │   └── Powerup.js
│   ├── routes/
│   │   ├── auth.js              # Login, register, logout
│   │   ├── waves.js             # Wave CRUD
│   │   ├── bosses.js            # Boss CRUD
│   │   ├── enemies.js           # Enemy CRUD
│   │   ├── weapons.js           # Weapon CRUD
│   │   ├── skins.js             # Skin CRUD
│   │   ├── shop.js              # Shop & purchases
│   │   ├── inventory.js         # Player inventory
│   │   ├── loadout.js           # Player loadout
│   │   ├── upgrades.js          # Weapon upgrades
│   │   ├── powerups.js          # Powerup CRUD
│   │   ├── game.js              # Game session endpoints
│   │   ├── leaderboard.js       # Leaderboard endpoints
│   │   └── admin.js             # Admin-specific endpoints
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── waveController.js
│   │   ├── bossController.js
│   │   ├── weaponController.js
│   │   ├── shopController.js
│   │   ├── inventoryController.js
│   │   └── ... (etc)
│   ├── services/
│   │   ├── waveService.js       # Business logic
│   │   ├── balanceService.js    # Balance calculations
│   │   ├── economyService.js    # Currency & pricing logic
│   │   ├── purchaseService.js   # Purchase transactions
│   │   ├── templateService.js   # Load & sync templates
│   │   └── exportService.js     # JSON export
│   ├── utils/
│   │   ├── logger.js
│   │   └── errors.js
│   └── app.js                   # Express app setup
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── setup.sql
├── .env.example
├── package.json
└── server.js                    # Entry point
```

### 2.3 Core API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

#### Waves (Admin Protected)
- `GET /api/waves` - List all waves
- `GET /api/waves/:id` - Get wave details
- `POST /api/waves` - Create wave
- `PUT /api/waves/:id` - Update wave
- `DELETE /api/waves/:id` - Delete wave
- `GET /api/waves/:id/bosses` - Get wave boss sequence
- `PUT /api/waves/:id/bosses` - Update boss sequence
- `POST /api/waves/:id/duplicate` - Duplicate wave

#### Bosses (Admin Protected)
- `GET /api/bosses` - List all bosses
- `GET /api/bosses/:id` - Get boss details
- `POST /api/bosses` - Create boss
- `PUT /api/bosses/:id` - Update boss
- `DELETE /api/bosses/:id` - Delete boss
- `GET /api/bosses/active` - Get active bosses only

#### Enemies (Admin Protected)
- `GET /api/enemies` - List all enemies
- `GET /api/enemies/:id` - Get enemy details
- `POST /api/enemies` - Create enemy
- `PUT /api/enemies/:id` - Update enemy
- `DELETE /api/enemies/:id` - Delete enemy

#### Weapons (Admin Protected)
- `GET /api/weapons` - List all weapons
- `GET /api/weapons/:id` - Get weapon details
- `POST /api/weapons` - Create weapon
- `PUT /api/weapons/:id` - Update weapon
- `DELETE /api/weapons/:id` - Delete weapon
- `GET /api/weapons/tree` - Get weapon progression tree

#### Player Skins (Admin Protected)
- `GET /api/skins` - List all skins
- `GET /api/skins/:id` - Get skin details
- `POST /api/skins` - Create skin
- `PUT /api/skins/:id` - Update skin
- `DELETE /api/skins/:id` - Delete skin

#### Shop (Admin Protected for Management)
- `GET /api/shop/items` - List all shop items (public)
- `GET /api/shop/featured` - Get featured items (public)
- `POST /api/shop/items` - Create shop item (admin)
- `PUT /api/shop/items/:id` - Update shop item (admin)
- `DELETE /api/shop/items/:id` - Remove from shop (admin)
- `POST /api/shop/purchase` - Purchase item (authenticated)
- `GET /api/shop/history` - Get purchase history (authenticated)

#### Inventory (Player)
- `GET /api/inventory` - Get player inventory
- `GET /api/inventory/weapons` - Get owned weapons
- `GET /api/inventory/skins` - Get owned skins
- `POST /api/inventory/equip` - Equip item
- `POST /api/inventory/unequip` - Unequip item

#### Loadout (Player)
- `GET /api/loadout` - Get active loadout
- `GET /api/loadout/:slot` - Get specific loadout
- `PUT /api/loadout/:slot` - Update loadout
- `POST /api/loadout/:slot/activate` - Activate loadout

#### Upgrades (Player)
- `GET /api/upgrades/weapon/:weaponId` - Get weapon upgrade status
- `POST /api/upgrades/weapon/:weaponId` - Upgrade weapon
- `GET /api/upgrades/available` - Get available upgrades

#### Powerups (Admin Protected)
- `GET /api/powerups` - List all powerups
- `GET /api/powerups/:id` - Get powerup details
- `POST /api/powerups` - Create powerup
- `PUT /api/powerups/:id` - Update powerup
- `DELETE /api/powerups/:id` - Delete powerup

#### Game (Public with Auth)
- `GET /api/game/config` - Get current game configuration
- `GET /api/game/wave/:waveNumber` - Get specific wave config
- `POST /api/game/session/start` - Start game session
- `POST /api/game/session/end` - End session & save stats
- `POST /api/game/stats` - Update player stats
- `POST /api/game/currency/earn` - Award currency (on kills, achievements)
- `GET /api/game/player/loadout` - Get player's active loadout for game

#### Leaderboard (Public)
- `GET /api/leaderboard` - Get top scores
- `GET /api/leaderboard/user/:userId` - Get user rank

#### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Change user role
- `POST /api/admin/users/:id/currency` - Grant currency to user
- `GET /api/admin/audit` - View audit log
- `POST /api/admin/export` - Export config as JSON
- `POST /api/admin/import` - Import config from JSON
- `POST /api/admin/templates/sync` - Sync templates from JSON to DB
- `POST /api/admin/templates/export` - Export DB data to template JSON files
- `GET /api/admin/balance-report` - Get balance statistics
- `GET /api/admin/economy` - Economy dashboard (purchases, earnings)
- `GET /api/admin/shop/analytics` - Shop analytics (popular items, revenue)

### 2.4 Security Features
- [ ] JWT token-based authentication
- [ ] Password hashing with bcrypt (10 rounds)
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting (express-rate-limit)
- [ ] Input validation & sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configuration
- [ ] Helmet.js for security headers
- [ ] Environment variable protection

---

## Phase 3: Admin Portal (Web Frontend)

### 3.1 Technology Stack Options

#### Option A: React + Material-UI (Recommended)
- **Framework:** React 18
- **UI Library:** Material-UI (MUI) v5
- **State Management:** React Context + Hooks (or Redux Toolkit)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Forms:** React Hook Form + Yup validation
- **Charts:** Recharts or Chart.js
- **Build Tool:** Vite

#### Option B: Vue 3 + Vuetify
- Vue 3 with Composition API
- Vuetify 3 for UI components
- Pinia for state management

#### Option C: Plain HTML/CSS/JS
- Minimal dependencies
- Bootstrap 5 for UI
- Vanilla JavaScript
- Faster development but less maintainable

### 3.2 Admin Portal Structure
```
admin-portal/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── Wave/
│   │   │   ├── WaveList.jsx
│   │   │   ├── WaveEditor.jsx
│   │   │   ├── WaveForm.jsx
│   │   │   └── BossSequenceBuilder.jsx
│   │   ├── Boss/
│   │   │   ├── BossList.jsx
│   │   │   ├── BossEditor.jsx
│   │   │   └── BossForm.jsx
│   │   ├── Enemy/
│   │   │   ├── EnemyList.jsx
│   │   │   └── EnemyEditor.jsx
│   │   ├── Weapon/
│   │   │   ├── WeaponList.jsx
│   │   │   ├── WeaponEditor.jsx
│   │   │   ├── WeaponForm.jsx
│   │   │   └── WeaponProgressionTree.jsx
│   │   ├── Skin/
│   │   │   ├── SkinList.jsx
│   │   │   ├── SkinEditor.jsx
│   │   │   └── SkinPreview.jsx
│   │   ├── Shop/
│   │   │   ├── ShopItemList.jsx
│   │   │   ├── ShopItemEditor.jsx
│   │   │   ├── PricingTool.jsx
│   │   │   └── ShopAnalytics.jsx
│   │   ├── Economy/
│   │   │   ├── EconomyDashboard.jsx
│   │   │   ├── CurrencySettings.jsx
│   │   │   └── RevenueCharts.jsx
│   │   ├── Powerup/
│   │   │   ├── PowerupList.jsx
│   │   │   └── PowerupEditor.jsx
│   │   ├── Charts/
│   │   │   ├── BalanceChart.jsx
│   │   │   └── StatsChart.jsx
│   │   ├── Common/
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   └── Auth/
│   │       ├── Login.jsx
│   │       └── PrivateRoute.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Waves.jsx
│   │   ├── Bosses.jsx
│   │   ├── Enemies.jsx
│   │   ├── Weapons.jsx
│   │   ├── Skins.jsx
│   │   ├── Shop.jsx
│   │   ├── Economy.jsx
│   │   ├── Powerups.jsx
│   │   ├── Users.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Balance.jsx
│   │   └── Settings.jsx
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   ├── authService.js
│   │   ├── waveService.js
│   │   ├── bossService.js
│   │   ├── weaponService.js
│   │   ├── skinService.js
│   │   ├── shopService.js
│   │   ├── economyService.js
│   │   └── ... (etc)
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useApi.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

### 3.3 Key Features

#### Dashboard
- Total waves count
- Total bosses/enemies/powerups
- Recent activity log
- Quick actions

#### Wave Management
- **List View:** Table with wave number, name, duration, boss count
- **Edit View:**
  - Basic info (name, description, scene)
  - Duration settings
  - Enemy spawn rate slider
  - Max enemies slider
  - Boss sequence timeline (drag-and-drop)
  - Powerup settings
  - Preview button
- **Boss Sequence Builder:**
  - Visual timeline (0s → 180s)
  - Drag bosses onto timeline
  - Set spawn times
  - Mark main boss
  - Reorder sequence
  - Add multiple boss instances

#### Boss Management
- **List View:** Cards or table with boss image, name, type
- **Edit View:**
  - Basic info (name, description, type)
  - Stats sliders (health, speed)
  - Scale range inputs
  - Color picker
  - Image upload
  - Abilities multi-select
  - Sound configuration
  - Defeat reward
  - Active toggle

#### Enemy Management
- Similar to boss management
- Additional fields for enemy-specific attributes
- **Currency Drop:** Set how much currency enemies drop on kill

#### Weapon Management
- **List View:** Grid/table with weapon image, name, tier, damage
- **Template Sync:**
  - Import from `config/weapons/weaponTemplates.json`
  - Export to JSON for version control
  - Sync button to update DB from templates
  - Compare DB vs template differences
- **Edit View:**
  - Basic info (name, description, tier)
  - Stats sliders (damage, fire rate, projectile speed)
  - Advanced settings (pierce, spread, ammo)
  - Special effects configuration
  - Image/sound uploads
  - Unlock requirements
  - Shop price setting
  - Upgrade path definition
- **Progression Tree View:**
  - Visual tree showing weapon upgrades
  - Tier-based grouping
  - Unlock requirements flow
  - Drag-and-drop reordering

#### Player Skin Management
- **List View:** Gallery of skins with preview
- **Template Sync:**
  - Import from `config/skins/skinTemplates.json`
  - Export to JSON for version control
  - Sync button to update DB from templates
  - Compare DB vs template differences
- **Edit View:**
  - Basic info (name, description, rarity)
  - Image upload with preview
  - Animation toggle
  - Special effects (trails, auras, particles)
  - Unlock requirements
  - Shop price setting
- **Preview Mode:** Live preview with player animations

#### Shop Management
- **Shop Items List:**
  - All items available in shop
  - Price configuration (regular & premium currency)
  - Discount settings
  - Featured items toggle
  - Limited-time offers
  - Availability date ranges
- **Pricing Tool:**
  - Bulk price adjustments
  - A/B testing for prices
  - Discount campaigns
  - Bundle creation
- **Analytics Dashboard:**
  - Most purchased items
  - Revenue per item type
  - Conversion rates
  - Average purchase value
  - Currency sinks vs sources

#### Economy Dashboard
- **Currency Flow:**
  - Total currency earned (by source: kills, waves, achievements)
  - Total currency spent (by category: weapons, skins, upgrades)
  - Currency in circulation
  - Inflation metrics
- **Pricing Balance:**
  - Recommended pricing based on earning rates
  - Time-to-unlock calculations
  - Engagement vs monetization balance
- **Player Spending Patterns:**
  - Average time to first purchase
  - Most popular purchase categories
  - Retention by spenders vs non-spenders

#### Powerup Management
- Powerup configuration
- Effect editor (JSON or form-based)
- Rarity selection

#### Balance Dashboard
- Charts showing:
  - Boss health vs wave progression
  - Enemy spawn rates
  - Average wave completion time
  - Death rates per wave
  - Powerup drop rates
  - **Weapon effectiveness by wave** (new)
  - **Currency earning vs spending rates** (new)
  - **Time to unlock weapons/skins** (new)
  - **Player progression velocity** (new)
- Balance warnings/recommendations
- **Economy alerts** (e.g., "Players are hoarding currency" or "Prices too high")

#### User Management
- User list
- Role assignment
- Activity logs
- Ban/Unban users

#### Export/Import
- Export all configs as JSON (compatible with current format)
- Import JSON to populate database
- Bulk operations

### 3.4 UI/UX Features
- [ ] Responsive design (mobile-friendly)
- [ ] Dark/Light theme toggle
- [ ] Real-time validation
- [ ] Undo/Redo for changes
- [ ] Confirmation dialogs for destructive actions
- [ ] Toast notifications for success/error
- [ ] Loading states
- [ ] Error handling with user-friendly messages
- [ ] Keyboard shortcuts
- [ ] Search and filter functionality
- [ ] Pagination for large datasets
- [ ] Batch operations (bulk delete, bulk activate)

---

## Phase 4: Game Integration

### 4.1 Modify Game to Use API

#### Update APIService.js
```javascript
// Add methods for fetching dynamic configs
async getWaveConfig(waveNumber) { ... }
async getBossConfig(bossId) { ... }
async getEnemyConfig(enemyId) { ... }
async getWeaponConfig(weaponId) { ... }
async getPlayerLoadout() { ... }
async getShopItems() { ... }
async purchaseItem(itemId) { ... }
async upgradeWeapon(weaponId) { ... }
async equipItem(itemType, itemId) { ... }
async earnCurrency(amount, source) { ... }
async startGameSession() { ... }
async endGameSession(sessionData) { ... }
```

#### Create New Game Systems

**ShopScene.js** - New scene for in-game shop
- Display available weapons & skins
- Purchase interface
- Currency display
- Try-before-buy preview

**InventoryScene.js** - Player inventory management
- Owned items display
- Equip/unequip interface
- Loadout management

**WeaponSystem.js** - Enhanced weapon system
- Load weapon configs from API
- Apply weapon stats to projectiles
- Handle weapon switching
- Upgrade effects
- Visual feedback for weapon tier

**Player.js Updates**
- Load equipped skin from API
- Apply weapon from loadout
- Display currency in HUD
- Currency earning on kills

#### Update WaveManager.js
- Replace static JSON fetch with API calls
- Cache configs in memory
- Handle offline mode (fallback to local JSON)

#### Create Template Loaders
**WeaponTemplateLoader.js**
- Load weapon templates from `/config/weapons/weaponTemplates.json`
- Fallback if API unavailable
- Cache in localStorage

**SkinTemplateLoader.js**
- Load skin templates from `/config/skins/skinTemplates.json`
- Fallback if API unavailable
- Cache in localStorage

#### Update Boss.js & Enemy.js
- Accept dynamic configurations
- Handle new properties (currency drops)
- Award currency on defeat/kill

### 4.2 Configuration Modes
1. **Production Mode:** Fetch from API (live balancing)
2. **Development Mode:** Use local JSON files
3. **Offline Mode:** Use cached configs

### 4.3 Versioning
- Version configs in database
- Client checks version on startup
- Download updated configs if available

---

## Phase 5: Deployment

### 5.1 Database Hosting
**Options:**
- **AWS RDS PostgreSQL**
- **DigitalOcean Managed Databases**
- **Heroku Postgres**
- **Supabase** (PostgreSQL with built-in auth)
- **Self-hosted** on VPS (DigitalOcean, Linode)

### 5.2 Backend Hosting
**Options:**
- **Heroku** (easy deployment)
- **Railway.app** (modern alternative)
- **AWS EC2** or **ECS**
- **DigitalOcean App Platform**
- **Vercel** (for serverless functions)
- **Render.com**

### 5.3 Admin Portal Hosting
**Options:**
- **Vercel** (best for React/Next.js)
- **Netlify**
- **AWS S3 + CloudFront**
- **GitHub Pages** (for static sites)
- Same server as backend (served by Express)

### 5.4 Domain & SSL
- Purchase domain (e.g., yourgame.com)
- Setup subdomains:
  - `api.yourgame.com` → Backend
  - `admin.yourgame.com` → Admin Portal
  - `yourgame.com` → Game
- SSL certificates (Let's Encrypt or provider)

### 5.5 CI/CD Pipeline
- **GitHub Actions** or **GitLab CI**
- Automated testing
- Automated deployment on merge to main
- Database migrations on deploy

---

## Phase 6: Testing & Quality Assurance

### 6.1 Backend Testing
- Unit tests (Jest)
- Integration tests (Supertest)
- API endpoint testing
- Database query testing

### 6.2 Frontend Testing
- Component tests (React Testing Library)
- E2E tests (Cypress or Playwright)
- Accessibility testing

### 6.3 Load Testing
- API load testing (k6 or Artillery)
- Database performance testing
- Concurrent user testing

---

## Implementation Timeline

### Week 1: Database & Backend Foundation
- [ ] Day 1-2: PostgreSQL setup, schema design
- [ ] Day 3-4: Backend project setup, database connection
- [ ] Day 5-7: Core API endpoints (auth, waves, bosses)

### Week 2: Backend Completion
- [ ] Day 8-10: Remaining API endpoints
- [ ] Day 11-12: Authentication & authorization
- [ ] Day 13-14: Testing & documentation

### Week 3: Admin Portal Frontend
- [ ] Day 15-16: Project setup, routing, layout
- [ ] Day 17-18: Wave management UI
- [ ] Day 19-20: Boss/Enemy management UI
- [ ] Day 21: Dashboard & charts

### Week 4: Integration & Polish
- [ ] Day 22-23: Game integration with API
- [ ] Day 24-25: Admin portal polish, testing
- [ ] Day 26-27: Deployment setup
- [ ] Day 28: Final testing & launch

---

## Dependencies & Package Lists

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

### Admin Portal (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.2",
    "yup": "^1.3.3",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kombat_game
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Admin Portal (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_GAME_URL=http://localhost:5173
```

---

## In-Game Purchase Flow

### Player Experience
1. **Earn Currency:**
   - Kill enemies → Earn X currency
   - Defeat bosses → Earn XX currency
   - Complete waves → Earn XXX currency
   - Achievements → Bonus currency

2. **Access Shop:**
   - Pause menu → Shop button
   - Between waves → Shop prompt
   - Main menu → Shop & Inventory

3. **Browse & Purchase:**
   - View weapon stats comparison
   - Preview skins on player model
   - See unlock requirements
   - Purchase with earned currency
   - Optional: Premium currency for shortcuts

4. **Equip & Play:**
   - Equip from inventory
   - Set active loadout
   - Immediate effect in next game/life

5. **Upgrade:**
   - Upgrade owned weapons for better stats
   - Incremental improvements
   - Visual tier indicators

### Admin Control
- Set currency drop rates per enemy/boss
- Adjust all prices from admin panel
- Create limited-time sales
- Monitor economy health
- Grant currency to players (support/events)

---

## Template System Workflow

### Developer Workflow
1. **Create/Edit Templates:**
   - Edit `config/weapons/weaponTemplates.json` directly in code
   - Edit `config/skins/skinTemplates.json` directly in code
   - Version control with Git
   - Easy for developers to manage

2. **Sync to Database:**
   - Admin portal → Templates page → Click "Sync from JSON"
   - Or run: `npm run sync-templates`
   - Templates imported to PostgreSQL

3. **Admin Adjustments:**
   - Use admin portal to fine-tune balance
   - Adjust prices, stats, unlock requirements
   - Changes saved to database

4. **Export Back to Templates (Optional):**
   - Admin portal → Templates page → Click "Export to JSON"
   - Updates template files with DB changes
   - Commit to Git for version control

### Game Loading Priority
1. **Try API:** Fetch from database (latest admin changes)
2. **Fallback to Templates:** Load from JSON files if API fails
3. **Use Cache:** Use localStorage cache if offline

### Benefits
- **Version Control:** Templates in Git for history tracking
- **Developer Friendly:** Edit JSON files directly
- **Admin Friendly:** Visual UI for adjustments
- **Dual Mode:** Works with or without backend
- **Backward Compatible:** Existing template structure preserved

---

## Migration from Current Setup

### Step 1: Data Migration Script
Create script to:
1. Read existing JSON files (bosses, enemies, waves)
2. Read new JSON files (weapons, skins)
3. Insert into PostgreSQL
4. Verify data integrity

### Step 2: Dual Mode Support
Game can run in:
- **Legacy Mode:** JSON files (fallback)
- **API Mode:** Database-driven

### Step 3: Gradual Rollout
1. Deploy backend + database
2. Migrate existing data
3. Test admin portal with real data
4. Update game to use API
5. Monitor & fix issues
6. Remove legacy mode after stable

---

## Success Metrics

- [ ] Admin can create/edit waves in <2 minutes
- [ ] All balance changes reflected in game within 30 seconds
- [ ] API response time <200ms for config endpoints
- [ ] Zero data loss during operations
- [ ] 99.9% uptime for production environment
- [ ] Admin portal loads in <2 seconds
- [ ] Support for 100+ concurrent players

---

## Future Enhancements

### Phase 2 Features
- [ ] A/B testing for balance changes
- [ ] Player feedback system
- [ ] Analytics dashboard
- [ ] Automated balance recommendations (ML)
- [ ] In-game content preview
- [ ] Scheduled content releases
- [ ] Multi-language support
- [ ] Asset management (image uploads)
- [ ] Version comparison tool
- [ ] Collaborative editing (real-time)

---

## Resources & References

### Documentation
- PostgreSQL: https://www.postgresql.org/docs/
- Express.js: https://expressjs.com/
- React: https://react.dev/
- Material-UI: https://mui.com/

### Tutorials
- PostgreSQL + Node.js: https://node-postgres.com/
- JWT Authentication: https://jwt.io/introduction
- React Admin Dashboards: https://mui.com/material-ui/getting-started/templates/

---

## Questions to Address Before Starting

1. **User Management:** Do you need player registration, or just admin accounts?
   - **Note:** With purchases, player accounts are required
2. **Monetization:** Will premium currency be paid (real money) or just in-game?
3. **Hosting Budget:** What's your budget for hosting (free tier, $10/month, $50/month)?
4. **Team Size:** How many admins will use the portal?
5. **Priority Features:** Which features are must-have for MVP?
6. **Timeline:** Do you have a specific launch deadline?
7. **Current Data:** Should we migrate existing JSON configs to the database?
8. **Starting Currency:** How much currency should new players start with?
9. **Weapon Progression:** Linear upgrades or branching tech tree?
10. **Skin Pricing:** Fixed tiers or demand-based pricing?

---

## Next Steps

1. **Review this plan** and provide feedback
2. **Answer the questions** above
3. **Set up PostgreSQL** locally
4. **Start with Phase 1** (Database setup)
5. **Build backend API** (Phase 2)
6. **Create admin portal** (Phase 3)

---

**Created:** January 2, 2026  
**Last Updated:** January 2, 2026  
**Status:** Planning Phase
