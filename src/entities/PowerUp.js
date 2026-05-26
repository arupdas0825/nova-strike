'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Defeated enemy collectibles.
 * Renders 6 distinctive buff patterns (Health, Rapid Fire, Shield, Homing Ammunition,
 * Damage Boosters, and Tactical Nukes). Features rotating vector-hexagons, pulsing glows,
 * floating tech identifiers, and fading flashing warnings before deletion.
 */
export class PowerUp {
  static TYPES = {
    HEALTH: 'health',
    RAPID: 'rapid',
    SHIELD: 'shield',
    MISSILE: 'missile',
    WEAPON_UP: 'weaponup',
    NUKE: 'nuke'
  };

  constructor() {
    this.x = 0;
    this.y = 0;
    this.type = null;
    this.radius = 14;
    this.life = 0;             // frames remaining (720 max)
    
    this.color = '#ffffff';
    this.symbol = '?';
    this.label = '';
    this.active = false;

    // Rotation angle
    this.angle = 0;
  }

  /**
   * Initializes a power-up. Used by object pool.
   * @param {number} x 
   * @param {number} y 
   * @param {string} type 
   */
  init(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.life = CONSTANTS.POWERUP_LIFESPAN;
    this.active = true;
    this.angle = Math.random() * Math.PI;

    // Customize based on type
    switch (type) {
      case PowerUp.TYPES.HEALTH:
        this.color = CONSTANTS.COLORS.POWERUP_HEALTH;
        this.symbol = '♥';
        this.label = 'HEALTH';
        break;
      case PowerUp.TYPES.RAPID:
        this.color = CONSTANTS.COLORS.POWERUP_RAPID;
        this.symbol = '⚡';
        this.label = 'RAPIDFIRE';
        break;
      case PowerUp.TYPES.SHIELD:
        this.color = CONSTANTS.COLORS.POWERUP_SHIELD;
        this.symbol = '◈';
        this.label = 'SHIELD';
        break;
      case PowerUp.TYPES.MISSILE:
        this.color = CONSTANTS.COLORS.POWERUP_MISSILE;
        this.symbol = '◉';
        this.label = 'MISSILE';
        break;
      case PowerUp.TYPES.WEAPON_UP:
        this.color = CONSTANTS.COLORS.POWERUP_WEAPONUP;
        this.symbol = '★';
        this.label = 'WEAPON UP';
        break;
      case PowerUp.TYPES.NUKE:
        this.color = CONSTANTS.COLORS.POWERUP_NUKE;
        this.symbol = '☢';
        this.label = 'NUKE';
        break;
    }
  }

  /**
   * Moves power-up downwards at a constant rate and decrements life
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    // Standard descent (90 px/s)
    this.y += CONSTANTS.POWERUP_SPEED * dt;
    
    // Rotation increments
    this.angle += dt * 1.8; // 1.8 rad/s

    // Bound checks
    if (this.y > CONSTANTS.GAME_HEIGHT + 40) {
      this.active = false;
      return;
    }

    // Life ticks down
    this.life -= dt * 60;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  /**
   * Draws rotating tech hexagons + glowing tags
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    // Timeout flashing below 180 frames remaining
    if (this.life < CONSTANTS.POWERUP_FLASH_THRESHOLD) {
      const flashFrequency = 12; // frame toggle speed
      if (Math.floor(this.life / flashFrequency) % 2 === 0) {
        return; // skip draw frame to flash
      }
    }

    ctx.save();
    
    // Alpha fades out near end of life
    const alpha = this.life < 100 ? Math.max(0, this.life / 100) : 1.0;
    ctx.globalAlpha = alpha;

    // Pulsing outer bounds
    const pulse = 1.0 + Math.sin(this.life * 0.08) * 0.08;
    const r = this.radius * pulse;

    // Outer glow settings
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;

    // 1. Renders Rotating Hexagon outline
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = this.angle + (i * Math.PI / 3);
      const hx = this.x + Math.cos(a) * r;
      const hy = this.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Dark semi-transparent core fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = this.angle + (i * Math.PI / 3);
      const hx = this.x + Math.cos(a) * (r - 1.5);
      const hy = this.y + Math.sin(a) * (r - 1.5);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();

    // 2. Draw Central Icon Symbol
    ctx.fillStyle = this.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.symbol, this.x, this.y + 0.5);

    // 3. Floating label text tag (top-centered)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = 'bold 8px "Orbitron", sans-serif';
    ctx.fillText(this.label, this.x, this.y - r - 6);

    ctx.restore();
  }

  get alive() {
    return this.active;
  }
}
