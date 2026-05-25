'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Powerups dropped by defeated enemies that grant player status buffs.
 */
export class PowerUp {
  static TYPES = {
    HEALTH: 'health',
    RAPID: 'rapid',
    SHIELD: 'shield',
    MISSILE: 'missile'
  };

  constructor() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.type = null;
    this.radius = 13;
    this.life = 0;
    this.color = '#ffffff';
    this.symbol = '?';
    this.active = false;
  }

  /**
   * Initializes a power-up. Used by object pool.
   * @param {number} x 
   * @param {number} y 
   * @param {string} type 
   */
  init(x, y, type) {
    this.x = x;
    this.y = y;
    this.vy = 0.5; // Initial downward float speed
    this.type = type;
    this.life = CONSTANTS.POWERUP_LIFESPAN;
    this.active = true;

    // Standardize metadata based on type
    switch (type) {
      case PowerUp.TYPES.HEALTH:
        this.color = CONSTANTS.COLORS.POWERUP_HEALTH;
        this.symbol = '♥';
        break;
      case PowerUp.TYPES.RAPID:
        this.color = CONSTANTS.COLORS.POWERUP_RAPID;
        this.symbol = '⚡';
        break;
      case PowerUp.TYPES.SHIELD:
        this.color = CONSTANTS.COLORS.POWERUP_SHIELD;
        this.symbol = '◈';
        break;
      case PowerUp.TYPES.MISSILE:
        this.color = CONSTANTS.COLORS.POWERUP_MISSILE;
        this.symbol = '◉';
        break;
    }
  }

  /**
   * Updates coordinates with gentle gravity, decays lifespan.
   */
  update() {
    if (!this.active) return;

    // Apply gravity
    this.vy += CONSTANTS.POWERUP_GRAVITY;
    this.y += this.vy;
    
    // Slow drift bounds check
    if (this.y > CONSTANTS.GAME_HEIGHT + 30) {
      this.active = false;
    }

    this.life--;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  /**
   * Draws a premium glowing powerup capsule container
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    
    // Pulsing opacity based on lifetime remaining
    const alpha = this.life < 120 ? Math.max(0, this.life / 120) : 1;
    ctx.globalAlpha = alpha;

    // Outer glow ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    
    // Pulse animation based on floating wave
    const scaleFactor = 1 + Math.sin(this.life * 0.08) * 0.08;
    const r = this.radius * scaleFactor;

    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Semi-translucent core fill
    ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
    ctx.shadowBlur = 0; // Turn off glow for text/fill to keep text crisp
    ctx.fill();

    // Central Icon Typography
    ctx.fillStyle = this.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.symbol, this.x, this.y);

    ctx.restore();
  }
}
