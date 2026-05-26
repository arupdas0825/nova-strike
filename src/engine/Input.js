'use strict';

/**
 * Handles physical keyboard, mouse click/touch, and Gamepad controller integrations.
 * Exposes a unified directional and action API.
 */
export class Input {
  constructor() {
    /** @type {Object<string, boolean>} Active keyboard states */
    this.keys = {};
    /** @type {Object<string, boolean>} Single press trigger latch */
    this.keysPressed = {};
    
    // Gamepad state
    this.gamepadAxes = null;

    this.init();
  }

  /**
   * Binds raw keyboard events and locks window scrolling for active gameplay keys
   */
  init() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Stop page scrolling with navigation keys during active play
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'spacebar', 'escape', 'enter'].includes(e.key.toLowerCase())) {
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
      this.gamepadAxes = null;
    });
  }

  /**
   * Polls gamepads if available and populates axis/virtual keys
   */
  update() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activeGamepad = null;

    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        activeGamepad = gamepads[i];
        break; // Use the first active controller
      }
    }

    if (activeGamepad) {
      const ax = activeGamepad.axes[0]; // horizontal
      const ay = activeGamepad.axes[1]; // vertical
      const deadzone = 0.18;

      this.gamepadAxes = {
        x: Math.abs(ax) > deadzone ? ax : 0,
        y: Math.abs(ay) > deadzone ? ay : 0
      };

      // Button mapping
      // Button 0 (A/Cross) or 7 (RT) -> Fire/Select (SPACE)
      const fireBtn = (activeGamepad.buttons[0]?.pressed) || (activeGamepad.buttons[7]?.pressed);
      this.setVirtualKey(' ', fireBtn);

      // Button 1 (B/Circle) or 4/5 (Shoulders) -> Weapon Switch (Q)
      const switchBtn = (activeGamepad.buttons[1]?.pressed) || (activeGamepad.buttons[4]?.pressed) || (activeGamepad.buttons[5]?.pressed);
      this.setVirtualKey('q', switchBtn);

      // Button 2 (X) or 3 (Y) -> Missile Fire (M)
      const missileBtn = (activeGamepad.buttons[2]?.pressed) || (activeGamepad.buttons[3]?.pressed);
      this.setVirtualKey('m', missileBtn);

      // Button 9 (Start) -> Pause/Select (Escape/Enter)
      const pauseBtn = activeGamepad.buttons[9]?.pressed;
      this.setVirtualKey('escape', pauseBtn);
      this.setVirtualKey('enter', pauseBtn);
    } else {
      this.gamepadAxes = null;
    }
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
