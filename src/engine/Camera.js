'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Handles camera movements, viewport translations, and screen-shake effects.
 */
export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.shakeMagnitude = 0;
    this.decay = CONSTANTS.SCREEN_SHAKE_DECAY;
  }

  /**
   * Triggers a camera shake of the specified pixel magnitude
   * @param {number} magnitude 
   */
  shake(magnitude) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  /**
   * Decays the screen shake intensity per frame
   */
  update() {
    if (this.shakeMagnitude > 0.05) {
      this.shakeMagnitude *= this.decay;
      // Calculate random shake offsets
      this.x = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.y = (Math.random() * 2 - 1) * this.shakeMagnitude;
    } else {
      this.shakeMagnitude = 0;
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
    if (this.shakeMagnitude > 0) {
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
