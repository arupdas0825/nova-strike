'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Game Over screen with final score display, high score comparison,
 * stats summary, and restart prompt.
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
   * Updates animation timer
   */
  update() {
    this.timer++;
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

    // Semi-transparent dark overlay
    const fadeAlpha = Math.min(1, this.timer / 40) * 0.8;
    ctx.fillStyle = `rgba(2, 2, 8, ${fadeAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Only draw text after initial fade
    if (this.timer < 15) {
      ctx.restore();
      return;
    }

    const textAlpha = Math.min(1, (this.timer - 15) / 20);
    ctx.globalAlpha = textAlpha;

    // GAME OVER title
    ctx.fillStyle = '#ff0055';
    ctx.font = "900 52px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 25;
    ctx.fillText('GAME OVER', W / 2, H * 0.25);
    ctx.shadowBlur = 0;

    // Divider line
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.33);
    ctx.lineTo(W * 0.7, H * 0.33);
    ctx.stroke();

    // Final Score
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "700 28px 'Orbitron', sans-serif";
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, H * 0.42);

    // New High Score indicator
    if (this.newHighScore) {
      const flashAlpha = 0.5 + Math.sin(this.timer * 0.08) * 0.5;
      ctx.save();
      ctx.globalAlpha = flashAlpha * textAlpha;
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.font = "900 18px 'Orbitron', sans-serif";
      ctx.shadowColor = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.shadowBlur = 15;
      ctx.fillText('★ NEW HIGH SCORE ★', W / 2, H * 0.50);
      ctx.restore();
    } else {
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
      ctx.font = "600 14px 'Orbitron', sans-serif";
      ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, W / 2, H * 0.50);
    }

    // Stats
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "400 14px 'Inter', sans-serif";
    ctx.fillText(`Level Reached: ${level}`, W / 2, H * 0.60);
    ctx.fillText(`Bosses Defeated: ${bossKills}`, W / 2, H * 0.65);

    // Restart prompt — blinking
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
