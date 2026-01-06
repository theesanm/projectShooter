/**
 * API Service for future database integration
 * Handles all backend communications for stats, leaderboards, etc.
 */

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.enabled = true; // Enable API for wave configuration
  }

  /**
   * Get wave configuration from backend
   */
  async getWaveConfig(waveNumber) {
    try {
      const response = await fetch(`${this.baseURL}/waves/${waveNumber}`);
      if (!response.ok) {
        throw new Error(`Wave ${waveNumber} not found`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`[API] Error fetching wave ${waveNumber}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all enemies
   */
  async getEnemies() {
    try {
      const response = await fetch(`${this.baseURL}/enemies`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('[API] Error fetching enemies:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save player stats to database
   */
  async saveStats(data) {
    if (!this.enabled) {
      console.log('[API] Stats would be saved:', data);
      return { success: true, cached: true };
    }

    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('[API] Error saving stats:', error);
      return { success: false, error };
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(limit = 10) {
    if (!this.enabled) {
      console.log('[API] Leaderboard would be fetched');
      return { success: true, data: [], cached: true };
    }

    try {
      const response = await fetch(`${this.baseURL}/leaderboard?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Error fetching leaderboard:', error);
      return { success: false, error };
    }
  }

  /**
   * Save high score
   */
  async saveHighScore(playerName, score, wave) {
    if (!this.enabled) {
      console.log('[API] High score would be saved:', { playerName, score, wave });
      return { success: true, cached: true };
    }

    try {
      const response = await fetch(`${this.baseURL}/highscore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, score, wave })
      });
      return await response.json();
    } catch (error) {
      console.error('[API] Error saving high score:', error);
      return { success: false, error };
    }
  }
}

export default new APIService();
