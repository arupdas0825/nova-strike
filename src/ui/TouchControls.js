'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Virtual touch controls for mobile devices — renders transparent
 * D-pad and action buttons, and injects virtual key events into
 * the Input system.
 */
export class TouchControls {
  /**
   * @param {import('../engine/Canvas.js').Canvas} canvas
   * @param {import('../engine/Input.js').Input} input
   */
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.active = false;
    this.isMobile = false;

    // Button states
    this.buttons = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      missile: false,
      start: false,
      pause: false
    };

    // Touch tracking
    this.activeTouches = new Map();

    this._detectMobile();
    if (this.isMobile) {
      this._bindEvents();
      this.active = true;
    }
  }

  /**
   * Detects if the device supports touch
   */
  _detectMobile() {
    this.isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  /**
   * Binds touch event listeners
   */
  _bindEvents() {
    const el = this.canvas.canvas;

    el.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    el.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    el.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    el.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
  }

  _onTouchStart(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const pos = this.canvas.getLogicalCoords(t.clientX, t.clientY);
      this.activeTouches.set(t.identifier, pos);
    }
    this._updateButtons();
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const pos = this.canvas.getLogicalCoords(t.clientX, t.clientY);
      this.activeTouches.set(t.identifier, pos);
    }
    this._updateButtons();
  }

  _onTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.activeTouches.delete(e.changedTouches[i].identifier);
    }
    this._updateButtons();
  }

  /**
   * Updates virtual button states based on active touch positions
   */
  _updateButtons() {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    // Reset all buttons
    this.buttons.up = false;
    this.buttons.down = false;
    this.buttons.left = false;
    this.buttons.right = false;
    this.buttons.fire = false;
    this.buttons.missile = false;
    this.buttons.start = false;
    this.buttons.pause = false;

    // D-pad zone: bottom-left quadrant
    const dpadCenterX = 120;
    const dpadCenterY = H - 120;
    const dpadRadius = 70;

    // Action zone: bottom-right quadrant
    const fireX = W - 120;
    const fireY = H - 130;
    const missileX = W - 60;
    const missileY = H - 200;

    for (const [, pos] of this.activeTouches) {
      // D-pad
      const dx = pos.x - dpadCenterX;
      const dy = pos.y - dpadCenterY;
      const dist = Math.hypot(dx, dy);

      if (dist < dpadRadius * 1.5 && pos.x < W / 2) {
        const angle = Math.atan2(dy, dx);
        // Cardinal directions
        if (angle > -Math.PI * 0.75 && angle < -Math.PI * 0.25) this.buttons.up = true;
        if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) this.buttons.down = true;
        if (Math.abs(angle) > Math.PI * 0.625) this.buttons.left = true;
        if (Math.abs(angle) < Math.PI * 0.375) this.buttons.right = true;
      }

      // Fire button (right side, any touch)
      if (pos.x > W * 0.6 && pos.y > H * 0.5) {
        const fireDist = Math.hypot(pos.x - fireX, pos.y - fireY);
        const missileDist = Math.hypot(pos.x - missileX, pos.y - missileY);

        if (missileDist < 45) {
          this.buttons.missile = true;
        } else if (fireDist < 60) {
          this.buttons.fire = true;
        }
      }

      // Start/Pause (top center)
      if (pos.y < 60 && pos.x > W * 0.4 && pos.x < W * 0.6) {
        this.buttons.pause = true;
      }

      // Start anywhere (for title/gameover)
      this.buttons.start = true;
    }

    // Map buttons to virtual keys
    this.input.setVirtualKey('arrowup', this.buttons.up);
    this.input.setVirtualKey('arrowdown', this.buttons.down);
    this.input.setVirtualKey('arrowleft', this.buttons.left);
    this.input.setVirtualKey('arrowright', this.buttons.right);
    this.input.setVirtualKey(' ', this.buttons.fire);
    this.input.setVirtualKey('m', this.buttons.missile);

    if (this.buttons.start) {
      this.input.setVirtualKey('enter', true);
      // Reset after one frame
      setTimeout(() => this.input.setVirtualKey('enter', false), 50);
    }
    if (this.buttons.pause) {
      this.input.setVirtualKey('p', true);
      setTimeout(() => this.input.setVirtualKey('p', false), 50);
    }
  }

  /**
   * Draws transparent touch control overlays (only on mobile)
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active) return;

    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();
    ctx.globalAlpha = 0.15;

    // D-pad circle
    const dpadX = 120;
    const dpadY = H - 120;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dpadX, dpadY, 55, 0, Math.PI * 2);
    ctx.stroke();

    // D-pad cross
    ctx.fillStyle = '#ffffff';
    // Up arrow
    ctx.beginPath();
    ctx.moveTo(dpadX, dpadY - 40);
    ctx.lineTo(dpadX - 10, dpadY - 25);
    ctx.lineTo(dpadX + 10, dpadY - 25);
    ctx.closePath();
    ctx.fill();
    // Down arrow
    ctx.beginPath();
    ctx.moveTo(dpadX, dpadY + 40);
    ctx.lineTo(dpadX - 10, dpadY + 25);
    ctx.lineTo(dpadX + 10, dpadY + 25);
    ctx.closePath();
    ctx.fill();
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(dpadX - 40, dpadY);
    ctx.lineTo(dpadX - 25, dpadY - 10);
    ctx.lineTo(dpadX - 25, dpadY + 10);
    ctx.closePath();
    ctx.fill();
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(dpadX + 40, dpadY);
    ctx.lineTo(dpadX + 25, dpadY - 10);
    ctx.lineTo(dpadX + 25, dpadY + 10);
    ctx.closePath();
    ctx.fill();

    // Fire button
    const fireX = W - 120;
    const fireY = H - 130;
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fireX, fireY, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#00f3ff';
    ctx.font = "bold 14px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIRE', fireX, fireY);

    // Missile button
    const missileX = W - 60;
    const missileY = H - 200;
    ctx.strokeStyle = '#d21eff';
    ctx.beginPath();
    ctx.arc(missileX, missileY, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d21eff';
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillText('MSL', missileX, missileY);

    ctx.restore();
  }
}
