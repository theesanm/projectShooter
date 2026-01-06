import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all weapons (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM weapons WHERE is_active = true ORDER BY tier, id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get weapons error:', error);
    res.status(500).json({ error: 'Failed to get weapons' });
  }
});

// Get weapon by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM weapons WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weapon not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get weapon error:', error);
    res.status(500).json({ error: 'Failed to get weapon' });
  }
});

// Create weapon (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const {
    weapon_key, name, description, tier, damage, fire_rate,
    projectile_speed, projectile_size, pierce_count, spread_angle,
    projectile_count, reload_time, ammo_capacity, special_effects,
    image, projectile_image, sound, unlock_requirement
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO weapons (
        weapon_key, name, description, tier, damage, fire_rate,
        projectile_speed, projectile_size, pierce_count, spread_angle,
        projectile_count, reload_time, ammo_capacity, special_effects,
        image, projectile_image, sound, unlock_requirement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [weapon_key, name, description, tier, damage, fire_rate,
       projectile_speed, projectile_size, pierce_count, spread_angle,
       projectile_count, reload_time, ammo_capacity, JSON.stringify(special_effects),
       image, projectile_image, sound, JSON.stringify(unlock_requirement)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create weapon error:', error);
    res.status(500).json({ error: 'Failed to create weapon' });
  }
});

// Update weapon (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE weapons SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weapon not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update weapon error:', error);
    res.status(500).json({ error: 'Failed to update weapon' });
  }
});

// Delete weapon (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM weapons WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weapon not found' });
    }
    
    res.json({ message: 'Weapon deleted successfully' });
  } catch (error) {
    console.error('Delete weapon error:', error);
    res.status(500).json({ error: 'Failed to delete weapon' });
  }
});

export default router;
