-- =====================================================
-- Kombat Game Database Setup
-- PostgreSQL Schema Creation
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin', 'super_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- PLAYER STATS & PROGRESSION
-- =====================================================

CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    highest_wave INTEGER DEFAULT 0,
    total_kills INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    play_time_seconds INTEGER DEFAULT 0,
    currency INTEGER DEFAULT 0,
    premium_currency INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_player_stats_user ON player_stats(user_id);
CREATE INDEX idx_player_stats_score ON player_stats(total_score DESC);

-- =====================================================
-- GAME CONTENT - WAVES
-- =====================================================

CREATE TABLE IF NOT EXISTS waves (
    id SERIAL PRIMARY KEY,
    wave_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    scene_id VARCHAR(50),
    duration_ms INTEGER NOT NULL,
    enemy_spawn_rate_ms INTEGER NOT NULL,
    max_enemies INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waves_number ON waves(wave_number);
CREATE INDEX idx_waves_active ON waves(is_active);

-- =====================================================
-- GAME CONTENT - BOSSES
-- =====================================================

CREATE TABLE IF NOT EXISTS bosses (
    id SERIAL PRIMARY KEY,
    boss_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    base_health INTEGER NOT NULL,
    base_speed INTEGER NOT NULL,
    scale_min DECIMAL(3,2) DEFAULT 1.0,
    scale_max DECIMAL(3,2) DEFAULT 1.0,
    color VARCHAR(8),
    image VARCHAR(255),
    defeat_reward INTEGER DEFAULT 0,
    currency_drop INTEGER DEFAULT 0,
    abilities JSONB,
    sounds JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bosses_key ON bosses(boss_key);
CREATE INDEX idx_bosses_active ON bosses(is_active);

-- =====================================================
-- WAVE BOSS SEQUENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS wave_boss_sequence (
    id SERIAL PRIMARY KEY,
    wave_id INTEGER NOT NULL REFERENCES waves(id) ON DELETE CASCADE,
    boss_id INTEGER NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
    spawn_time_ms INTEGER NOT NULL,
    is_main_boss BOOLEAN DEFAULT FALSE,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wave_boss_wave ON wave_boss_sequence(wave_id);
CREATE INDEX idx_wave_boss_order ON wave_boss_sequence(wave_id, sequence_order);

-- =====================================================
-- GAME CONTENT - ENEMIES
-- =====================================================

CREATE TABLE IF NOT EXISTS enemies (
    id SERIAL PRIMARY KEY,
    enemy_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    base_health INTEGER NOT NULL,
    base_speed INTEGER NOT NULL,
    base_damage INTEGER NOT NULL,
    point_value INTEGER DEFAULT 0,
    currency_drop INTEGER DEFAULT 0,
    scale_min DECIMAL(3,2) DEFAULT 1.0,
    scale_max DECIMAL(3,2) DEFAULT 1.0,
    color VARCHAR(8),
    image VARCHAR(255),
    abilities JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enemies_key ON enemies(enemy_key);
CREATE INDEX idx_enemies_active ON enemies(is_active);

-- =====================================================
-- GAME CONTENT - WEAPONS
-- =====================================================

CREATE TABLE IF NOT EXISTS weapons (
    id SERIAL PRIMARY KEY,
    weapon_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier INTEGER NOT NULL,
    damage INTEGER NOT NULL,
    fire_rate INTEGER NOT NULL,
    projectile_speed INTEGER NOT NULL,
    projectile_size DECIMAL(3,2) DEFAULT 1.0,
    pierce_count INTEGER DEFAULT 1,
    spread_angle INTEGER DEFAULT 0,
    projectile_count INTEGER DEFAULT 1,
    reload_time INTEGER DEFAULT 0,
    ammo_capacity INTEGER,
    special_effects JSONB,
    image VARCHAR(255),
    projectile_image VARCHAR(255),
    sound VARCHAR(255),
    unlock_requirement JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weapons_key ON weapons(weapon_key);
CREATE INDEX idx_weapons_tier ON weapons(tier);
CREATE INDEX idx_weapons_active ON weapons(is_active);

-- =====================================================
-- GAME CONTENT - PLAYER SKINS
-- =====================================================

CREATE TABLE IF NOT EXISTS player_skins (
    id SERIAL PRIMARY KEY,
    skin_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
    image VARCHAR(255),
    animated BOOLEAN DEFAULT FALSE,
    special_effects JSONB,
    unlock_requirement JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skins_key ON player_skins(skin_key);
CREATE INDEX idx_skins_rarity ON player_skins(rarity);
CREATE INDEX idx_skins_active ON player_skins(is_active);

-- =====================================================
-- GAME CONTENT - POWERUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS powerups (
    id SERIAL PRIMARY KEY,
    powerup_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    effect JSONB,
    duration_ms INTEGER,
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_powerups_key ON powerups(powerup_key);
CREATE INDEX idx_powerups_active ON powerups(is_active);

-- =====================================================
-- WAVE SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS wave_settings (
    id SERIAL PRIMARY KEY,
    wave_id INTEGER NOT NULL REFERENCES waves(id) ON DELETE CASCADE,
    powerup_spawn_interval_ms INTEGER,
    allowed_powerup_types JSONB,
    difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wave_id)
);

CREATE INDEX idx_wave_settings_wave ON wave_settings(wave_id);

-- =====================================================
-- SHOP SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS shop_items (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(20) CHECK (item_type IN ('weapon', 'skin', 'powerup', 'upgrade')),
    item_id INTEGER NOT NULL,
    price_currency INTEGER NOT NULL,
    price_premium INTEGER DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_limited BOOLEAN DEFAULT FALSE,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    purchase_limit INTEGER,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shop_items_type ON shop_items(item_type);
CREATE INDEX idx_shop_items_featured ON shop_items(is_featured);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);

-- =====================================================
-- PLAYER INVENTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS player_inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) CHECK (item_type IN ('weapon', 'skin', 'powerup', 'upgrade')),
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_inventory_user ON player_inventory(user_id);
CREATE INDEX idx_inventory_equipped ON player_inventory(user_id, is_equipped);

-- =====================================================
-- PLAYER LOADOUT
-- =====================================================

CREATE TABLE IF NOT EXISTS player_loadout (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loadout_slot INTEGER DEFAULT 1,
    equipped_weapon_id INTEGER REFERENCES weapons(id),
    equipped_skin_id INTEGER REFERENCES player_skins(id),
    equipped_powerups JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, loadout_slot)
);

CREATE INDEX idx_loadout_user ON player_loadout(user_id);
CREATE INDEX idx_loadout_active ON player_loadout(user_id, is_active);

-- =====================================================
-- PURCHASE HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_item_id INTEGER REFERENCES shop_items(id),
    item_type VARCHAR(20),
    item_id INTEGER NOT NULL,
    price_paid_currency INTEGER DEFAULT 0,
    price_paid_premium INTEGER DEFAULT 0,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_user ON purchase_history(user_id);
CREATE INDEX idx_purchase_date ON purchase_history(purchased_at DESC);

-- =====================================================
-- WEAPON UPGRADES
-- =====================================================

CREATE TABLE IF NOT EXISTS weapon_upgrades (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weapon_id INTEGER NOT NULL REFERENCES weapons(id) ON DELETE CASCADE,
    upgrade_level INTEGER DEFAULT 1,
    damage_bonus INTEGER DEFAULT 0,
    fire_rate_bonus INTEGER DEFAULT 0,
    ammo_bonus INTEGER DEFAULT 0,
    special_bonus JSONB,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, weapon_id)
);

CREATE INDEX idx_weapon_upgrades_user ON weapon_upgrades(user_id);
CREATE INDEX idx_weapon_upgrades_weapon ON weapon_upgrades(weapon_id);

-- =====================================================
-- GAME SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wave_reached INTEGER DEFAULT 1,
    final_score INTEGER DEFAULT 0,
    total_kills INTEGER DEFAULT 0,
    session_duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_sessions_date ON game_sessions(started_at DESC);

-- =====================================================
-- LEADERBOARD
-- =====================================================

CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    wave_reached INTEGER NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC, achieved_at DESC);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waves_updated_at BEFORE UPDATE ON waves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bosses_updated_at BEFORE UPDATE ON bosses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enemies_updated_at BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weapons_updated_at BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skins_updated_at BEFORE UPDATE ON player_skins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_powerups_updated_at BEFORE UPDATE ON powerups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wave_settings_updated_at BEFORE UPDATE ON wave_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON shop_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loadout_updated_at BEFORE UPDATE ON player_loadout
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weapon_upgrades_updated_at BEFORE UPDATE ON weapon_upgrades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE
-- =====================================================

SELECT 'Database schema created successfully!' as status;
