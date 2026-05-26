'use strict';

/**
 * Offscreen dual-canvas bloom filter. Draws glowing elements to an offscreen buffer,
 * applies a filter blur, and composites back onto the main canvas with screen blending.
 */
export class Bloom {
  /**
   * @param {number} width 
   * @param {number} height 
   */
  constructor(width, height) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    // Toggle state
    this.enabled = true;
  }

  /**
   * Clears the offscreen bloom buffer
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Applies the bloom blur pass and composites it back onto the main canvas
   * using globalCompositeOperation = 'screen'.
   * @param {CanvasRenderingContext2D} mainCtx 
   */
  apply(mainCtx) {
    if (!this.enabled) return;

    mainCtx.save();
    mainCtx.globalCompositeOperation = 'screen';
    
    // Apply hardware-accelerated filter
    mainCtx.filter = 'blur(8px)';
    
    // Draw the glow buffer
    mainCtx.drawImage(this.canvas, 0, 0);
    
    mainCtx.restore();
  }
}
