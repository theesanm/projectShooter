# Wave 1 Scene Background Image Specifications

## Overview
Wave 1 scene background for the ground-based wave shooter game. This will be the visual backdrop that sets the atmosphere for the first wave of combat.

## Image Specifications

### Dimensions & Format
- **Dimensions**: 405x720 pixels (matches game canvas: 9:16 aspect ratio for mobile)
- **Format**: PNG with transparency support
- **Color Depth**: 32-bit RGBA
- **File Size**: Under 500KB recommended for web performance

### Game Integration
- **Placement**: Background layer behind all game entities
- **Positioning**: Centered, non-scrolling background
- **Layering**: Behind player, enemies, bosses, and UI elements
- **Lane System**: Must accommodate 2-lane gameplay (30% and 70% screen positions)

## Lane System Integration

### Lane Positions
- **Left Lane**: 30% of screen width (x = width * 0.3)
- **Right Lane**: 70% of screen width (x = width * 0.7)
- **Lane Width**: Approximately 40% of screen width each
- **Movement**: Players can switch between lanes horizontally

### Visual Lane Design
The background must support and enhance the 2-lane combat system:

#### Lane Pathways
- **Clear Lane Definition**: Visual pathways or corridors at 30% and 70% positions
- **Ground Terrain**: Distinct ground areas for each lane
- **Environmental Flow**: Elements that guide the eye to lane positions

#### Combat Arena Layout
- **Fighting Platforms**: Elevated or defined combat areas at lane positions
- **Cover Elements**: Ruins, pillars, or structures that players can use tactically
- **Enemy Approach Routes**: Visual paths showing how enemies approach each lane

## Visual Style & Theme

### Setting: "Dragon's Awakening"
Based on the wave name "Dragon's Awakening", create a mystical/fantasy battlefield setting that transitions from peaceful to ominous.

