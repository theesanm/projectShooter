# Project Shooter

Wave-based browser shooter game built with Phaser 3 and Vite.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The game will open automatically at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 🎮 Controls

**Desktop (Horizontal Mode - default):**
- **Move Left/Right:** A/D or Left/Right Arrow Keys
- **Shoot:** Space Bar

**Desktop (Full Movement Mode):**
- **Move:** WASD or Arrow Keys (all directions)
- **Shoot:** Space Bar

**Mobile:** (Coming soon)
- Touch controls

## 📁 Project Structure

```
src/
├── main.js                    # Entry point
├── game/
│   ├── config.js             # Phaser configuration
│   ├── scenes/
│   │   ├── BootScene.js      # Initial loading
│   │   ├── MenuScene.js      # Main menu
│   │   └── GameScene.js      # Core gameplay
│   ├── entities/
│   │   ├── Player.js         # Player logic
│   │   ├── Enemy.js          # Enemy logic
│   │   ├── Boss.js           # Boss enemy logic
│   │   └── Powerup.js        # Power-up collectibles
│   ├── systems/
│   │   ├── WaveManager.js    # Wave spawning system
│   │   ├── SoundManager.js   # Audio management system
│   │   ├── ShooterManager.js # Weapon system
│   │   └── ProgressionManager.js # Game progression
│   └── services/
│       └── APIService.js     # Backend API (placeholder)
public/
├── assets/
│   ├── sounds/               # Audio files (MP3/WAV)
│   ├── scenes/               # Background images
│   └── shooters/             # Sprite assets
```

## 🎨 Current Features

✅ Player movement and shooting  
✅ Wave-based enemy spawning  
✅ Collision detection  
✅ Score tracking  
✅ Health system  
✅ Increasing difficulty per wave  
✅ Local high score storage  
✅ Sound effects and music (MP3/WAV support)  
✅ Boss enemies with scaling difficulty  
✅ Player vocal effects on boss defeats  
✅ 2-lane combat system  
✅ Atmospheric background scenes (Wave 1)  
✅ Placeholder graphics (geometric shapes)

## 🔮 Future Features

- [ ] Custom sprite graphics
- [ ] Multiple weapon types
- [ ] Upgrade shop between waves
- [ ] Power-ups and collectibles
- [ ] Additional wave backgrounds
- [ ] Database integration (API ready)
- [ ] Online leaderboards
- [ ] Mobile touch controls
- [ ] Particle effects

## 🗄️ API Integration (Ready for Future Use)

The `APIService` is already set up for future database integration:

```javascript
// In .env file (when backend is ready):
VITE_API_URL=https://your-api.com/api

// Enable API in src/services/APIService.js:
this.enabled = true;
```

Available API methods:
- `saveStats(data)` - Save player stats
- `getLeaderboard(limit)` - Fetch leaderboard
- `saveHighScore(playerName, score, wave)` - Save high score

## ⚙️ Game Configuration

Control game behavior via `.env` file:

**Movement Modes:**
- `VITE_MOVEMENT_MODE=horizontal` (default) - Player locked to bottom, moves left/right only, enemies fall from top
- `VITE_MOVEMENT_MODE=full` - Player can move in all directions, enemies spawn from all sides

To change modes, edit `.env` and restart the dev server.

## 🎯 Gameplay

Survive waves of enemies by shooting them down. Each wave increases in difficulty with more enemies and higher health. Try to beat your high score!

## 🛠️ Tech Stack

- **Phaser 3** - Game engine
- **Vite** - Build tool & dev server
- **JavaScript ES6+** - Programming language

## 📝 Notes

- Currently uses geometric shapes as placeholders
- Replace textures in `entities/*.js` when assets are ready
- Full audio system implemented with MP3/WAV support
- Boss mechanics with scaling difficulty active
- Wave 1 background scene integrated
- API calls are logged to console (not sent to server)
- High scores saved to localStorage

---

Made with ❤️ for browser gaming
