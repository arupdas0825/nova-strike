'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Manages game canvas setup, resizing, and crisp Retina (DPI) scaling.
 */
export class Canvas {
  /**
   * @param {HTMLCanvasElement} canvasElement - Binds the HTML Canvas
   */
  constructor(canvasElement) {
    this.canvas = canvasElement;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext('2d');
    
    // Logical Dimensions
    this.logicalWidth = CONSTANTS.GAME_WIDTH;
    this.logicalHeight = CONSTANTS.GAME_HEIGHT;
    this.aspectRatio = this.logicalWidth / this.logicalHeight;

    // Scaling Factors
    this.scaleX = 1;
    this.scaleY = 1;
    this.dpiScale = 1;

    this.init();
  }

  /**
   * Bootstraps canvas resizing and listeners
   */
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Resizes canvas based on window dimensions and scales context by devicePixelRatio
   */
  resize() {
    const container = this.canvas.parentElement || document.body;
    const windowWidth = container.clientWidth || window.innerWidth || CONSTANTS.GAME_WIDTH;
    const windowHeight = container.clientHeight || window.innerHeight || CONSTANTS.GAME_HEIGHT;

    let targetWidth = windowWidth;
    let targetHeight = windowHeight;

    // Maintain Aspect Ratio in viewport
    if (windowWidth / windowHeight > this.aspectRatio) {
      targetWidth = windowHeight * this.aspectRatio;
    } else {
      targetHeight = windowWidth / this.aspectRatio;
    }

    // Capture device pixel ratio (DPI)
    this.dpiScale = window.devicePixelRatio || 1;

    // Set CSS scale styling
    this.canvas.style.width = `${targetWidth}px`;
    this.canvas.style.height = `${targetHeight}px`;

    // Set backing store dimensions scaled by DPI for visual sharpness
    this.canvas.width = this.logicalWidth * this.dpiScale;
    this.canvas.height = this.logicalHeight * this.dpiScale;

    // Reset transformations and set base scaling
    this.ctx.resetTransform();
    this.ctx.scale(this.dpiScale, this.dpiScale);

    // Calculate scale multipliers between logical space and CSS pixel layout
    const rect = this.canvas.getBoundingClientRect();
    this.scaleX = this.logicalWidth / rect.width;
    this.scaleY = this.logicalHeight / rect.height;
  }

  /**
   * Standardizes raw client events (mouse, touch) into logical 1200x800 coordinate system
   * @param {number} clientX 
   * @param {number} clientY 
   * @returns {{x: number, y: number}}
   */
  getLogicalCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * this.scaleX,
      y: (clientY - rect.top) * this.scaleY
    };
  }

  /**
   * Clears game board
   */
  clear() {
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
  }
}
