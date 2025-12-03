# Shooter/Character Image Specifications

## Image Requirements

### Dimensions
- **Recommended:** 64x64 pixels
- **High-res option:** 128x128 pixels (will be scaled down)
- **Format:** PNG with transparency
- **Color depth:** 32-bit RGBA

### File Structure
```
assets/
└── shooters/
    ├── basic.png       (64x64 or 128x128)
    ├── advanced.png    (64x64 or 128x128)
    └── elite.png       (64x64 or 128x128)
```

## Design Guidelines

### Visual Style
- **Orientation:** Should face upward (↑) for top-down/vertical shooter
- **Contrast:** Use bright colors that stand out against dark background (#1a1a2e)
- **Silhouette:** Clear, recognizable shape even when small
- **Details:** Keep details simple and readable at small size

### Color Schemes (Suggestions)

**Basic Fighter (Green):**
- Primary: #00ff00 (bright green)
- Secondary: #00aa00 (darker green)
- Accent: #0088ff (blue for cockpit/windows)

**Advanced Fighter (Blue):**
- Primary: #0088ff (bright blue)
- Secondary: #0055cc (darker blue)
- Accent: #ff8800 (orange for engines/details)

**Elite Fighter (Gold/Red):**
- Primary: #ffaa00 (gold)
- Secondary: #ff0000 (red)
- Accent: #ffffff (white highlights)

## Animation Frames (Future Enhancement)

If you want to add animation later:
- **Sprite sheet:** 64x64 per frame, multiple frames horizontally
- **Idle animation:** 2-4 frames
- **Shooting animation:** 2-3 frames
- **Hit/damage animation:** 2-3 frames

Example sprite sheet layout (256x64):
```
[Frame 1] [Frame 2] [Frame 3] [Frame 4]
  Idle      Idle      Shoot     Shoot
```

## Current Placeholder

The game currently uses a programmatically generated 64x64 triangle sprite:
- Green triangle pointing upward
- Blue circle for cockpit
- Simple geometric design

## Implementation

Once you have your images ready:

1. Place PNG files in: `assets/shooters/`
2. The game will automatically load them from the paths defined in `ShooterManager.js`
3. No code changes needed - just replace the placeholder files

## Stats Per Shooter

Each shooter has different stats defined in `ShooterManager.js`:

### Basic Fighter
- Health: 100
- Speed: 200
- Fire Rate: 500ms
- Damage: 25
- Bullet Speed: 400

### Advanced Fighter  
- Health: 120
- Speed: 220
- Fire Rate: 350ms
- Damage: 35
- Bullet Speed: 450

### Elite Fighter
- Health: 150
- Speed: 250
- Fire Rate: 250ms
- Damage: 50
- Bullet Speed: 500

## Tools for Creating Sprites

### Free Options:
- **Pixilart** (https://www.pixilart.com/) - Browser-based pixel art editor
- **Piskel** (https://www.piskelapp.com/) - Free sprite editor
- **Aseprite** ($) - Professional pixel art tool
- **GIMP** - Free image editor

### Tips:
1. Start with a 128x128 canvas for easier drawing
2. Use a grid overlay (8x8 or 16x16)
3. Keep the background transparent
4. Export as PNG
5. Test in-game to see how it looks when scaled

## Database Schema (Future)

When connecting to backend API, shooter data will be stored as:

```json
{
  "user_id": "uuid",
  "current_shooter": "basic",
  "unlocked_shooters": ["basic", "advanced"],
  "progression": {
    "currency": 1250,
    "total_score": 5000,
    "games_played": 12,
    "highest_wave": 8
  },
  "upgrades": {
    "healthBoost": 2,
    "speedBoost": 1,
    "damageBoost": 0,
    "fireRateBoost": 1
  }
}
```

---

**Current Status:** Using 64x64 placeholder graphics until custom sprites are created.
