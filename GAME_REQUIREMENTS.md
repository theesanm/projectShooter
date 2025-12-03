# Game Requirements - Wave-Based Shooter

## Core Game Structure
- **Wave 1 Duration**: 3 minutes (180 seconds)
- **Power-up Phase**: First 15 seconds (until first boss spawns)
- **Boss Phase**: 15 seconds to 2.5 minutes (bosses spawn every 10 seconds)
- **Final Phase**: Last 30 seconds (purple boss spawns at 2.5 minutes)
- **Player Movement**: 2 lanes (left/right) with appropriate enemy spawning

## Enemy Mechanics
- **Regular Enemies**: 1 hit to kill
- **Spawn Pattern**: Continues throughout wave after first boss spawns

## Power-up System
- **No Power-ups After First Boss**: Power-ups stop spawning once the first boss appears
- **Red Potion**: Doubles amount of fire (increases bullet streams)
- **Yellow Potion**: Doubles speed of fire (increases fire rate)

## Boss System
- **Single Boss Active**: Only 1 boss at a time alongside normal enemies
- **Red Boss**:
  - Health doubles every spawn (100 → 200 → 400 → 800 → etc.)
  - Spawns every 10 seconds after the first boss (alternating with pink bosses)
  - Size: Starts at 1.5x scale, grows to 2.5x scale
  - Speed: 50-15 px/s (faster, based on health)
- **Pink Boss**:
  - Spawns every 10 seconds after the first boss (alternating with red bosses)
  - Health proportional to player's current damage at spawn time
  - Health = player_damage × 100
  - Size: Starts at 1.5x scale, grows to 2.5x scale (same as red bosses)
  - Speed: 25-15 px/s (slower than red bosses, based on health)
- **Purple Boss** (Final Boss):
  - Spawns at 2.5 minutes (150 seconds) into the wave
  - Health = pink boss health × 1.5
  - Size: Same as other bosses (1.5x to 2.5x scale)
  - Speed: 15-10 px/s (slowest of all bosses)
  - Special Ability: Moves between lanes every 2 seconds
  - Wave ends when purple boss is defeated

## Boss Speed Scaling
- Boss speed determined by health at spawn time
- Higher health = slower speed
- Speed remains constant throughout boss fight
- Speed range: ~50 px/s (low health) to ~15 px/s (max health)

## Lane System
- **2 Lanes**: Left and right lanes for player movement
- **Appropriate Spawning**: Enemies and bosses spawn in lanes that match player positioning
- **Player Switching**: Smooth lane switching between left and right

## Game Balance
- First boss must be beatable for new players
- Progressive difficulty with boss health scaling
- Power-ups provide meaningful upgrades
- Boss speed compensation for increased difficulty

## Technical Notes
- Phaser.js game engine
- HTML5 Canvas rendering
- Touch and keyboard controls
- Local storage for progression
- API integration for stats (optional)