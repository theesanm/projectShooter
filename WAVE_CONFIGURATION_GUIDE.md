# Wave Configuration Guide

## 🎯 Wave Editor Features

The Wave Editor allows you to configure all aspects of your game waves including:

### 1. **Wave Duration & Timing**
- **Wave Duration (ms)**: Total length of the wave in milliseconds
  - Example: 60000ms = 1 minute wave
  - Example: 180000ms = 3 minute wave
  
- **Enemy Spawn Rate (ms)**: How often enemies spawn
  - Example: 2000ms = Enemy spawns every 2 seconds
  - Example: 500ms = Very fast spawning (harder waves)
  
- **Max Enemies**: Maximum number of enemies on screen simultaneously
  - Example: 10 = Up to 10 enemies at once
  - Higher = More chaotic, lower = More strategic

### 2. **Boss Sequences**

Configure multiple bosses per wave with precise spawn timing:

**Boss Types:**
- **Main Boss**: The wave's primary boss (typically 1 per wave)
- **Mini Boss**: Supporting bosses that add difficulty

**Available Bosses:**
1. **Red Dragon** (flying, 500 HP) - Main boss, fire breather
2. **Ice Giant** (tank, 800 HP) - Slow but very tanky
3. **Shadow Assassin** (fast, 200 HP) - Quick mini boss
4. **Lightning Mage** (ranged, 300 HP) - Casts lightning
5. **Demon Lord** (boss, 1500 HP) - Ultimate challenge

**Boss Spawn Timing:**
- Spawn Time in milliseconds from wave start
- Example: 15000ms = Boss spawns 15 seconds into wave
- Example: 45000ms = Boss spawns 45 seconds into wave

**Boss Sequencing:**
- Order matters! Use up/down arrows to reorder
- Multiple bosses can spawn at different times
- Mix main bosses and mini bosses for variety

### 3. **Powerup Settings**

**Powerup Spawn Interval:**
- How often power-up items appear
- Example: 10000ms = Power-up every 10 seconds
- Lower = More power-ups, easier wave
- Higher = Fewer power-ups, harder wave

### 4. **Difficulty Multiplier**

Global difficulty scaling for the wave:
- **1.0** = Normal difficulty
- **1.5** = 50% harder (more enemy health/damage)
- **2.0** = Double difficulty
- **0.8** = 20% easier

---

## 📋 Wave Configuration Examples

### Easy Wave (Beginner)
```
Wave Number: 1
Name: "Tutorial Wave"
Duration: 60000ms (1 minute)
Enemy Spawn Rate: 3000ms (every 3 seconds)
Max Enemies: 5
Powerup Interval: 8000ms (every 8 seconds)
Difficulty: 0.8 (20% easier)

Bosses:
- Shadow Assassin at 30000ms (30s) - Mini Boss
```

### Medium Wave (Standard)
```
Wave Number: 2
Name: "First Contact"
Duration: 90000ms (1.5 minutes)
Enemy Spawn Rate: 2000ms (every 2 seconds)
Max Enemies: 10
Powerup Interval: 10000ms (every 10 seconds)
Difficulty: 1.0 (normal)

Bosses:
- Lightning Mage at 20000ms (20s) - Mini Boss
- Red Dragon at 60000ms (60s) - Main Boss
```

### Hard Wave (Challenge)
```
Wave Number: 3
Name: "Dragon's Fury"
Duration: 120000ms (2 minutes)
Enemy Spawn Rate: 1500ms (every 1.5 seconds)
Max Enemies: 15
Powerup Interval: 15000ms (every 15 seconds)
Difficulty: 1.5 (50% harder)

Bosses:
- Shadow Assassin at 15000ms (15s) - Mini Boss
- Lightning Mage at 30000ms (30s) - Mini Boss
- Ice Giant at 60000ms (60s) - Main Boss
- Red Dragon at 90000ms (90s) - Main Boss
```

### Boss Rush (Expert)
```
Wave Number: 5
Name: "Boss Gauntlet"
Duration: 180000ms (3 minutes)
Enemy Spawn Rate: 2500ms (every 2.5 seconds)
Max Enemies: 8
Powerup Interval: 12000ms (every 12 seconds)
Difficulty: 2.0 (double difficulty)

Bosses:
- Shadow Assassin at 10000ms (10s) - Mini Boss
- Lightning Mage at 30000ms (30s) - Mini Boss
- Red Dragon at 60000ms (60s) - Main Boss
- Ice Giant at 100000ms (100s) - Main Boss
- Demon Lord at 150000ms (150s) - Main Boss
```

