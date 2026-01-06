import bcrypt from 'bcrypt';
import pool from '../src/config/database.js';

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123'; // Change this!
  const email = 'admin@kombat.com';

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, 'admin') 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $3, role = 'admin'
       RETURNING id, username, email, role`,
      [username, email, passwordHash]
    );

    console.log('✅ Admin user created/updated:');
    console.log(result.rows[0]);
    console.log(`\n📝 Login credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Change the password after first login!`);

    // Create player stats
    await pool.query(
      `INSERT INTO player_stats (user_id, currency) 
       VALUES ($1, 100000) 
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id]
    );

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
