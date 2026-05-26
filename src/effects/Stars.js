'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * 5-layer parallax scrolling starfield with streak speedlines for near stars.
 * Moves frame-rate independently.
 */
export class Stars {
  constructor() {
    this.width = CONSTANTS.GAME_WIDTH;
    this.height = CONSTANTS.GAME_HEIGHT;
    /** @type {Array<{x: number, y: number, speed: number, size: number, alpha: number, layer: number}>} */
    this.stars = [];

    this.init();
  }

  /**
   * Spawns stars in five distinct layers
   */
  init() {
    // Speeds are given in px per frame at 60fps in the prompt. We convert to px/s:
    // L0: 0.12 px/f -> 7.2 px/s
    // L1: 0.28 px/f -> 16.8 px/s
    // L2: 0.65 px/f -> 39.0 px/s
    // L3: 1.2  px/f -> 72.0 px/s
    // L4: 2.2  px/f -> 132.0 px/s
    const layers = [
      { count: 80, speed: 7.2, size: 0.4, alpha: 0.2 },
      { count: 55, speed: 16.8, size: 0.7, alpha: 0.35 },
      { count: 40, speed: 39.0, size: 1.0, alpha: 0.55 },
      { count: 25, speed: 72.0, size: 1.5, alpha: 0.75 },
      { count: 12, speed: 132.0, size: 2.5, alpha: 1.0 }
    ];

    layers.forEach((layerDef, layerIdx) => {
      for (let i = 0; i < layerDef.count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          speed: layerDef.speed,
          size: layerDef.size,
          alpha: layerDef.alpha,
          layer: layerIdx
        });
      }
    });
  }

  /**
   * Updates star positions using frame-rate independent dt delta timing
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    const scale = 1.0; // Can be increased during warps
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.y += star.speed * dt * scale;

      // Wrap around screen edge
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }
  }

  /**
   * Draws stars. Layer 4 stars draw as vertical lines representing speed streaks.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = star.alpha;

      if (star.layer === 4) {
        // Draw 4px streak in direction of travel (downwards)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y + 4);
        ctx.stroke();
      } else {
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
    ctx.restore();
  }
}
