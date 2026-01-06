import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncWeapons() {
  console.log('📦 Syncing weapons from templates...');
  
  const weaponsPath = path.join(__dirname, '../../config/weapons/weaponTemplates.json');
  const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));

  for (const [key, weapon] of Object.entries(weaponsData.weapons)) {
    try {
      await pool.query(
        `INSERT INTO weapons (
          weapon_key, name, description, tier, damage, fire_rate,
          projectile_speed, projectile_size, pierce_count, spread_angle,
          projectile_count, reload_time, ammo_capacity, special_effects,
          image, projectile_image, sound, unlock_requirement
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (weapon_key) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          tier = EXCLUDED.tier,
          damage = EXCLUDED.damage,
          fire_rate = EXCLUDED.fire_rate,
          projectile_speed = EXCLUDED.projectile_speed,
          projectile_size = EXCLUDED.projectile_size,
          pierce_count = EXCLUDED.pierce_count,
          spread_angle = EXCLUDED.spread_angle,
          projectile_count = EXCLUDED.projectile_count,
          reload_time = EXCLUDED.reload_time,
          ammo_capacity = EXCLUDED.ammo_capacity,
          special_effects = EXCLUDED.special_effects,
          image = EXCLUDED.image,
          projectile_image = EXCLUDED.projectile_image,
          sound = EXCLUDED.sound,
          unlock_requirement = EXCLUDED.unlock_requirement`,
        [
          key, weapon.name, weapon.description, weapon.tier, weapon.damage, weapon.fireRate,
          weapon.projectileSpeed, weapon.projectileSize, weapon.pierceCount, weapon.spreadAngle,
          weapon.projectileCount, weapon.reloadTime, weapon.ammoCapacity, JSON.stringify(weapon.specialEffects),
          weapon.image, weapon.projectileImage, weapon.sound, JSON.stringify(weapon.unlockRequirement)
        ]
      );
      console.log(`  ✅ ${weapon.name}`);
    } catch (error) {
      console.error(`  ❌ ${weapon.name}:`, error.message);
    }
  }
}

async function syncSkins() {
  console.log('\n🎨 Syncing skins from templates...');
  
  const skinsPath = path.join(__dirname, '../../config/skins/skinTemplates.json');
  const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

  for (const [key, skin] of Object.entries(skinsData.skins)) {
    try {
      await pool.query(
        `INSERT INTO player_skins (
          skin_key, name, description, rarity, image, animated,
          special_effects, unlock_requirement
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (skin_key) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          rarity = EXCLUDED.rarity,
          image = EXCLUDED.image,
          animated = EXCLUDED.animated,
          special_effects = EXCLUDED.special_effects,
          unlock_requirement = EXCLUDED.unlock_requirement`,
        [
          key, skin.name, skin.description, skin.rarity, skin.image, skin.animated,
          JSON.stringify(skin.specialEffects), JSON.stringify(skin.unlockRequirement)
        ]
      );
      console.log(`  ✅ ${skin.name}`);
    } catch (error) {
      console.error(`  ❌ ${skin.name}:`, error.message);
    }
  }
}

async function syncShopItems() {
  console.log('\n🛒 Creating shop items...');
  
  const weaponsPath = path.join(__dirname, '../../config/weapons/weaponTemplates.json');
  const skinsPath = path.join(__dirname, '../../config/skins/skinTemplates.json');
  
  const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));
  const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

  let order = 0;

  // Add weapons to shop
  for (const [key, weapon] of Object.entries(weaponsData.weapons)) {
    if (weapon.shopPrice > 0) {
      try {
        const weaponResult = await pool.query('SELECT id FROM weapons WHERE weapon_key = $1', [key]);
        if (weaponResult.rows.length > 0) {
          await pool.query(
            `INSERT INTO shop_items (item_type, item_id, price_currency, display_order)
             VALUES ('weapon', $1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [weaponResult.rows[0].id, weapon.shopPrice, order++]
          );
          console.log(`  ✅ ${weapon.name} - ${weapon.shopPrice} coins`);
        }
      } catch (error) {
        console.error(`  ❌ ${weapon.name}:`, error.message);
      }
    }
  }

  // Add skins to shop
  for (const [key, skin] of Object.entries(skinsData.skins)) {
    if (skin.shopPrice > 0) {
      try {
        const skinResult = await pool.query('SELECT id FROM player_skins WHERE skin_key = $1', [key]);
        if (skinResult.rows.length > 0) {
          await pool.query(
            `INSERT INTO shop_items (item_type, item_id, price_currency, display_order, is_featured)
             VALUES ('skin', $1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [skinResult.rows[0].id, skin.shopPrice, order++, skin.rarity === 'legendary' || skin.rarity === 'mythic']
          );
          console.log(`  ✅ ${skin.name} - ${skin.shopPrice} coins`);
        }
      } catch (error) {
        console.error(`  ❌ ${skin.name}:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('\n🔄 Starting template sync...\n');
  
  try {
    await syncWeapons();
    await syncSkins();
    await syncShopItems();
    
    console.log('\n✅ Template sync completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Template sync failed:', error);
  } finally {
    await pool.end();
  }
}

main();
