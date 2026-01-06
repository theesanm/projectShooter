import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all waves
router.get('/', optionalAuth, async (req, res) => {
  try {
    const wavesResult = await pool.query(
      'SELECT * FROM waves WHERE is_active = true ORDER BY wave_number'
    );
    
    // Load boss sequences and settings for each wave
    const wavesWithDetails = await Promise.all(wavesResult.rows.map(async (wave) => {
      // Get boss sequence with calculated stats
      const bossResult = await pool.query(
        `SELECT 
          wbs.*,
          b.name as boss_name, 
          b.type,
          b.base_health,
          b.base_damage,
          b.base_speed,
          b.image,
          ROUND(b.base_health * wbs.health_multiplier) as calculated_health,
          ROUND(b.base_damage * wbs.damage_multiplier) as calculated_damage,
          ROUND(b.base_speed * wbs.speed_multiplier) as calculated_speed
         FROM wave_boss_sequence wbs
         JOIN bosses b ON wbs.boss_id = b.id
         WHERE wbs.wave_id = $1
         ORDER BY wbs.sequence_order`,
        [wave.id]
      );
      
      // Get wave settings
      const settingsResult = await pool.query(
        'SELECT * FROM wave_settings WHERE wave_id = $1',
        [wave.id]
      );
      
      return {
        ...wave,
        bossSequence: bossResult.rows,
        settings: settingsResult.rows[0] || {}
      };
    }));
    
    res.json(wavesWithDetails);
  } catch (error) {
    console.error('Get waves error:', error);
    res.status(500).json({ error: 'Failed to get waves' });
  }
});

// Get wave by number (for game)
router.get('/:waveNumber', async (req, res) => {
  try {
    const waveResult = await pool.query(
      'SELECT * FROM waves WHERE wave_number = $1 AND is_active = true',
      [req.params.waveNumber]
    );

    if (waveResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wave not found' });
    }

    const wave = waveResult.rows[0];

    // Get boss sequence with calculated stats
    const bossResult = await pool.query(
      `SELECT 
        wbs.*,
        b.boss_key,
        b.name as boss_name,
        b.type,
        b.base_health,
        b.base_damage,
        b.base_speed,
        b.image,
        b.scale_min,
        b.scale_max,
        b.color,
        ROUND(b.base_health * wbs.health_multiplier) as calculated_health,
        ROUND(b.base_damage * wbs.damage_multiplier) as calculated_damage,
        ROUND(b.base_speed * wbs.speed_multiplier) as calculated_speed
       FROM wave_boss_sequence wbs
       JOIN bosses b ON wbs.boss_id = b.id
       WHERE wbs.wave_id = $1
       ORDER BY wbs.sequence_order`,
      [wave.id]
    );

    // Get wave settings
    const settingsResult = await pool.query(
      'SELECT * FROM wave_settings WHERE wave_id = $1',
      [wave.id]
    );

    res.json({
      ...wave,
      bossSequence: bossResult.rows,
      settings: settingsResult.rows[0] || {}
    });
  } catch (error) {
    console.error('Get wave error:', error);
    res.status(500).json({ error: 'Failed to get wave' });
  }
});

