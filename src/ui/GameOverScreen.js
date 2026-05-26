'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Cinematic Game Over Screen.
 * Renders final scores, locks high records, summarizes campaigns,
 * and features subtle R/G/B split chromatic aberration text rendering.
 */
export class GameOverScreen {
  constructor() {
    this.timer = 0;
    this.newHighScore = false;
  }

  /**
   * Resets animation timer and high score flag
   * @param {boolean} isNewHighScore
   */
  reset(isNewHighScore) {
    this.timer = 0;
    this.newHighScore = isNewHighScore;
  }

  /**
   * Updates animations frame-rate independently
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this.timer += dt * 60; // nom frames
  }

  /**
   * Renders the game over screen
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} score
   * @param {number} highScore
   * @param {number} level
   * @param {number} bossKills
   */
  draw(ctx, score, highScore, level, bossKills) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();

    // 1. Semi-transparent black overlay
    const fadeAlpha = Math.min(1.0, this.timer / 40) * 0.88;
    ctx.fillStyle = `rgba(2, 2, 8, ${fadeAlpha})`;
    ctx.fillRect(0, 0, W, H);

    if (this.timer < 15) {
      ctx.restore();
      return;
    }

    const textAlpha = Math.min(1.0, (this.timer - 15) / 20);
    ctx.globalAlpha = textAlpha;

    // 2. Chromatic Aberration splits on "GAME OVER"
    const titleY = H * 0.28;
    ctx.save();
    ctx.font = "900 56px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Red Channel
    ctx.fillStyle = 'rgba(255, 0, 0, 0.75)';
    ctx.fillText('GAME OVER', W / 2 + 2, titleY);

    // Cyan Channel
    ctx.fillStyle = 'rgba(0, 255, 255, 0.75)';
    ctx.fillText('GAME OVER', W / 2 - 2, titleY);

    // Hot pink core with neon glow
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ff0055';
    ctx.fillText('GAME OVER', W / 2, titleY);
    ctx.restore();

    // Divider line
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.36);
    ctx.lineTo(W * 0.7, H * 0.36);
    ctx.stroke();

    // 3. Final Score
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "700 30px 'Orbitron', sans-serif";
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, H * 0.45);

    // New High Score Badge
    if (this.newHighScore) {
      const flashAlpha = 0.5 + Math.sin(this.timer * 0.08) * 0.5;
      ctx.save();
      ctx.globalAlpha = flashAlpha * textAlpha;
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.font = "900 18px 'Orbitron', sans-serif";
      ctx.shadowColor = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.shadowBlur = 15;
      ctx.fillText('★ NEW HIGH SCORE RECORD ★', W / 2, H * 0.53);
      ctx.restore();
    } else {
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
      ctx.font = "600 14px 'Orbitron', sans-serif";
      ctx.fillText(`HIGH SCORE RECORD: ${highScore.toLocaleString()}`, W / 2, H * 0.53);
    }

    // Stats
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText(`COMMAND SECTOR REACHED: LEVEL ${level}`, W / 2, H * 0.63);
    ctx.fillText(`THREAT ELIMINATIONS: ${bossKills} CAPITALS`, W / 2, H * 0.67);

    // 4. Restart prompt (blinking)
    if (this.timer > 60) {
      const blinkAlpha = 0.5 + Math.sin(this.timer * 0.06) * 0.5;
      ctx.globalAlpha = blinkAlpha;
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
      ctx.font = "700 16px 'Orbitron', sans-serif";
      ctx.fillText('PRESS  ENTER  OR  TAP  TO  RESTART', W / 2, H * 0.82);
    }

    ctx.restore();
  }
}
