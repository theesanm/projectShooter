-- Create game_stats table for tracking game statistics
CREATE TABLE IF NOT EXISTS game_stats (
  id SERIAL PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  wave_reached INTEGER NOT NULL DEFAULT 1,
  kills INTEGER NOT NULL DEFAULT 0,
  shooter_id INTEGER,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_stats_score ON game_stats(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_wave ON game_stats(wave_reached DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_shooter ON game_stats(shooter_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_played_at ON game_stats(played_at DESC);

-- Add comments
COMMENT ON TABLE game_stats IS 'Stores game statistics and scores';
COMMENT ON COLUMN game_stats.score IS 'Final score achieved in the game';
COMMENT ON COLUMN game_stats.wave_reached IS 'Highest wave reached';
COMMENT ON COLUMN game_stats.kills IS 'Total enemies killed';
COMMENT ON COLUMN game_stats.shooter_id IS 'Player character used';
COMMENT ON COLUMN game_stats.played_at IS 'When the game was played';
