import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all shop items (public)
router.get('/items', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT si.*, 
              CASE 
                WHEN si.item_type = 'weapon' THEN w.name
                WHEN si.item_type = 'skin' THEN ps.name
              END as item_name
       FROM shop_items si
       LEFT JOIN weapons w ON si.item_type = 'weapon' AND si.item_id = w.id
       LEFT JOIN player_skins ps ON si.item_type = 'skin' AND si.item_id = ps.id
       WHERE si.is_active = true
       ORDER BY si.display_order, si.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to get shop items' });
  }
});

// Purchase item
router.post('/purchase', authenticateToken, async (req, res) => {
  const { shop_item_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get shop item
    const shopResult = await client.query(
      'SELECT * FROM shop_items WHERE id = $1 AND is_active = true',
      [shop_item_id]
    );

    if (shopResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Shop item not found' });
    }

    const item = shopResult.rows[0];

    // Get player stats
    const statsResult = await client.query(
      'SELECT * FROM player_stats WHERE user_id = $1',
      [req.user.id]
    );

    if (statsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player stats not found' });
    }

    const stats = statsResult.rows[0];

    // Check if player has enough currency
    if (stats.currency < item.price_currency) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Check if already owned
    const inventoryCheck = await client.query(
      'SELECT * FROM player_inventory WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [req.user.id, item.item_type, item.item_id]
    );

    if (inventoryCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item already owned' });
    }

    // Deduct currency
    await client.query(
      'UPDATE player_stats SET currency = currency - $1 WHERE user_id = $2',
      [item.price_currency, req.user.id]
    );

    // Add to inventory
    await client.query(
      'INSERT INTO player_inventory (user_id, item_type, item_id) VALUES ($1, $2, $3)',
      [req.user.id, item.item_type, item.item_id]
    );

    // Record purchase
    await client.query(
      `INSERT INTO purchase_history (user_id, shop_item_id, item_type, item_id, price_paid_currency)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, shop_item_id, item.item_type, item.item_id, item.price_currency]
    );

    await client.query('COMMIT');
    res.json({ message: 'Purchase successful', remaining_currency: stats.currency - item.price_currency });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  } finally {
    client.release();
  }
});

// Create shop item (admin only)
router.post('/items', authenticateToken, requireAdmin, async (req, res) => {
  const { item_type, item_id, price_currency, display_order, is_featured } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO shop_items (item_type, item_id, price_currency, display_order, is_featured)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [item_type, item_id, price_currency, display_order || 0, is_featured || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create shop item error:', error);
    res.status(500).json({ error: 'Failed to create shop item' });
  }
});

export default router;
