'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Procedural deep-space nebula effect. Renders 4 large colored clouds using radial gradients.
 * Pre-rendered to an offscreen canvas at startup and updated/redrawn every 600 frames only
 * for maximum rendering performance.
 */
export class Nebula {
  constructor() {
    this.width = CONSTANTS.GAME_WIDTH;
    this.height = CONSTANTS.GAME_HEIGHT;

    // Create offscreen buffer
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    /** @type {Array<{x: number, y: number, radius: number, vx: number, vy: number, colors: Array<string>, opacity: number}>} */
    this.blobs = [];
    this.frameCounter = 0;

    this.init();
    this.prerender();
  }

  /**
   * Initializes 4 large radial gradient clouds
   */
  init() {
    // 4 large radial gradient clouds (radius 200-350px each)
    // Colors: deep purple #220044, dark teal #001133, crimson #220011
    // Opacity: 0.06 - 0.10
    // Drift speed: 0.08 px/f (4.8 px/s at 60fps)
    const colorDefs = [
      { r: 34, g: 0, b: 68 },   // #220044 deep purple
      { r: 0, g: 17, b: 51 },   // #001133 dark teal
      { r: 34, g: 0, b: 17 },   // #220011 crimson
      { r: 34, g: 0, b: 68 }    // duplicate purple or mix
    ];

    for (let i = 0; i < 4; i++) {
      const radius = Math.random() * 150 + 200; // 200 - 350px
      const rgb = colorDefs[i];
      
      // Drift speeds: 0.08 px/f is 4.8 px/s
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: radius,
        vx: (Math.random() * 2 - 1) * 4.8,
        vy: (Math.random() * 2 - 1) * 4.8,
        colorString: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, `,
        opacity: Math.random() * 0.04 + 0.06 // 0.06 - 0.10
      });
    }
  }

  /**
   * Pre-renders all nebula clouds into the offscreen buffer
   */
  prerender() {
    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      
      const grad = ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, blob.radius
      );

      grad.addColorStop(0, `${blob.colorString}${blob.opacity})`);
      grad.addColorStop(0.5, `${blob.colorString}${blob.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Updates positions (drift) frame-rate independently.
   * Redraws the offscreen canvas only once every 600 frames to conserve draw-calls.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this.frameCounter++;

    // Increment positions
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      blob.x += blob.vx * dt;
      blob.y += blob.vy * dt;

      // Wrap around screen edges plus margin
      const margin = blob.radius;
      if (blob.x < -margin) blob.x = this.width + margin;
      if (blob.x > this.width + margin) blob.x = -margin;
      if (blob.y < -margin) blob.y = this.height + margin;
      if (blob.y > this.height + margin) blob.y = -margin;
    }

    // Render offscreen buffer once every 600 frames
    if (this.frameCounter >= 600) {
      this.frameCounter = 0;
      this.prerender();
    }
  }

  /**
   * Fast O(1) blit from offscreen canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
}
