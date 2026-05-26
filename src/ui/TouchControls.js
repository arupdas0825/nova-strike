'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Mobile Virtual Controller Overlay.
 * Renders transparent joysticks, weapon toggles, homing triggers, 
 * and binds hardware-accelerated touch coordinate listeners.
 */
export class TouchControls {
  /**
   * @param {Object} canvas 
   * @param {Object} input 
   */
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    
    this.active = false;
    this.isMobile = false;

    // button states
    this.buttons = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      missile: false,
      weapon: false,
      start: false,
      pause: false
    };

    this.activeTouches = new Map();

    this._detectMobile();
    if (this.isMobile) {
      this._bindEvents();
      this.active = true;
    }
  }

  _detectMobile() {
    this.isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

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

  _updateButtons() {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    // Reset button states
    this.buttons.up = false;
    this.buttons.down = false;
    this.buttons.left = false;
    this.buttons.right = false;
    this.buttons.fire = false;
    this.buttons.missile = false;
    this.buttons.weapon = false;
    this.buttons.start = false;
    this.buttons.pause = false;

    // Positions layout bounds
    const dpadCenterX = 130;
    const dpadCenterY = H - 130;
    const dpadRadius = 75;

    const fireX = W - 130;
    const fireY = H - 130;
    const missileX = W - 65;
    const missileY = H - 210;
    const weaponX = W - 195;
    const weaponY = H - 210;

    for (const [, pos] of this.activeTouches) {
      // 1. D-pad detection (left-side touch)
      const dx = pos.x - dpadCenterX;
      const dy = pos.y - dpadCenterY;
      const dist = Math.hypot(dx, dy);

      if (dist < dpadRadius * 1.5 && pos.x < W / 2) {
        const angle = Math.atan2(dy, dx);
        if (angle > -Math.PI * 0.75 && angle < -Math.PI * 0.25) this.buttons.up = true;
        if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) this.buttons.down = true;
        if (Math.abs(angle) > Math.PI * 0.625) this.buttons.left = true;
        if (Math.abs(angle) < Math.PI * 0.375) this.buttons.right = true;
      }

      // 2. Action buttons (right-side touch)
      if (pos.x > W * 0.5) {
        const fireDist = Math.hypot(pos.x - fireX, pos.y - fireY);
        const missileDist = Math.hypot(pos.x - missileX, pos.y - missileY);
        const weaponDist = Math.hypot(pos.x - weaponX, pos.y - weaponY);

        if (missileDist < 35) {
          this.buttons.missile = true;
        } else if (weaponDist < 35) {
          this.buttons.weapon = true;
        } else if (fireDist < 55) {
          this.buttons.fire = true;
        }
      }

      // 3. Pause Button (top center overlay click)
      if (pos.y < 70 && pos.x > W * 0.4 && pos.x < W * 0.6) {
        this.buttons.pause = true;
      }

      // Start triggers (any tap)
      this.buttons.start = true;
    }

    // Bind touch flags to physical system keys
    this.input.setVirtualKey('arrowup', this.buttons.up);
    this.input.setVirtualKey('arrowdown', this.buttons.down);
    this.input.setVirtualKey('arrowleft', this.buttons.left);
    this.input.setVirtualKey('arrowright', this.buttons.right);
    this.input.setVirtualKey(' ', this.buttons.fire);
    this.input.setVirtualKey('m', this.buttons.missile);
    this.input.setVirtualKey('q', this.buttons.weapon);

    if (this.buttons.start) {
      this.input.setVirtualKey('enter', true);
      setTimeout(() => this.input.setVirtualKey('enter', false), 50);
    }
    if (this.buttons.pause) {
      this.input.setVirtualKey('escape', true);
      setTimeout(() => this.input.setVirtualKey('escape', false), 50);
    }
  }

  /**
   * Draws aesthetic transparent controller overlays
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.save();
    
    // Additive screen blend
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.22; // subtle translucency

    // 1. D-pad Circle
    const dpadX = 130;
    const dpadY = H - 130;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(dpadX, dpadY, 55, 0, Math.PI * 2);
    ctx.stroke();

    // D-pad indicator arrows
    ctx.fillStyle = '#ffffff';
    
    // UP
    ctx.beginPath(); ctx.moveTo(dpadX, dpadY - 42); ctx.lineTo(dpadX - 10, dpadY - 28); ctx.lineTo(dpadX + 10, dpadY - 28); ctx.closePath(); ctx.fill();
    // DOWN
    ctx.beginPath(); ctx.moveTo(dpadX, dpadY + 42); ctx.lineTo(dpadX - 10, dpadY + 28); ctx.lineTo(dpadX + 10, dpadY + 28); ctx.closePath(); ctx.fill();
    // LEFT
    ctx.beginPath(); ctx.moveTo(dpadX - 42, dpadY); ctx.lineTo(dpadX - 28, dpadY - 10); ctx.lineTo(dpadX - 28, dpadY + 10); ctx.closePath(); ctx.fill();
    // RIGHT
    ctx.beginPath(); ctx.moveTo(dpadX + 42, dpadY); ctx.lineTo(dpadX + 28, dpadY - 10); ctx.lineTo(dpadX + 28, dpadY + 10); ctx.closePath(); ctx.fill();

    // 2. FIRE Button (Cyan)
    const fireX = W - 130;
    const fireY = H - 130;
    ctx.strokeStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(fireX, fireY, 44, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#00f3ff';
    ctx.font = "bold 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIRE', fireX, fireY);

    // 3. MISSILE Button (Purple)
    const missileX = W - 65;
    const missileY = H - 210;
    ctx.strokeStyle = '#be1eff';
    ctx.beginPath();
    ctx.arc(missileX, missileY, 26, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#be1eff';
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillText('MSL', missileX, missileY);

    // 4. WEAPON Slot Switch Button (Green/Cyan)
    const weaponX = W - 195;
    const weaponY = H - 210;
    ctx.strokeStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(weaponX, weaponY, 26, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#00ff88';
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillText('WPN', weaponX, weaponY);

    ctx.restore();
  }
}
