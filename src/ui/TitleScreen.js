'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Premium animated title screen with pulsing title, star backdrop,
 * and input prompts.
 */
export class TitleScreen {
  constructor() {
    this.timer = 0;
    this.particles = [];

    // Generate decorative title screen particles
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * CONSTANTS.GAME_WIDTH,
        y: Math.random() * CONSTANTS.GAME_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  /**
   * Updates animation timers
   */
  update() {
    this.timer++;

    // Drift particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speed;
      if (p.y > CONSTANTS.GAME_HEIGHT) {
        p.y = 0;
        p.x = Math.random() * CONSTANTS.GAME_WIDTH;
      }
    }
  }

  /**
   * Renders the complete title screen
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} highScore
   */
  draw(ctx, highScore) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();

    // Background
    ctx.fillStyle = CONSTANTS.COLORS.BG;
    ctx.fillRect(0, 0, W, H);

    // Decorative particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.fillStyle = '#00f3ff';
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Gradient overlay at bottom
    const gradient = ctx.createLinearGradient(0, H * 0.7, 0, H);
    gradient.addColorStop(0, 'rgba(2, 2, 8, 0)');
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Title text — "NOVA STRIKE"
    const titlePulse = 0.85 + Math.sin(this.timer * 0.03) * 0.15;

    ctx.save();
    ctx.globalAlpha = titlePulse;
    ctx.fillStyle = CONSTANTS.COLORS.PLAYER;
    ctx.font = "900 62px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = CONSTANTS.COLORS.PLAYER;
    ctx.shadowBlur = 30;
    ctx.fillText('NOVA STRIKE', W / 2, H * 0.30);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "300 16px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.3em';
    ctx.fillText('SPACE  COMBAT  EXPERIENCE', W / 2, H * 0.38);

    // Decorative line
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.43);
    ctx.lineTo(W * 0.7, H * 0.43);
    ctx.stroke();

    // High Score
    if (highScore > 0) {
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.font = "700 16px 'Orbitron', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, W / 2, H * 0.50);
    }

    // Controls info
    const controlsY = H * 0.60;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.textAlign = 'center';

    ctx.fillText('WASD / ARROWS — Move', W / 2, controlsY);
    ctx.fillText('SPACE — Fire', W / 2, controlsY + 22);
    ctx.fillText('M — Launch Missile', W / 2, controlsY + 44);
    ctx.fillText('P — Pause / ESC', W / 2, controlsY + 66);

    // Start prompt — blinks
    const blinkAlpha = 0.5 + Math.sin(this.timer * 0.06) * 0.5;
    ctx.globalAlpha = blinkAlpha;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_WHITE;
    ctx.font = "700 18px 'Orbitron', sans-serif";
    ctx.fillText('PRESS  ENTER  OR  TAP  TO  START', W / 2, H * 0.88);
    ctx.globalAlpha = 1;

    // Version tag
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = "300 10px 'Inter', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('v2.0', W - 12, H - 10);

    ctx.restore();
  }
}
