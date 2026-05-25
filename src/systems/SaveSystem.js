'use strict';

/**
 * Handles localStorage persistence for high score and settings.
 */
export class SaveSystem {
  /**
   * @param {string} storageKey - localStorage key prefix
   */
  constructor(storageKey = 'novaStrikeHS') {
    this.storageKey = storageKey;
  }

  /**
   * Loads the saved high score
   * @returns {number}
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Saves the high score if it exceeds the current record
   * @param {number} score
   * @returns {boolean} True if new high score
   */
  saveHighScore(score) {
    try {
      const current = this.loadHighScore();
      if (score > current) {
        localStorage.setItem(this.storageKey, score.toString());
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Loads audio mute setting
   * @returns {boolean}
   */
  loadMuted() {
    try {
      return localStorage.getItem(this.storageKey + '_muted') === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Saves audio mute setting
   * @param {boolean} muted
   */
  saveMuted(muted) {
    try {
      localStorage.setItem(this.storageKey + '_muted', muted.toString());
    } catch (e) {
      // Silently fail
    }
  }
}
