// Game configuration
const movementMode = import.meta.env.VITE_MOVEMENT_MODE || 'full';

console.log('[Config] VITE_MOVEMENT_MODE:', import.meta.env.VITE_MOVEMENT_MODE);
console.log('[Config] Movement mode set to:', movementMode);

// Store in window for global access
window.GAME_MOVEMENT_MODE = movementMode;

export default {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 405,  // 9:16 aspect ratio for mobile portrait
  height: 720,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 405,
    height: 720
  },
  // Custom game settings
  movementMode: movementMode // 'full' or 'horizontal'
};

export { movementMode };
