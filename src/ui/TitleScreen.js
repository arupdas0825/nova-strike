'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Cinematic Title Screen.
 * Renders separate eased fly-ins for logo, bank sweeps, scrolling vector planets,
 * subtle RGB chromatic aberration text shadows, and config buttons.
 */
export class TitleScreen {
  constructor() {
    this.timer = 0;
    this.entryTime = 0; // seconds elapsed (up to 0.8s)
    this.entryDuration = 0.8; // 800ms
  }

  /**
   * Resets entry ease transitions
   */
  reset() {
    this.entryTime = 0;
  }

  /**
   * Updates animations frame-rate independently
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this.timer += dt;
    this.entryTime = Math.min(this.entryDuration, this.entryTime + dt);
  }

  /**
   * Renders the complete cinematic title screen
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} highScore 
   */
  draw(ctx, highScore) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();

    // 1. Draw distant vector planet (scrolling background decorative)
    this._drawPlanet(ctx);

    // 2. Draw 3 patrolling squadron enemy ships behind title
    this._drawPatrollingSquadron(ctx);

    // 3. Draw drifting Player ship with flame
    this._drawDriftingPlayer(ctx);

    // 4. Calculate ease cubic out for FLY-IN logo:
    // progress 0 to 1
    const progress = Math.min(1.0, this.entryTime / this.entryDuration);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic out ease

    const pulse = 1.0 + Math.sin(this.timer * 2.5 * Math.PI) * 0.04; // 2.5Hz pulse after fly-in

    // 5. Chromatic Aberration RGB text separation for NOVA / STRIKE title lines
    const titleY = H * 0.28;
    
    // Draw "NOVA"
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 82px 'Orbitron', sans-serif";

    // Fly-in from left
    const novaX = -300 + (W / 2 + 300) * ease;
    
    ctx.translate(novaX, titleY - 45);
    if (progress >= 1.0) {
      ctx.scale(pulse, pulse);
    }

    // Chromatic aberration splits: R + G + B
    // Red Channel
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillText('NOVA', 1.8, 0);

    // Cyan Channel
    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.fillText('NOVA', -1.8, 0);

    // White core + cyan glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#00ffff';
    ctx.fillText('NOVA', 0, 0);
    ctx.restore();

    // Draw "STRIKE"
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 82px 'Orbitron', sans-serif";

    // Fly-in from right
    const strikeX = W + 300 - (W + 300 - W / 2) * ease;
    
    ctx.translate(strikeX, titleY + 45);
    if (progress >= 1.0) {
      ctx.scale(pulse, pulse);
    }

    // Red Channel
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillText('STRIKE', 1.8, 0);

    // Magenta Channel
    ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
    ctx.fillText('STRIKE', -1.8, 0);

    // White core + magenta glow
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('STRIKE', 0, 0);
    ctx.restore();

    // 6. Subtitle & Dividers
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "300 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.45em';
    ctx.fillText('SPACE COMBAT EXPERIENCE', W / 2, titleY + 120);

    // High Score Badge
    if (highScore > 0) {
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_YELLOW;
      ctx.font = "700 15px 'Orbitron', sans-serif";
      ctx.fillText(`GALACTIC RECORD: ${highScore.toLocaleString()}`, W / 2, titleY + 160);
    }

    // 7. Interactive config Button [ SETTINGS ]
    const cfgW = 140;
    const cfgH = 26;
    const cfgX = W / 2 - cfgW / 2;
    const cfgY = H * 0.76;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.strokeStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.lineWidth = 1.0;
    ctx.fillRect(cfgX, cfgY, cfgW, cfgH);
    ctx.strokeRect(cfgX, cfgY, cfgW, cfgH);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 9px 'Orbitron', sans-serif";
    ctx.textBaseline = 'middle';
    ctx.fillText('[ CONFIGURATION ]', W / 2, cfgY + cfgH / 2);
    ctx.restore();

    // 8. Start Prompts (blinking)
    const blink = 0.5 + Math.sin(this.timer * 4.0) * 0.5; // fast blinking
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffffff';
    ctx.font = "700 16px 'Orbitron', sans-serif";
    ctx.fillText('[ PRESS ENTER OR TAP TO START ]', W / 2, H * 0.84);
    ctx.globalAlpha = 1.0;

    // Command bindings displays info
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "400 10px 'Inter', sans-serif";
    ctx.fillText('Move: WASD/Arrows | Fire: SPACE | Missiles: M | Weapon Swap: Q', W / 2, H * 0.93);

    // Version Tag
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = "300 9px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('PRO REALISM EDITION v3.0', W - 20, H - 20);

    ctx.restore();
  }

  /**
   * Distant Planet circle backgrounds
   */
  _drawPlanet(ctx) {
    const px = CONSTANTS.GAME_WIDTH * 0.85;
    const py = CONSTANTS.GAME_HEIGHT * 0.20;
    const r = 40;

    ctx.save();
    
    // radial gradients
    const grad = ctx.createRadialGradient(px - 10, py - 10, 0, px, py, r);
    grad.addColorStop(0, '#005577');
    grad.addColorStop(0.6, '#001122');
    grad.addColorStop(1, '#020208');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // faint glowing atmosphere ring
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px, py, r + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 3 Patrolling squadron fighters behind Title text
   */
  _drawPatrollingSquadron(ctx) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;
    
    // Slow squadron patrol loops
    const sweepX = W / 2 + Math.sin(this.timer * 0.15) * 350;
    const sweepY = H * 0.15 + Math.cos(this.timer * 0.1) * 30;

    const leader = { x: sweepX, y: sweepY };
    const wing1 = { x: sweepX - 45, y: sweepY - 30 };
    const wing2 = { x: sweepX + 45, y: sweepY - 30 };

    ctx.save();
    ctx.globalAlpha = 0.25; // faded behind title screen
    ctx.shadowBlur = 10;

    [leader, wing1, wing2].forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowColor = '#ff5500';
      ctx.fillStyle = '#ff5500';
      ctx.strokeStyle = '#ffffff';

      // Aggressive wing shape
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-12, -8);
      ctx.lineTo(0, -2);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }

  /**
   * Drifting Player ship bottom-center
   */
  _drawDriftingPlayer(ctx) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    const px = W / 2;
    const py = H - 140 + Math.sin(this.timer * 1.5) * 8; // slow drift

    ctx.save();
    ctx.translate(px, py);

    // engine flame flickering
    const flameH = 12 + Math.sin(this.timer * 15.0) * 3;
    const flameGrad = ctx.createLinearGradient(0, 12, 0, 12 + flameH);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#00ffff');
    flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(0, 12 + flameH);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();

    // Fuselage
    ctx.fillStyle = CONSTANTS.COLORS.PLAYER;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-8, -2);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-4, 8);
    ctx.lineTo(0, 14);
    ctx.lineTo(4, 8);
    ctx.lineTo(12, 12);
    ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