---

## 🎮 How to Use the Wave Editor

### Access the Editor:
1. Login to Admin Portal: http://localhost:5174
2. Click "Wave Editor" in the sidebar
3. You'll see the wave configuration interface

### Create a New Wave:
1. Click "New" button in the wave list
2. Fill in wave details:
   - Wave Number (1, 2, 3, etc.)
   - Name (e.g., "First Contact")
   - Description (e.g., "The invasion begins...")
3. Set timing:
   - Wave Duration
   - Enemy Spawn Rate
   - Max Enemies on Screen
4. Add bosses (optional):
   - Click "Add Boss"
   - Select boss from dropdown
   - Set spawn time (when boss appears)
   - Choose type (Main Boss or Mini Boss)
   - Click "Add Boss"
5. Configure powerups:
   - Set spawn interval
   - Set difficulty multiplier
6. Click "Save Wave"

### Edit Existing Wave:
1. Click on wave in the left sidebar
2. Modify any settings
3. Reorder bosses using up/down arrows
4. Remove bosses with delete button
5. Click "Save Wave"

---

## 🎯 Boss Stats Per Wave

Bosses can have different stats depending on the wave. The system uses the **Difficulty Multiplier** to scale boss stats:

**Base Stats:**
- Red Dragon: 500 HP, 100 speed
- Ice Giant: 800 HP, 50 speed
- Shadow Assassin: 200 HP, 250 speed
- Lightning Mage: 300 HP, 120 speed
- Demon Lord: 1500 HP, 80 speed

**With Difficulty Multiplier 1.5:**
- Red Dragon: 750 HP, 100 speed
- Ice Giant: 1200 HP, 50 speed
- Shadow Assassin: 300 HP, 250 speed
- Lightning Mage: 450 HP, 120 speed
- Demon Lord: 2250 HP, 80 speed

---

## 💡 Tips for Wave Design

### Pacing:
- Start with fewer enemies, increase spawn rate as wave progresses
- Space out boss spawns (20-30 seconds apart minimum)
- Give players breathing room between intense sections

### Difficulty Curve:
- Wave 1-3: Tutorial/Easy (multiplier 0.8-1.0)
- Wave 4-6: Medium (multiplier 1.0-1.2)
- Wave 7-9: Hard (multiplier 1.2-1.6)
- Wave 10+: Expert (multiplier 1.6-2.5)

### Boss Placement:
- **Early Wave (0-30%)**: Mini boss to establish threat
- **Mid Wave (40-60%)**: Main boss as climax
- **Late Wave (80-90%)**: Final boss rush

### Enemy Density:
- Low density (max 5-8): Strategic, skill-based
- Medium density (max 10-12): Balanced challenge
- High density (max 15-20): Chaotic, bullet hell style

### Powerup Balance:
- More frequent powerups (8-10s) for harder waves
- Less frequent (15-20s) for easier waves
- Match powerup frequency to difficulty

---

## 🔧 Testing Your Waves

After creating a wave:

1. **Save the wave** in admin portal
2. **Restart backend server** (if needed)
3. **Load the game**: http://localhost:3000
4. **Play your wave** and observe:
   - Is spawn rate too fast/slow?
   - Are bosses appearing at good times?
   - Is difficulty appropriate?
   - Are powerups helping enough?

5. **Iterate**: Go back to Wave Editor and adjust

---

## 📊 Current Wave Setup

**Wave 1: "First Contact"** ✅ Created
- Duration: 60 seconds
- Spawn Rate: Every 2 seconds
- Max Enemies: 10
- Powerups: Every 10 seconds
- Difficulty: 1.0
- Bosses: None yet (add via Wave Editor!)

---

## 🚀 Next Steps

1. **Open Admin Portal**: http://localhost:5174
2. **Navigate to Wave Editor**
3. **Edit Wave 1** to add bosses:
   - Add Shadow Assassin at 15s (mini boss)
   - Add Red Dragon at 45s (main boss)
4. **Save and test** in game
5. **Create Wave 2** with more challenge!

The Wave Editor gives you complete control over game balance and difficulty progression!