// Create wave (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const {
    wave_number, name, description, scene_id,
    duration_ms, enemy_spawn_rate_ms, max_enemies,
    bossSequence, settings
  } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create wave
    const waveResult = await client.query(
      `INSERT INTO waves (
        wave_number, name, description, scene_id,
        duration_ms, enemy_spawn_rate_ms, max_enemies, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [wave_number, name, description, scene_id,
       duration_ms, enemy_spawn_rate_ms, max_enemies, req.user.id]
    );
    
    const wave = waveResult.rows[0];
    
    // Create boss sequence if provided
    if (bossSequence && bossSequence.length > 0) {
      for (const boss of bossSequence) {
        await client.query(
          `INSERT INTO wave_boss_sequence (
            wave_id, boss_id, spawn_time_ms, is_main_boss, sequence_order,
            health_multiplier, damage_multiplier, speed_multiplier
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            wave.id, 
            boss.boss_id, 
            boss.spawn_time_ms, 
            boss.is_main_boss, 
            boss.sequence_order,
            boss.health_multiplier || 1.0,
            boss.damage_multiplier || 1.0,
            boss.speed_multiplier || 1.0
          ]
        );
      }
    }
    
    // Create wave settings if provided
    if (settings) {
      await client.query(
        `INSERT INTO wave_settings (
          wave_id, powerup_spawn_interval_ms, difficulty_multiplier
        ) VALUES ($1, $2, $3)`,
        [wave.id, settings.powerup_spawn_interval_ms || 10000, settings.difficulty_multiplier || 1.0]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(wave);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create wave error:', error);
    res.status(500).json({ error: 'Failed to create wave' });
  } finally {
    client.release();
  }
});

// Update wave (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    wave_number, name, description, scene_id,
    duration_ms, enemy_spawn_rate_ms, max_enemies,
    bossSequence, settings
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update wave
    const waveResult = await client.query(
      `UPDATE waves SET
        wave_number = COALESCE($1, wave_number),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        scene_id = COALESCE($4, scene_id),
        duration_ms = COALESCE($5, duration_ms),
        enemy_spawn_rate_ms = COALESCE($6, enemy_spawn_rate_ms),
        max_enemies = COALESCE($7, max_enemies),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [wave_number, name, description, scene_id,
       duration_ms, enemy_spawn_rate_ms, max_enemies, id]
    );
    
    if (waveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Wave not found' });
    }
    
    // Update boss sequence if provided
    if (bossSequence) {
      // Delete existing sequence
      await client.query('DELETE FROM wave_boss_sequence WHERE wave_id = $1', [id]);
      
      // Insert new sequence
      for (const boss of bossSequence) {
        await client.query(
          `INSERT INTO wave_boss_sequence (
            wave_id, boss_id, spawn_time_ms, is_main_boss, sequence_order,
            health_multiplier, damage_multiplier, speed_multiplier
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id, 
            boss.boss_id, 
            boss.spawn_time_ms, 
            boss.is_main_boss, 
            boss.sequence_order,
            boss.health_multiplier || 1.0,
            boss.damage_multiplier || 1.0,
            boss.speed_multiplier || 1.0
          ]
        );
      }
    }
    
    // Update wave settings if provided
    if (settings) {
      await client.query(
        `INSERT INTO wave_settings (
          wave_id, powerup_spawn_interval_ms, difficulty_multiplier
        ) VALUES ($1, $2, $3)
        ON CONFLICT (wave_id) DO UPDATE SET
          powerup_spawn_interval_ms = EXCLUDED.powerup_spawn_interval_ms,
          difficulty_multiplier = EXCLUDED.difficulty_multiplier,
          updated_at = CURRENT_TIMESTAMP`,
        [id, settings.powerup_spawn_interval_ms, settings.difficulty_multiplier]
      );
    }
    
    await client.query('COMMIT');
    res.json(waveResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update wave error:', error);
    res.status(500).json({ error: 'Failed to update wave' });
  } finally {
    client.release();
  }
});

