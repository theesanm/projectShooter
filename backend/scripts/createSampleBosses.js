import pool from '../src/config/database.js';

async function createSampleBosses() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating sample bosses...');
    
    // Boss 1: Red Dragon (Main Boss - Wave 1)
    await client.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed,
        scale_min, scale_max, color, defeat_reward, currency_drop
      ) VALUES (
        'red_dragon', 'Red Dragon', 'A fierce dragon that breathes fire', 'flying',
        500, 100, 1.5, 2.0, '#ff0000', 100, 50
      )
    `);
    
    // Boss 2: Ice Giant (Main Boss - Heavy)
    await client.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed,
        scale_min, scale_max, color, defeat_reward, currency_drop
      ) VALUES (
        'ice_giant', 'Ice Giant', 'A massive frozen warrior', 'tank',
        800, 50, 2.0, 2.5, '#00ffff', 150, 75
      )
    `);
    
    // Boss 3: Shadow Assassin (Mini Boss - Fast)
    await client.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed,
        scale_min, scale_max, color, defeat_reward, currency_drop
      ) VALUES (
        'shadow_assassin', 'Shadow Assassin', 'Quick and deadly', 'fast',
        200, 250, 1.0, 1.2, '#000000', 50, 25
      )
    `);
    
    // Boss 4: Lightning Mage (Mini Boss - Ranged)
    await client.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed,
        scale_min, scale_max, color, defeat_reward, currency_drop
      ) VALUES (
        'lightning_mage', 'Lightning Mage', 'Casts powerful lightning spells', 'ranged',
        300, 120, 1.2, 1.5, '#ffff00', 75, 40
      )
    `);
    
    // Boss 5: Demon Lord (Ultimate Boss)
    await client.query(`
      INSERT INTO bosses (
        boss_key, name, description, type, base_health, base_speed,
        scale_min, scale_max, color, defeat_reward, currency_drop
      ) VALUES (
        'demon_lord', 'Demon Lord', 'The ultimate evil', 'boss',
        1500, 80, 2.5, 3.0, '#ff00ff', 500, 250
      )
    `);
    
    await client.query('COMMIT');
    console.log('✅ Successfully created 5 sample bosses!');
    
    // Display created bosses
    const result = await client.query('SELECT id, boss_key, name, type, base_health FROM bosses ORDER BY id');
    console.log('\n📋 Bosses in database:');
    result.rows.forEach(boss => {
      console.log(`  ${boss.id}. ${boss.name} (${boss.type}) - HP: ${boss.base_health}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating bosses:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSampleBosses();
