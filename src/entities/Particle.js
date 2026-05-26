'use strict';

/**
 * Performance-tuned particle entity capable of rendering exhaust sparks, 
 * bright impact flashes, and floating combo multipliers.
 * Adapts to both seconds-based and frame-based signatures under Verlet integration.
 */
export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ffffff';
    this.life = 0;      // seconds remaining
    this.maxLife = 0;   // total seconds
    this.size = 2;
    this.text = null;
    this.active = false;
  }

  /**
   * Initializes or recycles a particle instance. Automatically standardizes
   * parameter overrides to allow both v1.0 and v3.0 calling formats.
   * 
   * Signatures supported:
   *   init(x, y, vx, vy, maxLifeSeconds, colorString, size, text) -> v3.0
   *   init(x, y, vx, vy, colorString, maxLifeFrames, size, text)  -> v1.0
   */
  init(x, y, vx, vy, param5, param6, size, text = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.text = text;
    this.active = true;

    let rawLife = 0.5;
    let rawColor = '#ffffff';

    // Type signature resolution
    if (typeof param5 === 'string') {
      rawColor = param5;
      rawLife = param6;
    } else {
      rawLife = param5;
      rawColor = param6;
    }

    this.color = rawColor;

    // Convert frames to seconds if needed (numbers >= 5 are frames)
    if (rawLife >= 5) {
      this.maxLife = rawLife / 60;
    } else {
      this.maxLife = rawLife;
    }
    
    this.life = this.maxLife;
  }

  /**
   * Verlet position increment and lifetime decay
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.life -= dt;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  /**
   * Renders particles with visual fade-outs
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.text) {
      // Premium floating technology text overlays
      ctx.fillStyle = this.color;
      ctx.font = `900 ${this.size}px "Orbitron", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.0;
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
    } else {
      // Glow dot sparks
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  get alive() {
    return this.active;
  }
}
