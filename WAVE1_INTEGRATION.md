# Wave 1 Integration - Testing Guide

## ✅ What's Been Integrated

### Backend API
- **Wave Endpoint**: `GET /api/waves/1`
  - Returns wave configuration from database
  - Includes boss sequence and wave settings
  
- **Enemies Endpoint**: `GET /api/enemies`
  - Returns all active enemies
  - 3 enemies created: Basic Scout, Fast Runner, Heavy Tank

### Database
- **Wave 1 Created**:
  - Name: "First Contact"
  - Description: "The invasion begins..."
  - Duration: 60 seconds (60000ms)
  - Spawn Rate: 2000ms (enemy every 2 seconds)
  - Max Enemies: 10
  
- **Wave Settings**:
  - Powerup spawn interval: 10 seconds
  - Difficulty multiplier: 1.0

- **3 Enemies Created**:
  1. **Basic Scout** (basic type)
     - Health: 10
     - Speed: 150
     - Damage: 5
     - Points: 10
     - Currency: 5
     
  2. **Fast Runner** (fast type)
     - Health: 8
     - Speed: 250
     - Damage: 3
     - Points: 15
     - Currency: 8
     
  3. **Heavy Tank** (tank type)
     - Health: 25
     - Speed: 100
     - Damage: 10
     - Points: 25
     - Currency: 15

### Game Integration
- **APIService Updated**:
  - `getWaveConfig(waveNumber)` - Loads wave from backend
  - `getEnemies()` - Loads enemy templates from backend
  - API enabled by default
  
- **WaveManager Updated**:
  - Loads wave configuration from API on startup
  - Falls back to local templates if API unavailable
  - Uses API enemy data for spawning
  
- **Environment**:
  - `.env` file updated with `VITE_API_URL=http://localhost:3001/api`

## 🧪 How to Test

### 1. Ensure Backend is Running
```bash
cd backend
node server.js
```
Should see: "🎮 Kombat Game API Server 🚀 Running on http://localhost:3001"

### 2. Test API Endpoints

**Test Wave 1:**
```bash
curl http://localhost:3001/api/waves/1 | python3 -m json.tool
```

**Test Enemies:**
```bash
curl http://localhost:3001/api/enemies | python3 -m json.tool
```

### 3. Start the Game
```bash
npm run dev
```

### 4. Play Wave 1
1. Open http://localhost:5173 in browser
2. Click "Start Game"
3. **What to Look For**:
   - Console should show: `[WaveManager] Wave config loaded from API`
   - Console should show: `[WaveManager] Enemies loaded from API: 3`
   - Wave notification: "First Contact" (from database)
   - Enemies spawn every 2 seconds
   - Max 10 enemies on screen
   - Wave completes after 60 seconds

### 5. Check Browser Console
Press F12 and look for:
```
[WaveManager] Wave config loaded from API: {name: "First Contact", ...}
[WaveManager] Enemies loaded from API: 3
[WaveManager] Using wave config from API
[WaveManager] Wave 1 (First Contact): 10 enemies, 2000ms interval, 60s duration
```

## 📊 Expected Behavior

### Wave 1 Characteristics
- **Duration**: 60 seconds
- **Enemy Spawn**: Every 2 seconds
- **Max Enemies**: 10 simultaneous
- **Powerups**: Spawn every 10 seconds
- **Enemy Types**: Random mix of 3 types

### Gameplay
1. Wave starts with "First Contact" notification
2. Enemies spawn from top of screen
3. 3 different enemy types appear randomly:
   - Small fast enemies (Fast Runner)
   - Medium enemies (Basic Scout)
   - Large slow enemies (Heavy Tank)
4. After 60 seconds, wave ends
5. Score calculated based on kills

## 🔧 Troubleshooting

### API Connection Failed
**Symptom**: Console shows `[API] Error fetching wave 1`
**Solution**:
1. Check backend is running: `lsof -i :3001`
2. Restart backend: `cd backend && node server.js`
3. Check `.env` has: `VITE_API_URL=http://localhost:3001/api`
4. Restart game dev server

### Wave Uses Old Config
**Symptom**: Wave doesn't match database settings
**Solution**:
1. Hard refresh browser (Cmd+Shift+R on Mac)
2. Check console for API errors
3. Verify wave exists: `curl http://localhost:3001/api/waves/1`

### Enemies Not Spawning
**Symptom**: No enemies appear
**Solution**:
1. Check enemies endpoint: `curl http://localhost:3001/api/enemies`
2. Check console for errors
3. Verify enemies in DB: 
   ```sql
   SELECT * FROM enemies WHERE is_active = true;
   ```

## 🎯 Next Steps

### To Add More Content
1. **Create More Waves**:
   ```bash
   cd backend
   # Edit scripts/createWave1.js to create wave 2
   node scripts/createWave2.js
   ```

2. **Add Bosses**:
   - Create boss entries in database
   - Link bosses to waves via wave_boss_sequence table

3. **Customize Enemies**:
   ```sql
   INSERT INTO enemies (enemy_key, name, type, base_health, base_speed, base_damage, ...)
   VALUES ('new_enemy', 'New Enemy', 'type', 50, 200, 15, ...);
   ```

### Admin Portal
- Use admin portal at http://localhost:5174 to:
  - View all waves
  - Manage enemies
  - Configure wave settings
  - Set boss sequences

## 📝 API Endpoints Reference

### Waves
- `GET /api/waves` - Get all waves
- `GET /api/waves/:waveNumber` - Get specific wave with boss sequence and settings
- `POST /api/waves` - Create new wave (admin auth required)
- `PUT /api/waves/:id` - Update wave (admin auth required)

### Enemies
- `GET /api/enemies` - Get all active enemies
- `GET /api/enemies/:id` - Get specific enemy

### Authentication
- `POST /api/auth/login` - Login (use for admin portal)
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

## 🎮 Testing Checklist

- [ ] Backend server running on port 3001
- [ ] Wave 1 API returns correct data
- [ ] Enemies API returns 3 enemies
- [ ] Game dev server running on port 5173
- [ ] Browser console shows API load messages
- [ ] Wave notification shows "First Contact"
- [ ] Enemies spawn every 2 seconds
- [ ] 3 different enemy types appear
- [ ] Wave ends after 60 seconds
- [ ] No console errors

## 🚀 Success Criteria

Wave 1 integration is successful if:
1. ✅ Game loads wave config from API
2. ✅ Enemy data comes from database
3. ✅ Wave name displays from database ("First Contact")
4. ✅ Spawn timing matches database (2000ms)
5. ✅ Wave duration matches database (60 seconds)
6. ✅ All 3 enemy types spawn correctly
7. ✅ Game plays without errors

---

**Status**: Ready for testing! 🎉

Run the game and verify Wave 1 loads from the database.
