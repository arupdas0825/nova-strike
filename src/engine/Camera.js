'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Handles camera movements, viewport translations, and realistic screen-shake
 * using a non-linear trauma system (shake = trauma^2 * maxShake).
 */
export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.trauma = 0;      // 0.0 to 1.0
    this.maxShake = 35;   // maximum offset in pixels
    this.decay = 0.92;    // trauma decay rate per frame at 60fps
  }

  /**
   * Adds trauma to the camera, capped at 1.0
   * @param {number} value
   */
  shake(value) {
    this.trauma = Math.min(1.0, this.trauma + value);
  }

  /**
   * Decays the trauma and calculates screen shake offsets
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (this.trauma > 0.01) {
      // Frame-rate independent decay
      this.trauma *= Math.pow(this.decay, dt * 60);

      // Calculate non-linear shake offset based on trauma^2
      const shakeIntensity = this.trauma * this.trauma * this.maxShake;
      
      this.x = (Math.random() * 2 - 1) * shakeIntensity;
      this.y = (Math.random() * 2 - 1) * shakeIntensity;
    } else {
      this.trauma = 0;
      this.x = 0;
      this.y = 0;
    }
  }

  /**
   * Applies the camera translation to the drawing context.
   * Call BEFORE drawing game elements.
   * @param {CanvasRenderingContext2D} ctx
   */
  applyTransform(ctx) {
    ctx.save();
    if (this.trauma > 0) {
      ctx.translate(this.x, this.y);
    }
  }

  /**
   * Restores the drawing context state to remove camera translations.
   * Call AFTER drawing game elements.
   * @param {CanvasRenderingContext2D} ctx
   */
  restoreTransform(ctx) {
    ctx.restore();
  }
}
