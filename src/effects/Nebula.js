'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Renders large, slowly drifting cosmic nebula blobs using radial gradients.
 */
export class Nebula {
  constructor() {
    this.width = CONSTANTS.GAME_WIDTH;
    this.height = CONSTANTS.GAME_HEIGHT;
    /** @type {Array<{x: number, y: number, radius: number, vx: number, vy: number, color: string, maxOpacity: number}>} */
    this.blobs = [];

    this.init();
  }

  /**
   * Initializes 4 distinct slow-moving colored nebula clouds
   */
  init() {
    const colors = [
      'rgba(188, 19, 254, ',  // Purple
      'rgba(0, 150, 255, ',   // Deep Blue
      'rgba(255, 0, 110, ',   // Magenta
      'rgba(0, 243, 255, '    // Cyan
    ];

    for (let i = 0; i < CONSTANTS.NEBULA_COUNT; i++) {
      const radius = Math.random() * 200 + 300; // Large sizes (300px - 500px)
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: radius,
        vx: (Math.random() * 2 - 1) * 0.12, // Extremely slow drifting
        vy: (Math.random() * 2 - 1) * 0.12,
        color: colors[i % colors.length],
        maxOpacity: Math.random() * 0.04 + 0.04 // 0.04 to 0.08 opacity limit
      });
    }
  }

  /**
   * Slowly updates positions and handles gentle screen bounds bouncing
   */
  update() {
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      blob.x += blob.vx;
      blob.y += blob.vy;

      // Soft bounce on borders to prevent disappearing
      const padding = 150;
      if (blob.x < -padding || blob.x > this.width + padding) {
        blob.vx *= -1;
      }
      if (blob.y < -padding || blob.y > this.height + padding) {
        blob.vy *= -1;
      }
    }
  }

  /**
   * Draws nebula blobs as radial gradients to the canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.save();
    // Use screen blend mode for beautiful color additive blending
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      
      const gradient = ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, blob.radius
      );

      gradient.addColorStop(0, `${blob.color}${blob.maxOpacity})`);
      gradient.addColorStop(0.5, `${blob.color}${blob.maxOpacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
