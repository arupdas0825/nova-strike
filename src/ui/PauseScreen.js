'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Pause screen overlay with resume instructions.
 */
export class PauseScreen {
  constructor() {
    this.timer = 0;
  }

  update() {
    this.timer++;
  }

  /**
   * Renders semi-transparent pause overlay
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();

    // Dark overlay
    ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
    ctx.fillRect(0, 0, W, H);

    // PAUSED text
    ctx.fillStyle = CONSTANTS.COLORS.PLAYER;
    ctx.font = "900 48px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = CONSTANTS.COLORS.PLAYER;
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', W / 2, H * 0.40);
    ctx.shadowBlur = 0;

    // Resume prompt
    const blinkAlpha = 0.5 + Math.sin(this.timer * 0.06) * 0.5;
    ctx.globalAlpha = blinkAlpha;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "600 16px 'Orbitron', sans-serif";
    ctx.fillText('PRESS  P  OR  ESC  TO  RESUME', W / 2, H * 0.55);

    ctx.restore();
  }
}
