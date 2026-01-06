import pool from '../src/config/database.js';

async function createWave1() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create Wave 1
    const waveResult = await client.query(`
      INSERT INTO waves (
        wave_number, name, description, duration_ms, 
        enemy_spawn_rate_ms, max_enemies, is_active
      ) VALUES (
        1, 'First Contact', 'The invasion begins...', 60000,
        2000, 10, true
      ) RETURNING id
    `);
    
    const waveId = waveResult.rows[0].id;
    console.log('✅ Wave 1 created with ID:', waveId);
    
    // Get all enemies to add to wave
    const enemiesResult = await client.query(`
      SELECT id, name FROM enemies ORDER BY base_health LIMIT 3
    `);
    
    if (enemiesResult.rows.length === 0) {
      console.log('⚠️  No enemies found. Creating basic enemies...');
      
      // Create basic enemies
      const enemy1 = await client.query(`
        INSERT INTO enemies (
          enemy_key, name, type, base_health, base_speed, base_damage, 
          point_value, currency_drop, scale_min, scale_max
        ) VALUES (
          'basic_scout', 'Basic Scout', 'basic', 10, 150, 5, 
          10, 5, 0.8, 1.0
        ) RETURNING id
      `);
      
      const enemy2 = await client.query(`
        INSERT INTO enemies (
          enemy_key, name, type, base_health, base_speed, base_damage, 
          point_value, currency_drop, scale_min, scale_max
        ) VALUES (
          'fast_runner', 'Fast Runner', 'fast', 8, 250, 3, 
          15, 8, 0.7, 0.9
        ) RETURNING id
      `);
      
      const enemy3 = await client.query(`
        INSERT INTO enemies (
          enemy_key, name, type, base_health, base_speed, base_damage, 
          point_value, currency_drop, scale_min, scale_max
        ) VALUES (
          'heavy_tank', 'Heavy Tank', 'tank', 25, 100, 10, 
          25, 15, 1.2, 1.5
        ) RETURNING id
      `);
      
      console.log('✅ Created 3 basic enemies');
      
      // Create wave settings
      await client.query(`
        INSERT INTO wave_settings (wave_id, powerup_spawn_interval_ms, difficulty_multiplier)
        VALUES ($1, 10000, 1.0)
      `, [waveId]);
      
    } else {
      console.log(`✅ Found ${enemiesResult.rows.length} enemies`);
      
      // Create wave settings
      await client.query(`
        INSERT INTO wave_settings (wave_id, powerup_spawn_interval_ms, difficulty_multiplier)
        VALUES ($1, 10000, 1.0)
      `, [waveId]);
    }
    
    await client.query('COMMIT');
    console.log('🎉 Wave 1 configuration complete!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating wave 1:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createWave1();
