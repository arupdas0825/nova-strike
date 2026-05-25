'use strict';

/**
 * Performance-tuned particle entity capable of rendering sparks, exhaust flares, and floating score texts.
 */
export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ffffff';
    this.life = 0;
    this.maxLife = 0;
    this.size = 2;
    this.text = null; // Set when rendering floating combo overlays
    this.active = false;
  }

  /**
   * Initializes particle attributes. Used by object pools.
   * @param {number} x
   * @param {number} y
   * @param {number} vx
   * @param {number} vy
   * @param {string} color
   * @param {number} maxLife - Lifespan in frames
   * @param {number} size
   * @param {string|null} text - Text if score popup
   */
  init(x, y, vx, vy, color, maxLife, size, text = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = maxLife;
    this.maxLife = maxLife;
    this.size = size;
    this.text = text;
    this.active = true;
  }

  /**
   * Updates particle coordinates and decays lifespan
   */
  update() {
    if (!this.active) return;

    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  /**
   * Draws particle applying a clean alpha fade over its lifetime
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.text) {
      // Premium floating typography for score events
      ctx.fillStyle = this.color;
      ctx.font = `900 ${this.size}px 'Orbitron', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Subtle black stroke for legible overlay on bright backgrounds
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
    } else {
      // Glow drawing for high quality neon sparks
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
