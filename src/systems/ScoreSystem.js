'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Orchestrates scoring algorithms: combo multiplier decay loops,
 * progressive level threshold checks, and 4-second sliding kill-streak events.
 */
export class ScoreSystem {
  /**
   * @param {Object} game 
   */
  constructor(game) {
    this.game = game;
    this.score = 0;
    this.level = 1;
    
    this.combo = 0;
    this.comboTimer = 0;       // nominal frames remaining

    this.bossKills = 0;

    // 4-second sliding kill streak system
    this.killStreak = 0;
    this.killStreakTimer = 0;  // seconds remaining before reset
    
    // HUD flash alert tracking
    this.streakAlertTimer = 0; // seconds remaining to display "KILL STREAK ×N"
    this.streakAlertCount = 0;
  }

  /**
   * Resets scores for a new game session
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.bossKills = 0;
    
    this.killStreak = 0;
    this.killStreakTimer = 0;
    this.streakAlertTimer = 0;
    this.streakAlertCount = 0;
  }

  /**
   * Decays timers frame-rate independently
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    // 1. Combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt * 60; // decrement by nominal frames
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    // 2. Kill streak 4-second window
    if (this.killStreak > 0) {
      this.killStreakTimer -= dt;
      if (this.killStreakTimer <= 0) {
        this.killStreak = 0;
        this.killStreakTimer = 0;
      }
    }

    // 3. HUD Streak alert fade timer
    if (this.streakAlertTimer > 0) {
      this.streakAlertTimer -= dt;
    }

    // 4. Level progressive thresholds (e.g. level up every 350 pts)
    const nextLvl = Math.floor(this.score / CONSTANTS.SCORE_PER_LEVEL) + 1;
    if (nextLvl > this.level) {
      this.level = nextLvl;
      
      // Trigger levels sounds and visuals
      this.game.audio.playLevelUp();
      this.game.warp.trigger();
      
      // Full hull repair on level up as reward
      this.game.player.heal(30);
    }
  }

  /**
   * Logs a hostile kill, increments combos, and tracks streaks
   * @param {number} basePoints 
   * @param {number} x - kill x position
   * @param {number} y - kill y position
   * @param {boolean} isBoss 
   */
  addKill(basePoints, x, y, isBoss) {
    // Increment combo
    this.combo = Math.min(CONSTANTS.COMBO_MAX, this.combo + 1);
    this.comboTimer = CONSTANTS.COMBO_DECAY_FRAMES;

    // Calculate final points applying combos
    const mult = 1.0 + (this.combo - 1) * 0.25;
    const finalPoints = Math.floor(basePoints * mult);
    this.score += finalPoints;

    if (isBoss) {
      this.bossKills++;
    }

    // 4-second kill streak increments
    this.killStreak++;
    this.killStreakTimer = 4.0; // sliding 4s window

    // Lock in new kill streak HUD alert if streak >= 3
    if (this.killStreak >= 3) {
      this.streakAlertTimer = 2.0; // flash for 2.0s
      this.streakAlertCount = this.killStreak;
    }

    // Spawn flying floating texts
    this._spawnScoreText(x, y, finalPoints);
    if (this.combo > 1) {
      this._spawnComboText(x, y - 22);
    }
  }

  _spawnScoreText(x, y, points) {
    const { particlePool, particles } = this.game;
    const p = particlePool.obtain();
    if (p) {
      p.init(
        x, y,
        0, -75, // vy in px/s (-1.2 px/f is -72 px/s)
        0.75,   // 45 frames lifetime (0.75s)
        CONSTANTS.COLORS.TEXT_YELLOW,
        15,
        `+${points}`
      );
      particles.push(p);
    }
  }

  _spawnComboText(x, y) {
    const { particlePool, particles } = this.game;
    const p = particlePool.obtain();
    if (p) {
      p.init(
        x, y,
        0, -50,
        0.58,   // 35 frames (0.58s)
        CONSTANTS.COLORS.TEXT_MAGENTA,
        11,
        `×${this.combo} COMBO`
      );
      particles.push(p);
    }
  }
}
