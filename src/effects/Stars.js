'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Procedural 3-layer parallax star field for the scrolling background.
 */
export class Stars {
  constructor() {
    this.width = CONSTANTS.GAME_WIDTH;
    this.height = CONSTANTS.GAME_HEIGHT;
    /** @type {Array<{x: number, y: number, speed: number, size: number, opacity: number, color: string}>} */
    this.stars = [];
    
    this.init();
  }

  /**
   * Generates 220 stars distributed across 3 speed/distance layers
   */
  init() {
    const totalStars = CONSTANTS.STAR_COUNT;
    const layers = [
      { speed: 0.25, sizeMin: 0.5, sizeMax: 1.2, weight: 0.50, color: '#90a0ff' }, // Far (Slow, Blueish)
      { speed: 0.70, sizeMin: 1.2, sizeMax: 2.0, weight: 0.30, color: '#ffffff' }, // Mid (White)
      { speed: 1.60, sizeMin: 2.0, sizeMax: 3.0, weight: 0.20, color: '#00f3ff' }  // Near (Fast, Cyan)
    ];

    let layerIdx = 0;
    let starsCreated = 0;

    for (let i = 0; i < totalStars; i++) {
      // Pick layer based on weights
      if (starsCreated >= totalStars * layers[0].weight && layerIdx === 0) layerIdx = 1;
      if (starsCreated >= totalStars * (layers[0].weight + layers[1].weight) && layerIdx === 1) layerIdx = 2;

      const def = layers[layerIdx];
      const size = Math.random() * (def.sizeMax - def.sizeMin) + def.sizeMin;
      
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: def.speed,
        size: size,
        opacity: Math.random() * 0.6 + 0.4,
        color: def.color
      });

      starsCreated++;
    }
  }

  /**
   * Moves stars downward based on layer speed and handles screen wrapping
   */
  update() {
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.y += star.speed;

      // Wrap-around checking
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }
  }

  /**
   * Draws stars using simple fills
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.save();
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }
}
