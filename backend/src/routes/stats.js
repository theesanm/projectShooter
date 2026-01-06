import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * POST /api/stats
 * Save game statistics
 */
router.post('/', async (req, res) => {
  try {
    const { score, wave, kills, shooter, timestamp } = req.body;
    
    console.log('[Stats] Saving game stats:', { score, wave, kills, shooter, timestamp });
    
    // Parse shooter_id as integer if it's a number, otherwise set to null
    const shooterId = shooter && !isNaN(shooter) ? parseInt(shooter) : null;
    
    // Insert into game_stats table
    const result = await pool.query(
      `INSERT INTO game_stats (score, wave_reached, kills, shooter_id, played_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))
       RETURNING *`,
      [score, wave, kills, shooterId, timestamp]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Stats] Error saving stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save stats',
      details: error.message 
    });
  }
});

/**
 * GET /api/stats
 * Get game statistics (leaderboard)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, shooter } = req.query;
    
    let query = `
      SELECT s.*
      FROM game_stats s
    `;
    
    const params = [];
    
    if (shooter) {
      query += ' WHERE s.shooter_id = $1';
      params.push(shooter);
    }
    
    query += ' ORDER BY s.score DESC, s.wave_reached DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('[Stats] Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});

/**
 * GET /api/stats/summary
 * Get summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_games,
        MAX(score) as highest_score,
        MAX(wave_reached) as highest_wave,
        SUM(kills) as total_kills,
        AVG(score)::int as avg_score
      FROM game_stats
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Stats] Error fetching summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch summary',
      details: error.message 
    });
  }
});

export default router;
