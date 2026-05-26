'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Handles localStorage persistence for both game high scores (`novaStrikeHS`) 
 * and deep audio, visual, and gameplay difficulty settings (`novaStrikeSettings`).
 */
export class SaveSystem {
  constructor() {
    this.scoreKey = CONSTANTS.LOCAL_STORAGE_SCORE_KEY;     // 'novaStrikeHS'
    this.settingsKey = CONSTANTS.LOCAL_STORAGE_SETTINGS_KEY; // 'novaStrikeSettings'
  }

  /**
   * Loads the current high score record
   * @returns {number}
   */
  loadHighScore() {
    try {
      const record = localStorage.getItem(this.scoreKey);
      return record ? parseInt(record, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Persists a new high score record if it exceeds current
   * @param {number} score 
   * @returns {boolean} True if new high score saved
   */
  saveHighScore(score) {
    try {
      const current = this.loadHighScore();
      if (score > current) {
        localStorage.setItem(this.scoreKey, score.toString());
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Loads and standardizes game configuration settings
   * @returns {Object} Settings state
   */
  loadSettings() {
    // Detect mobile for default Bloom off
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const defaults = {
      masterVolume: 70,       // 0 - 100
      sfxVolume: 85,          // 0 - 100
      bloomEnabled: !isMobile, // default ON, auto OFF on mobile
      difficulty: 'normal',   // 'easy', 'normal', 'hard', 'insane'
      showFPS: false,
      muted: false
    };

    try {
      const saved = localStorage.getItem(this.settingsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default fallbacks for any missing properties
        return Object.assign({}, defaults, parsed);
      }
    } catch (e) {
      if (CONSTANTS.DEBUG) console.error('Failed to load settings:', e);
    }

    return defaults;
  }

  /**
   * Saves settings to localStorage
   * @param {Object} settings 
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (e) {
      if (CONSTANTS.DEBUG) console.error('Failed to save settings:', e);
    }
  }
}
