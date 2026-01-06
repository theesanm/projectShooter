-- =====================================================
-- Add Stat Multipliers to Wave Boss Sequence
-- This allows each wave to have different stats for the same boss
-- =====================================================

-- Add multiplier columns to wave_boss_sequence
ALTER TABLE wave_boss_sequence 
ADD COLUMN IF NOT EXISTS health_multiplier DECIMAL(4,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS damage_multiplier DECIMAL(4,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS speed_multiplier DECIMAL(4,2) DEFAULT 1.0;

-- Add comments for clarity
COMMENT ON COLUMN wave_boss_sequence.health_multiplier IS 'Multiplier for boss base health (e.g., 1.5 = 150% health)';
COMMENT ON COLUMN wave_boss_sequence.damage_multiplier IS 'Multiplier for boss base damage (e.g., 2.0 = 200% damage)';
COMMENT ON COLUMN wave_boss_sequence.speed_multiplier IS 'Multiplier for boss base speed (e.g., 0.8 = 80% speed)';

-- Also ensure bosses table has base_damage (if missing from current schema)
ALTER TABLE bosses 
ADD COLUMN IF NOT EXISTS base_damage INTEGER DEFAULT 10;

-- Update existing wave_boss_sequence records to have default multipliers
UPDATE wave_boss_sequence 
SET 
    health_multiplier = COALESCE(health_multiplier, 1.0),
    damage_multiplier = COALESCE(damage_multiplier, 1.0),
    speed_multiplier = COALESCE(speed_multiplier, 1.0)
WHERE health_multiplier IS NULL 
   OR damage_multiplier IS NULL 
   OR speed_multiplier IS NULL;
