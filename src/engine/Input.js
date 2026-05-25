'use strict';

/**
 * Handles physical and virtual controller bindings.
 */
export class Input {
  constructor() {
    /** @type {Object<string, boolean>} Active keyboard states */
    this.keys = {};
    /** @type {Object<string, boolean>} Single press trigger latch */
    this.keysPressed = {};

    this.init();
  }

  /**
   * Binds raw keyboard events and locks window scrolling for active gameplay keys
   */
  init() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Stop page scrolling with navigation keys during active play
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'spacebar'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if (!this.keys[key]) {
        this.keysPressed[key] = true;
      }
      this.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
      this.keysPressed[key] = false;
    });

    // Reset keyboard map on blur to prevent keys getting "stuck"
    window.addEventListener('blur', () => {
      this.keys = {};
      this.keysPressed = {};
    });
  }

  /**
   * Checks if key is currently held
   * @param {string} key 
   * @returns {boolean}
   */
  isKeyDown(key) {
    return !!this.keys[key.toLowerCase()];
  }

  /**
   * Checks if key was pressed down in the current frame (resets immediately)
   * @param {string} key 
   * @returns {boolean}
   */
  isKeyJustPressed(key) {
    const k = key.toLowerCase();
    if (this.keysPressed[k]) {
      this.keysPressed[k] = false;
      return true;
    }
    return false;
  }

  /**
   * Allows external controllers (TouchControls) to trigger physical state flags
   * @param {string} key 
   * @param {boolean} active 
   */
  setVirtualKey(key, active) {
    const k = key.toLowerCase();
    if (active && !this.keys[k]) {
      this.keysPressed[k] = true;
    }
    this.keys[k] = active;
  }

  /**
   * Resets all trigger latches
   */
  clearPressed() {
    this.keysPressed = {};
  }
}