// Get enemy pool for a wave
router.get('/:waveNumber/enemies', async (req, res) => {
  try {
    const waveResult = await pool.query(
      'SELECT id FROM waves WHERE wave_number = $1',
      [req.params.waveNumber]
    );

    if (waveResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wave not found' });
    }

    const result = await pool.query(`
      SELECT 
        wep.*,
        e.enemy_key, e.name as enemy_name, e.type, e.base_health, 
        e.base_speed, e.base_damage, e.image, e.color,
        ROUND(e.base_health * wep.health_multiplier) as calculated_health,
        ROUND(e.base_speed * wep.speed_multiplier) as calculated_speed,
        ROUND(e.base_damage * wep.damage_multiplier) as calculated_damage
      FROM wave_enemy_pool wep
      JOIN enemies e ON wep.enemy_id = e.id
      WHERE wep.wave_id = $1 AND wep.is_active = true
      ORDER BY wep.spawn_weight DESC
    `, [waveResult.rows[0].id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get wave enemies error:', error);
    res.status(500).json({ error: 'Failed to get wave enemies' });
  }
});

// Update enemy pool for a wave (admin only)
router.post('/:waveNumber/enemies', authenticateToken, requireAdmin, async (req, res) => {
  const { enemyPool } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const waveResult = await client.query(
      'SELECT id FROM waves WHERE wave_number = $1',
      [req.params.waveNumber]
    );

    if (waveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Wave not found' });
    }

    const waveId = waveResult.rows[0].id;

    // Delete existing enemy pool
    await client.query('DELETE FROM wave_enemy_pool WHERE wave_id = $1', [waveId]);

    // Insert new enemy pool
    if (enemyPool && enemyPool.length > 0) {
      for (const enemy of enemyPool) {
        await client.query(`
          INSERT INTO wave_enemy_pool (
            wave_id, enemy_id, spawn_weight, min_spawn_time_ms, max_spawn_time_ms,
            health_multiplier, speed_multiplier, damage_multiplier
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          waveId,
          enemy.enemy_id,
          enemy.spawn_weight || 100,
          enemy.min_spawn_time_ms || 0,
          enemy.max_spawn_time_ms,
          enemy.health_multiplier || 1.0,
          enemy.speed_multiplier || 1.0,
          enemy.damage_multiplier || 1.0
        ]);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Enemy pool updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update enemy pool error:', error);
    res.status(500).json({ error: 'Failed to update enemy pool' });
  } finally {
    client.release();
  }
});

// Get powerup pool for a wave
router.get('/:waveNumber/powerups', async (req, res) => {
  try {
    const waveResult = await pool.query(
      'SELECT id FROM waves WHERE wave_number = $1',
      [req.params.waveNumber]
    );

    if (waveResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wave not found' });
    }

    const result = await pool.query(`
      SELECT 
        wpp.*,
        p.powerup_key, p.name as powerup_name, p.type, p.effect,
        p.duration_ms, p.rarity, p.image
      FROM wave_powerup_pool wpp
      JOIN powerups p ON wpp.powerup_id = p.id
      WHERE wpp.wave_id = $1 AND wpp.is_active = true
      ORDER BY p.rarity, p.name
    `, [waveResult.rows[0].id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get wave powerups error:', error);
    res.status(500).json({ error: 'Failed to get wave powerups' });
  }
});

// Update powerup pool for a wave (admin only)
router.post('/:waveNumber/powerups', authenticateToken, requireAdmin, async (req, res) => {
  const { powerupPool } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const waveResult = await client.query(
      'SELECT id FROM waves WHERE wave_number = $1',
      [req.params.waveNumber]
    );

    if (waveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Wave not found' });
    }

    const waveId = waveResult.rows[0].id;

    // Delete existing powerup pool
    await client.query('DELETE FROM wave_powerup_pool WHERE wave_id = $1', [waveId]);

    // Insert new powerup pool
    if (powerupPool && powerupPool.length > 0) {
      for (const powerup of powerupPool) {
        await client.query(`
          INSERT INTO wave_powerup_pool (
            wave_id, powerup_id, drop_chance, min_spawn_time_ms, max_spawn_time_ms
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          waveId,
          powerup.powerup_id,
          powerup.drop_chance || 10.0,
          powerup.min_spawn_time_ms || 0,
          powerup.max_spawn_time_ms
        ]);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Powerup pool updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update powerup pool error:', error);
    res.status(500).json({ error: 'Failed to update powerup pool' });
  } finally {
    client.release();
  }
});

export default router;
