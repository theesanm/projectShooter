/**
 * Player Progression Manager
 * Tracks currency, upgrades, and stats across sessions
 */

class ProgressionManager {
  constructor() {
    this.currency = 0;
    this.totalScore = 0;
    this.gamesPlayed = 0;
    this.highestWave = 0;
    this.totalKills = 0;
    this.upgrades = {
      healthBoost: 0,  // +10 health per level
      speedBoost: 0,   // +20 speed per level
      damageBoost: 0,  // +5 damage per level
      fireRateBoost: 0 // -50ms fire rate per level
    };
  }

  /**
   * Load progression from localStorage
   */
  loadProgression() {
    const savedData = localStorage.getItem('playerProgression');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.currency = data.currency || 0;
        this.totalScore = data.totalScore || 0;
        this.gamesPlayed = data.gamesPlayed || 0;
        this.highestWave = data.highestWave || 0;
        this.totalKills = data.totalKills || 0;
        this.upgrades = data.upgrades || this.upgrades;
        
        console.log('[ProgressionManager] Loaded progression:', {
          currency: this.currency,
          gamesPlayed: this.gamesPlayed
        });
        return data;
      } catch (e) {
        console.error('[ProgressionManager] Error loading progression:', e);
      }
    }
    return null;
  }

  /**
   * Save progression to localStorage
   */
  saveProgression() {
    const data = {
      currency: this.currency,
      totalScore: this.totalScore,
      gamesPlayed: this.gamesPlayed,
      highestWave: this.highestWave,
      totalKills: this.totalKills,
      upgrades: this.upgrades,
      timestamp: Date.now()
    };

    localStorage.setItem('playerProgression', JSON.stringify(data));
    console.log('[ProgressionManager] Saved progression');
  }

  /**
   * Add currency earned from game
   */
  addCurrency(amount) {
    this.currency += amount;
    this.saveProgression();
  }

  /**
   * Spend currency
   */
  spendCurrency(amount) {
    if (this.currency >= amount) {
      this.currency -= amount;
      this.saveProgression();
      return true;
    }
    return false;
  }

  /**
   * Record game session results
   */
  recordGameSession(score, wave, kills) {
    this.gamesPlayed++;
    this.totalScore += score;
    this.totalKills += kills;
    
    if (wave > this.highestWave) {
      this.highestWave = wave;
    }

    // Award currency based on performance (1 coin per 10 points)
    const currencyEarned = Math.floor(score / 10);
    this.addCurrency(currencyEarned);
    
    this.saveProgression();
    
    return {
      currencyEarned,
      newHighestWave: wave > this.highestWave - 1
    };
  }

  /**
   * Purchase upgrade
   */
  purchaseUpgrade(upgradeType) {
    const costs = {
      healthBoost: [100, 200, 400, 800, 1600],
      speedBoost: [150, 300, 600, 1200, 2400],
      damageBoost: [200, 400, 800, 1600, 3200],
      fireRateBoost: [250, 500, 1000, 2000, 4000]
    };

    const currentLevel = this.upgrades[upgradeType] || 0;
    if (currentLevel >= 5) {
      return { success: false, message: 'Max level reached' };
    }

    const cost = costs[upgradeType][currentLevel];
    if (this.spendCurrency(cost)) {
      this.upgrades[upgradeType]++;
      this.saveProgression();
      return { success: true, message: 'Upgrade purchased!', newLevel: this.upgrades[upgradeType] };
    }

    return { success: false, message: 'Insufficient currency' };
  }

  /**
   * Get upgrade cost
   */
  getUpgradeCost(upgradeType) {
    const costs = {
      healthBoost: [100, 200, 400, 800, 1600],
      speedBoost: [150, 300, 600, 1200, 2400],
      damageBoost: [200, 400, 800, 1600, 3200],
      fireRateBoost: [250, 500, 1000, 2000, 4000]
    };

    const currentLevel = this.upgrades[upgradeType] || 0;
    if (currentLevel >= 5) return null;
    return costs[upgradeType][currentLevel];
  }

  /**
   * Apply upgrades to shooter stats
   */
  applyUpgradesToStats(baseStats) {
    return {
      health: baseStats.health + (this.upgrades.healthBoost * 10),
      maxHealth: baseStats.maxHealth + (this.upgrades.healthBoost * 10),
      speed: baseStats.speed + (this.upgrades.speedBoost * 20),
      fireRate: Math.max(100, baseStats.fireRate - (this.upgrades.fireRateBoost * 50)),
      damage: baseStats.damage + (this.upgrades.damageBoost * 5),
      bulletSpeed: baseStats.bulletSpeed
    };
  }

  /**
   * Prepare data for API sync
   */
  prepareForAPISync() {
    return {
      currency: this.currency,
      totalScore: this.totalScore,
      gamesPlayed: this.gamesPlayed,
      highestWave: this.highestWave,
      totalKills: this.totalKills,
      upgrades: this.upgrades,
      timestamp: Date.now()
    };
  }

  /**
   * Import data from API
   */
  importFromAPI(apiData) {
    if (apiData.currency !== undefined) this.currency = apiData.currency;
    if (apiData.totalScore !== undefined) this.totalScore = apiData.totalScore;
    if (apiData.gamesPlayed !== undefined) this.gamesPlayed = apiData.gamesPlayed;
    if (apiData.highestWave !== undefined) this.highestWave = apiData.highestWave;
    if (apiData.totalKills !== undefined) this.totalKills = apiData.totalKills;
    if (apiData.upgrades) this.upgrades = apiData.upgrades;
    
    this.saveProgression();
  }

  /**
   * Reset all progression (for testing)
   */
  resetProgression() {
    this.currency = 0;
    this.totalScore = 0;
    this.gamesPlayed = 0;
    this.highestWave = 0;
    this.totalKills = 0;
    this.upgrades = {
      healthBoost: 0,
      speedBoost: 0,
      damageBoost: 0,
      fireRateBoost: 0
    };
    this.saveProgression();
  }
}

export default new ProgressionManager();
