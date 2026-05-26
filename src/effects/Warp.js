'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Hyperspace Warp Speed visual effect triggered upon leveling up.
 * Streams 30 tapered lines from screen center to the edges over 45 frames (0.75 seconds).
 */
export class Warp {
  constructor() {
    this.active = false;
    this.duration = 0.75; // 45 frames at 60fps
    this.timeRemaining = 0;
    
    /** @type {Array<{angle: number, speed: number, distance: number, length: number, opacity: number}>} */
    this.lines = [];
  }

  /**
   * Triggers the level-up warp sequence
   */
  trigger() {
    this.active = true;
    this.timeRemaining = this.duration;
    this.lines = [];

    const centerX = CONSTANTS.GAME_WIDTH / 2;
    const centerY = CONSTANTS.GAME_HEIGHT / 2;

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      // High velocities for expanding lines
      const speed = Math.random() * 1000 + 800; // px/s
      
      this.lines.push({
        angle: angle,
        speed: speed,
        distance: Math.random() * 50, // start tight to center
        length: Math.random() * 100 + 80,
        opacity: 1.0
      });
    }
  }

  /**
   * Updates line offsets and decays lifetime
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.active = false;
      this.lines = [];
      return;
    }

    const progress = (this.duration - this.timeRemaining) / this.duration;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      // Expand outwards
      line.distance += line.speed * dt;
      // Fade out over lifetime
      line.opacity = Math.max(0, 1.0 - progress);
    }
  }

  /**
   * Renders the warp lines with tapering (thicker at screen edge)
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active) return;

    const centerX = CONSTANTS.GAME_WIDTH / 2;
    const centerY = CONSTANTS.GAME_HEIGHT / 2;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      ctx.globalAlpha = line.opacity;

      const cos = Math.cos(line.angle);
      const sin = Math.sin(line.angle);

      const startDist = line.distance;
      const endDist = line.distance + line.length;

      const startX = centerX + cos * startDist;
      const startY = centerY + sin * startDist;
      const endX = centerX + cos * endDist;
      const endY = centerY + sin * endDist;

      // Taper: width is 0px at center, up to 3px at screen edges
      const maxEdgeDist = 700; // rough distance from center to corners
      const width = Math.min(3.0, (endDist / maxEdgeDist) * 3.0);

      ctx.lineWidth = Math.max(0.2, width);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
