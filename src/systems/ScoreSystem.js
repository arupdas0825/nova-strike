'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Manages score, combo multiplier, level progression, and floating
 * score text particles.
 */
export class ScoreSystem {
  /**
   * @param {object} game - Reference to the main Game instance
   */
  constructor(game) {
    this.game = game;
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.bossKills = 0;
  }

  /**
   * Resets score state for new game
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.bossKills = 0;
  }

  /**
   * Updates combo decay timer
   */
  update() {
    if (this.combo > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Level progression
    const newLevel = Math.floor(this.score / CONSTANTS.SCORE_PER_LEVEL) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }

  /**
   * Registers an enemy kill, applies combo multiplier, and spawns score text
   * @param {number} basePoints
   * @param {number} x - Kill position X
   * @param {number} y - Kill position Y
   * @param {boolean} isBoss
   */
  addKill(basePoints, x, y, isBoss) {
    // Increment combo
    this.combo = Math.min(CONSTANTS.COMBO_MAX, this.combo + 1);
    this.comboTimer = CONSTANTS.COMBO_DECAY_FRAMES;

    // Calculate final score with combo multiplier
    const multiplier = 1 + (this.combo - 1) * 0.25;
    const points = Math.floor(basePoints * multiplier);
    this.score += points;

    if (isBoss) {
      this.bossKills++;
    }

    // Spawn floating score text particle
    this._spawnScoreText(x, y, points);

    // Spawn combo indicator if combo > 1
    if (this.combo > 1) {
      this._spawnComboText(x, y - 20);
    }
  }

  /**
   * Spawns floating score text
   * @param {number} x
   * @param {number} y
   * @param {number} points
   */
  _spawnScoreText(x, y, points) {
    const { particlePool, particles } = this.game;
    const p = particlePool.obtain(
      x, y,
      0, -1.2,
      CONSTANTS.COLORS.TEXT_YELLOW,
      45,
      16,
      `+${points}`
    );
    particles.push(p);
  }

  /**
   * Spawns combo indicator text
   * @param {number} x
   * @param {number} y
   */
  _spawnComboText(x, y) {
    const { particlePool, particles } = this.game;
    const p = particlePool.obtain(
      x, y,
      0, -0.8,
      CONSTANTS.COLORS.TEXT_MAGENTA,
      35,
      12,
      `x${this.combo} COMBO`
    );
    particles.push(p);
  }
}
