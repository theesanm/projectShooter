import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/powerups
 * Get all active powerups
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, powerup_key, name, type, effect, duration_ms,
        rarity, image, is_active, created_at, updated_at
      FROM powerups
      ORDER BY is_active DESC, rarity, name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching powerups:', error);
    res.status(500).json({ error: 'Failed to fetch powerups' });
  }
});

/**
 * GET /api/powerups/:id
 * Get powerup by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT *
      FROM powerups
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Powerup not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching powerup:', error);
    res.status(500).json({ error: 'Failed to fetch powerup' });
  }
});

/**
 * POST /api/powerups
 * Create new powerup (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      powerup_key, name, type, effect, duration_ms,
      rarity, image
    } = req.body;

    const result = await pool.query(`
      INSERT INTO powerups (
        powerup_key, name, type, effect, duration_ms, rarity, image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [powerup_key, name, type, effect, duration_ms, rarity, image]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating powerup:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Powerup key already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create powerup' });
    }
  }
});

/**
 * PUT /api/powerups/:id
 * Update powerup (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      powerup_key, name, type, effect, duration_ms,
      rarity, image, is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE powerups
      SET powerup_key = $1, name = $2, type = $3, effect = $4,
          duration_ms = $5, rarity = $6, image = $7, is_active = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [powerup_key, name, type, effect, duration_ms, rarity, image, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Powerup not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating powerup:', error);
    res.status(500).json({ error: 'Failed to update powerup' });
  }
});

/**
 * DELETE /api/powerups/:id
 * Delete powerup (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM powerups WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Powerup not found' });
    }

    res.json({ message: 'Powerup deleted successfully' });
  } catch (error) {
    console.error('Error deleting powerup:', error);
    res.status(500).json({ error: 'Failed to delete powerup' });
  }
});

export default router;