### Color Palette
- **Primary Background**: Dark blue-purple (#1a1a2e - matches current game background)
- **Atmospheric Elements**: Deep blues, purples, and mystical glows
- **Ground Terrain**: Earthy browns, stone grays, mystical energy colors
- **Accent Colors**: Gold/yellow energy, red warning elements

### Composition Elements

#### Foreground (Bottom 40% of image) - LANE FOCUS
- **Lane Pathways**: Two distinct combat corridors at 30% and 70% screen positions
- **Ground Level**: Cracked stone platforms or mystical earth defining each lane
- **Lane Dividers**: Mystical barriers, energy streams, or architectural elements separating lanes
- **Combat Platforms**: Elevated fighting areas at exact lane positions
- **Environmental Details**: Ancient runes, glowing crystals, mystical artifacts within each lane
- **Atmospheric Effects**: Ground-level mist, energy particles concentrated in lane areas

#### Midground (Middle 40% of image)
- **Architectural Elements**: Ruins of ancient structures, stone pillars, mystical gates framing lanes
- **Natural Elements**: Twisted trees, floating rocks, energy streams between lanes
- **Lane Markers**: Visual elements that clearly define the 30% and 70% positions
- **Scale Reference**: Elements that provide sense of depth and player scale within lanes

#### Background (Top 20% of image)
- **Sky/Atmosphere**: Dark mystical sky with energy swirls
- **Distant Elements**: Mountains, floating islands, or dimensional rifts
- **Lighting**: Dramatic lighting suggesting impending danger
- **Atmospheric Depth**: Elements that don't interfere with lane visibility

## Design Guidelines

### Art Style
- **Consistent with Game**: Pixel art or stylized digital art matching the retro-arcade aesthetic
- **Detail Level**: Detailed enough to be atmospheric but not distracting from gameplay
- **Performance**: Optimized for mobile devices

### Technical Requirements
- **Transparency**: Areas where no background should be shown (for UI overlay)
- **Seamless Edges**: No harsh borders or visible seams
- **Scalability**: Should look good on various screen sizes

### Wave 1 Theme Integration
- **Storytelling**: Visual hints at the "dragon awakening" theme
- **Progression**: Should feel like the calm before the storm
- **Immersion**: Enhances the wave-based progression feeling
- **Lane Gameplay**: Background elements that support and enhance 2-lane combat

## Lane-Specific Design Elements

### Visual Lane Indicators
- **Path Markers**: Glowing runes or energy streams marking lane positions
- **Platform Edges**: Clear boundaries for each combat lane
- **Depth Cues**: Elements that create visual separation between lanes
- **Movement Guides**: Visual flow that suggests horizontal lane switching

### Combat Integration
- **Enemy Positioning**: Background elements that show enemy approach routes
- **Cover Opportunities**: Ruins or structures players can use tactically
- **Power-up Placement**: Areas where power-ups can spawn within lanes
- **Boss Engagement**: Space for boss positioning relative to lanes

## AI Generation Prompts

### Primary Prompt for DALL-E/Midjourney:
```
Mystical battlefield background for mobile game, 405x720 pixels, dark fantasy setting, TWO DISTINCT COMBAT LANES at 30% and 70% screen positions, ancient stone ruins with glowing mystical runes, floating energy crystals, twisted ethereal trees, dark purple-blue sky with swirling energy patterns, ground-based combat arena with clear lane pathways, atmospheric mist and particles, pixel art style, retro arcade aesthetic, transparent areas for UI overlay, dramatic lighting suggesting impending dragon awakening, centered composition, game background layer, dual lane combat system
```

### Alternative Detailed Prompt:
```
Top-down view mystical battlefield scene, 405x720px, dark fantasy ruins background, TWO COMBAT LANES clearly defined at 30% and 70% positions, ancient stone architecture with glowing golden runes, floating purple energy crystals, ethereal twisted trees with blue mystical glow, dark atmospheric sky with red energy swirls, ground level mist effects, particle energy streams, pixel art game background, transparent PNG format, mobile vertical shooter aesthetic, dramatic lighting foreshadowing dragon emergence, centered arena composition, dual lane fighting corridors
```

### Simplified Prompt:
```
Mystical ruins battlefield background, 405x720px, TWO COMBAT LANES at 30% and 70% positions, dark fantasy setting, glowing runes, energy crystals, atmospheric mist, pixel art style, transparent background, mobile game scene, dual lane combat system
```

## Implementation

### File Location
```
public/assets/scenes/
└── wave1_background.png
```

### Game Integration Code
```javascript
// In GameScene.js preload()
this.load.image('wave1_background', 'assets/scenes/wave1_background.png');

// In GameScene.js create()
this.add.image(width/2, height/2, 'wave1_background').setDepth(-1);
```

### Future Wave Backgrounds
This establishes the pattern for future wave backgrounds:
- **Wave 2**: More intense energy effects
- **Wave 3**: Dragon-themed elements emerging
- **Wave 4**: Full dragon transformation
- **Wave 5**: Epic final battle atmosphere

## Quality Checklist

### Technical
- [ ] PNG format with transparency
- [ ] 405x720 pixel dimensions
- [ ] Under 500KB file size
- [ ] No compression artifacts
- [ ] Clean edges and transparency

### Visual
- [ ] Matches dark blue-purple color scheme (#1a1a2e)
- [ ] Atmospheric and immersive
- [ ] Supports "Dragon's Awakening" theme
- [ ] Readable on mobile devices
- [ ] Doesn't interfere with gameplay elements
- [ ] **Lane System**: Clear visual definition of 2 combat lanes at 30% and 70% positions
- [ ] **Lane Clarity**: Lane pathways are distinct and easy to follow
- [ ] **Combat Space**: Adequate visual space for player and enemy positioning in each lane

### Game Integration
- [ ] Properly layered behind game entities
- [ ] No performance impact on mobile
- [ ] Scales appropriately on different screens
- [ ] Works with UI overlay elements
- [ ] **Lane Functionality**: Background doesn't obstruct lane switching or combat
- [ ] **Entity Visibility**: Game entities remain clearly visible over background

## Tools for Creation

### AI Generation Tools:
1. **Bing Image Creator** (DALL-E 3)
2. **Midjourney**
3. **Leonardo.ai**
4. **Stable Diffusion** (with game asset models)

### Post-Processing:
1. **GIMP** or **Photoshop** for cleanup
2. **TinyPNG** for optimization
3. **Remove.bg** if background removal needed

## Testing

### In-Game Testing:
1. Load background in GameScene
2. Verify proper layering (behind entities, in front of nothing)
3. Test on mobile device
4. Check performance impact
5. Ensure UI elements overlay correctly
6. **Lane Testing**: Verify lanes are clearly visible at 30% and 70% positions
7. **Combat Testing**: Ensure background doesn't interfere with player/enemy combat
8. **Movement Testing**: Confirm lane switching feels natural with background

### Visual Testing:
1. Compare with game color scheme
2. Test readability at different brightness levels
3. Verify atmospheric effect during gameplay
4. **Lane Visibility**: Confirm lane pathways are clear in both light and dark conditions
5. **Gameplay Integration**: Test that background enhances rather than hinders gameplay