# Multi-Hit Enemy System

## Overview
Enemies now spawn with varying hit points (1-4 hits required to destroy) and multiple enemies can spawn in the same lane after 20 seconds of gameplay. Multi-hit enemies visually display their hit count by showing multiple enemy graphics arranged in formations (2=side-by-side, 3=triangle, 4=square), with sprites disappearing one-by-one as the enemy takes damage.

## Features Implemented

### 1. Variable Hit Points (1-4 hits)
- Each enemy spawns with a random number of hit points (1-4 hits to destroy)
- Multi-hit enemies display multiple enemy graphics showing remaining hits
- Sprites disappear one-by-one as enemy takes damage
- Enemies worth more points based on hit points (10 × hit points)

### 2. Multi-Enemy Lane Spawning
- **Timing**: Enabled after 20 seconds of wave start
- **Frequency**: Every 5 seconds after the 20-second mark
- **Count**: 2-4 enemies spawn in the same lane
- **Spacing**: 40px vertical spacing between enemies for clarity
- **Independence**: Does NOT interfere with boss spawning or behavior

### 3. Visual Feedback
- **Visual Sprites**: Multiple enemy graphics arranged in formations (2=sides, 3=triangle, 4=square)
- **Hit Removal**: One sprite disappears per hit taken
- **Hit Flash**: Remaining sprites flash red when enemy is damaged
- **Position Updates**: Visual sprites follow enemy as it moves down the lane

## Implementation Details

### Enemy.js Changes
```javascript
constructor(scene, x, y, type = 'basic', hitPoints = 1)
```
- Added `hitPoints` parameter (default 1 for backward compatibility)
- Tracks `currentHits` for damage system
- Creates visual sprite copies for multi-hit enemies (hitPoints > 1)
- `createVisualSprites()` arranges sprites in formations (2=side-by-side, 3=triangle, 4=square)
- `takeDamage()` removes one visual sprite per hit and flashes remaining ones
- `updateHitTextPosition()` repositions visual sprites to follow main sprite
- `destroy()` properly cleans up all visual sprites and main sprite

### WaveManager.js Changes
- **New Properties**:
  - `multiEnemySpawnEnabled`: Activates after 20 seconds
  - `lastMultiSpawnTime`: Tracks multi-spawn timing
  - `multiSpawnInterval`: 5000ms between multi-spawns
  
- **New Method**: `spawnMultipleEnemies()`
  - Spawns 2-4 enemies in random lane
  - Each enemy gets random hit points (1-4)
  - Vertical spacing prevents overlap

- **Modified Methods**:
  - `spawnEnemy()`: Creates Enemy instances with random hit points
  - `update()`: Enables multi-spawn at 20s, updates hit text positions
  - `startWave()`: Resets multi-spawn tracking

### GameScene.js Changes
- **hitEnemy() Method**:
  - Checks for `enemy.enemyRef` to detect multi-hit enemies
  - Calls `takeDamage()` for multi-hit enemies
  - Only destroys enemy when `currentHits` reaches 0
  - Provides visual feedback (red flash) on each hit
  - Awards points based on hit count (10 × hitPoints)

## Boss Protection
Multi-enemy spawning is disabled when:
1. Purple boss is active (`purpleBossActive` flag)
2. Game is over
3. Enemy spawn limit reached

This ensures boss mechanics remain unaffected and maintain proper difficulty scaling.

## Testing Checklist
- [ ] Single-hit enemies (1) spawn normally (no visual sprites)
- [ ] 2-hit enemies spawn with 2 sprites side-by-side
- [ ] 3-hit enemies spawn with 3 sprites in triangle formation
- [ ] 4-hit enemies spawn with 4 sprites in square formation
- [ ] Visual sprites disappear one-by-one when enemy is hit
- [ ] Remaining visual sprites flash red when enemy takes damage
- [ ] Visual sprites follow enemy movement down the lane
- [ ] Multi-enemy spawning starts at 20 seconds
- [ ] 2-4 enemies spawn in same lane every 5 seconds after 20s
- [ ] Boss spawning still works correctly at 15s, alternating normal/pink
- [ ] Purple boss still triggers at 2.5 minutes
- [ ] No multi-spawn during purple boss fight
- [ ] Points awarded correctly (10 × hit points)

## Performance Notes
- Enemy instances manage their own visual sprite arrays
- Visual sprites are smaller scale (0.06) and lower depth (50) than main sprite
- Sprite cleanup handled in Enemy.destroy()
- No memory leaks from orphaned visual sprites
- Efficient hit tracking using simple counter system
- Visual sprites positioned relative to main collision sprite
