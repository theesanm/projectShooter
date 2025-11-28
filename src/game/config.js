// Game configuration
const movementMode = import.meta.env.VITE_MOVEMENT_MODE || 'full';

export default {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
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
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // Custom game settings
  movementMode: movementMode // 'full' or 'horizontal'
};
