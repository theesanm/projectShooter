import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/enemies
 * Get all active enemies
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, enemy_key, name, type, base_health, base_speed, base_damage,
        point_value, currency_drop, scale_min, scale_max, color, image,
        abilities, is_active, created_at, updated_at
      FROM enemies
      ORDER BY is_active DESC, base_health ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enemies:', error);
    res.status(500).json({ error: 'Failed to fetch enemies' });
  }
});

/**
 * GET /api/enemies/:id
 * Get enemy by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT *
      FROM enemies
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching enemy:', error);
    res.status(500).json({ error: 'Failed to fetch enemy' });
  }
});

/**
 * POST /api/enemies
 * Create new enemy (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      enemy_key, name, type, base_health, base_speed, base_damage,
      point_value, currency_drop, scale_min, scale_max, color, image, abilities
    } = req.body;

    const result = await pool.query(`
      INSERT INTO enemies (
        enemy_key, name, type, base_health, base_speed, base_damage,
        point_value, currency_drop, scale_min, scale_max, color, image, abilities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      enemy_key, name, type, base_health, base_speed, base_damage,
      point_value, currency_drop, scale_min, scale_max, color, image, abilities
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating enemy:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Enemy key already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create enemy' });
    }
  }
});

/**
 * PUT /api/enemies/:id
 * Update enemy (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enemy_key, name, type, base_health, base_speed, base_damage,
      point_value, currency_drop, scale_min, scale_max, color, image, abilities, is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE enemies
      SET enemy_key = $1, name = $2, type = $3, base_health = $4, base_speed = $5,
          base_damage = $6, point_value = $7, currency_drop = $8, scale_min = $9,
          scale_max = $10, color = $11, image = $12, abilities = $13, is_active = $14,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      enemy_key, name, type, base_health, base_speed, base_damage,
      point_value, currency_drop, scale_min, scale_max, color, image, abilities, is_active, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating enemy:', error);
    res.status(500).json({ error: 'Failed to update enemy' });
  }
});

/**
 * DELETE /api/enemies/:id
 * Delete enemy (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM enemies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json({ message: 'Enemy deleted successfully' });
  } catch (error) {
    console.error('Error deleting enemy:', error);
    res.status(500).json({ error: 'Failed to delete enemy' });
  }
});

export default router;
