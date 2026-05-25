'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Heads-Up Display — renders HP bar, score, combo, level, missile count, and FPS.
 */
export class HUD {
  /**
   * @param {object} game - Reference to the main Game instance
   */
  constructor(game) {
    this.game = game;
  }

  /**
   * Renders the full HUD overlay
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const { player, scoreSystem } = this.game;

    ctx.save();

    this._drawScore(ctx, scoreSystem);
    this._drawLevel(ctx, scoreSystem);
    this._drawCombo(ctx, scoreSystem);
    this._drawHPBar(ctx, player);
    this._drawMissiles(ctx, player);
    this._drawShieldIndicator(ctx, player);
    this._drawRapidIndicator(ctx, player);

    ctx.restore();
  }

  /** Score display — top-right */
  _drawScore(ctx, ss) {
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "bold 20px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${ss.score.toLocaleString()}`, CONSTANTS.GAME_WIDTH - 20, 16);
  }

  /** Level display — top-right below score */
  _drawLevel(ctx, ss) {
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "600 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`LEVEL ${ss.level}`, CONSTANTS.GAME_WIDTH - 20, 42);
  }

  /** Combo display — top center */
  _drawCombo(ctx, ss) {
    if (ss.combo <= 1) return;

    const alpha = ss.comboTimer > 30 ? 1 : ss.comboTimer / 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_MAGENTA;
    ctx.font = "900 18px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Glow effect for combo text
    ctx.shadowColor = CONSTANTS.COLORS.TEXT_MAGENTA;
    ctx.shadowBlur = 12;

    ctx.fillText(`x${ss.combo} COMBO`, CONSTANTS.GAME_WIDTH / 2, 16);
    ctx.restore();
  }

  /** HP bar — top-left */
  _drawHPBar(ctx, player) {
    const barX = 20;
    const barY = 16;
    const barWidth = 180;
    const barHeight = 14;
    const hpRatio = player.hp / player.maxHp;

    // Label
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "600 10px 'Orbitron', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('HULL', barX, barY - 1);

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(barX + 40, barY, barWidth, barHeight);

    // Fill (color transitions from green to red)
    const hue = hpRatio * 120;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(barX + 40, barY, barWidth * hpRatio, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 40, barY, barWidth, barHeight);

    // HP text
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${player.hp}`, barX + 40 + barWidth / 2, barY + 2);
  }

  /** Missile counter — top-left below HP */
  _drawMissiles(ctx, player) {
    const x = 20;
    const y = 40;

    ctx.fillStyle = CONSTANTS.COLORS.MISSILE;
    ctx.font = "600 11px 'Orbitron', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`◉ MISSILES: ${player.missiles}`, x, y);
  }

  /** Shield buff indicator */
  _drawShieldIndicator(ctx, player) {
    if (!player.shieldActive) return;

    const x = 20;
    const y = 58;
    ctx.fillStyle = CONSTANTS.COLORS.POWERUP_SHIELD;
    ctx.font = "600 10px 'Orbitron', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const flashAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
    ctx.globalAlpha = flashAlpha;
    ctx.fillText('◈ SHIELD ACTIVE', x, y);
    ctx.globalAlpha = 1;
  }

  /** Rapid fire buff indicator */
  _drawRapidIndicator(ctx, player) {
    if (player.rapidFireTimer <= 0) return;

    const x = 20;
    const y = player.shieldActive ? 74 : 58;
    ctx.fillStyle = CONSTANTS.COLORS.POWERUP_RAPID;
    ctx.font = "600 10px 'Orbitron', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const flashAlpha = 0.6 + Math.sin(Date.now() * 0.012) * 0.4;
    ctx.globalAlpha = flashAlpha;
    ctx.fillText('⚡ RAPID FIRE', x, y);
    ctx.globalAlpha = 1;
  }
}
