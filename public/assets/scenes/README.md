# Scene Background Images

This directory contains background images for different game scenes/waves.

## File Naming Convention
- `wave1_background.png` - Wave 1: "Dragon's Awakening"
- `wave2_background.png` - Wave 2: [Future wave]
- `wave3_background.png` - Wave 3: [Future wave]
- etc.

## Specifications
See `WAVE1_SCENE_SPECS.md` in the root directory for detailed specifications for wave 1 background.

## Technical Requirements
- PNG format with transparency
- 405x720 pixels (9:16 aspect ratio)
- Optimized for mobile performance
- Layered behind game entities but above base background color

## Current Status
- [x] `wave1_background.png` - Implemented in GameScene.js
- [ ] Future wave backgrounds - Planned