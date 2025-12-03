/**
 * Shooter/Character Data Manager
 * Handles character stats, progression, and persistence
 */

class ShooterManager {
  constructor() {
    this.currentShooter = null;
    this.availableShooters = this.getShooterDefinitions();
  }

  /**
   * Define all available shooters with their base stats
   * Image specs: 64x64px or 128x128px PNG with transparency
   */
  getShooterDefinitions() {
    return {
      basic: {
        id: 'basic',
        name: 'Green Soldier',
        description: 'Standard ground fighter',
        imagePath: 'assets/shooters/green-soldier.png', // 64x64px or larger
        stats: {
          health: 100,
          maxHealth: 100,
          speed: 200,
          fireRate: 500, // ms between shots
          damage: 25,
          bulletSpeed: 400
        },
        unlocked: true,
        cost: 0
      },
      advanced: {
        id: 'advanced',
        name: 'Blue Special Ops',
        description: 'Faster fire rate, more damage',
        imagePath: 'assets/shooters/blue-special-ops.png',
        stats: {
          health: 120,
          maxHealth: 120,
          speed: 220,
          fireRate: 350,
          damage: 35,
          bulletSpeed: 450
        },
        unlocked: false,
        cost: 1000
      },
      elite: {
        id: 'elite',
        name: 'Gold Commander',
        description: 'Maximum power and speed',
        imagePath: 'assets/shooters/gold-commander.png',
        stats: {
          health: 150,
          maxHealth: 150,
          speed: 250,
          fireRate: 250,
          damage: 50,
          bulletSpeed: 500
        },
        unlocked: false,
        cost: 5000
      }
    };
  }

  /**
   * Load shooter data from localStorage
   */
  loadShooterData() {
    const savedData = localStorage.getItem('shooterData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.currentShooter = data.currentShooter || 'basic';
        
        // Merge saved unlock status
        if (data.availableShooters) {
          Object.keys(data.availableShooters).forEach(key => {
            if (this.availableShooters[key]) {
              this.availableShooters[key].unlocked = data.availableShooters[key].unlocked;
            }
          });
        }
        
        console.log('[ShooterManager] Loaded shooter data:', this.currentShooter);
        return data;
      } catch (e) {
        console.error('[ShooterManager] Error loading data:', e);
      }
    }
    
    // Default to basic shooter
    this.currentShooter = 'basic';
    return null;
  }

  /**
   * Save shooter data to localStorage
   */
  saveShooterData() {
    const data = {
      currentShooter: this.currentShooter,
      availableShooters: {},
      timestamp: Date.now()
    };

    // Save unlock status
    Object.keys(this.availableShooters).forEach(key => {
      data.availableShooters[key] = {
        unlocked: this.availableShooters[key].unlocked
      };
    });

    localStorage.setItem('shooterData', JSON.stringify(data));
    console.log('[ShooterManager] Saved shooter data');
  }

  /**
   * Get current shooter configuration
   */
  getCurrentShooter() {
    if (!this.currentShooter) {
      this.loadShooterData();
    }
    return this.availableShooters[this.currentShooter];
  }

  /**
   * Set active shooter
   */
  setCurrentShooter(shooterId) {
    if (this.availableShooters[shooterId] && this.availableShooters[shooterId].unlocked) {
      this.currentShooter = shooterId;
      this.saveShooterData();
      return true;
    }
    return false;
  }

  /**
   * Unlock a shooter
   */
  unlockShooter(shooterId, currency) {
    const shooter = this.availableShooters[shooterId];
    if (!shooter) return { success: false, message: 'Shooter not found' };
    if (shooter.unlocked) return { success: false, message: 'Already unlocked' };
    if (currency < shooter.cost) return { success: false, message: 'Insufficient currency' };

    shooter.unlocked = true;
    this.saveShooterData();
    return { success: true, message: 'Shooter unlocked!' };
  }

  /**
   * Get all shooters
   */
  getAllShooters() {
    return this.availableShooters;
  }

  /**
   * Prepare data for API sync (when backend is ready)
   */
  prepareForAPISync() {
    return {
      currentShooter: this.currentShooter,
      shooters: Object.keys(this.availableShooters).map(key => ({
        id: key,
        unlocked: this.availableShooters[key].unlocked
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Import data from API (when backend is ready)
   */
  importFromAPI(apiData) {
    if (apiData.currentShooter) {
      this.currentShooter = apiData.currentShooter;
    }
    
    if (apiData.shooters) {
      apiData.shooters.forEach(shooter => {
        if (this.availableShooters[shooter.id]) {
          this.availableShooters[shooter.id].unlocked = shooter.unlocked;
        }
      });
    }
    
    this.saveShooterData();
  }
}

export default new ShooterManager();
