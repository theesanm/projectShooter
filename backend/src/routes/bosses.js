import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/bosses
 * Get all bosses
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, boss_key, name, description, type, base_health, base_speed, base_damage,
        scale_min, scale_max, color, image, defeat_reward, currency_drop,
        abilities, sounds, is_active, created_at, updated_at
      FROM bosses
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bosses:', error);
    res.status(500).json({ error: 'Failed to fetch bosses' });
  }
});

/**
 * GET /api/bosses/:id
 * Get boss by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT *
      FROM bosses
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boss not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching boss:', error);
    res.status(500).json({ error: 'Failed to fetch boss' });
  }
});

/**
 * POST /api/bosses
 * Create new boss (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      boss_key,
      name,
      description,
      type,
      base_health,
      base_speed,
      base_damage,
      scale_min,
      scale_max,
      color,
      image,
      defeat_reward,
      currency_drop,
      abilities,
      sounds,
    } = req.body;

    const result = await pool.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed, base_damage,
        scale_min, scale_max, color, image, defeat_reward, currency_drop,
        abilities, sounds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      boss_key,
      name,
      description,
      type,
      base_health,
      base_speed,
      base_damage || 10,
      scale_min || 1.0,
      scale_max || 1.0,
      color,
      image,
      defeat_reward || 0,
      currency_drop || 0,
      abilities ? JSON.stringify(abilities) : null,
      sounds ? JSON.stringify(sounds) : null,
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boss:', error);
    res.status(500).json({ error: 'Failed to create boss' });
  }
});

/**
 * PUT /api/bosses/:id
 * Update boss (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      boss_key,
      name,
      description,
      type,
      base_health,
      base_speed,
      base_damage,
      scale_min,
      scale_max,
      color,
      image,
      defeat_reward,
      currency_drop,
      abilities,
      sounds,
      is_active,
    } = req.body;

    const result = await pool.query(`
      UPDATE bosses SET
        boss_key = COALESCE($1, boss_key),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        base_health = COALESCE($5, base_health),
        base_speed = COALESCE($6, base_speed),
        base_damage = COALESCE($7, base_damage),
        scale_min = COALESCE($8, scale_min),
        scale_max = COALESCE($9, scale_max),
        color = COALESCE($10, color),
        image = COALESCE($11, image),
        defeat_reward = COALESCE($12, defeat_reward),
        currency_drop = COALESCE($13, currency_drop),
        abilities = COALESCE($14, abilities),
        sounds = COALESCE($15, sounds),
        is_active = COALESCE($16, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `, [
      boss_key,
      name,
      description,
      type,
      base_health,
      base_speed,
      base_damage,
      scale_min,
      scale_max,
      color,
      image,
      defeat_reward,
      currency_drop,
      abilities ? JSON.stringify(abilities) : null,
      sounds ? JSON.stringify(sounds) : null,
      is_active,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boss not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating boss:', error);
    res.status(500).json({ error: 'Failed to update boss' });
  }
});

/**
 * DELETE /api/bosses/:id
 * Delete boss (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM bosses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boss not found' });
    }

    res.json({ message: 'Boss deleted successfully' });
  } catch (error) {
    console.error('Error deleting boss:', error);
    res.status(500).json({ error: 'Failed to delete boss' });
  }
});

export default router;
