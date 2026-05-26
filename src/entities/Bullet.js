'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Projectiles fired by player and enemies.
 * Simulates drag-free linear trajectory under Verlet integration,
 * adapts visual representation based on weapon class (plasma orb, spread bolts, dreadnought surges).
 */
export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4;
    
    this.damage = 10;
    this.type = 'player_plasma'; // e.g. player_plasma, player_spread, enemy
    this.color = '#00ffff';
    this.fromPlayer = true;
    this.active = false;
  }

  /**
   * Initializes or recycles a bullet instance from the pool
   * @param {number} x 
   * @param {number} y 
   * @param {number} vx 
   * @param {number} vy 
   * @param {number} damage 
   * @param {string} type - projectile type category
   * @param {string} color - CSS hex color string
   */
  init(x, y, vx, vy, damage, type = 'player_plasma', color = '#00ffff') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    
    this.damage = damage;
    this.type = type;
    this.color = color;
    
    this.fromPlayer = type.startsWith('player_');
    this.radius = this.fromPlayer ? 3.5 : 4.5;
    this.active = true;
  }

  /**
   * Updates bullet position. Bullet physics in vacuum has NO drag (friction 1.0)
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    // Hostile homing missile steering logic
    if (this.type === 'enemy_missile') {
      const player = this.playerRef;
      if (player && player.alive) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          const speed = 230; // px/s
          const tx = (dx / dist) * speed;
          const ty = (dy / dist) * speed;
          
          // Steering interpolation toward player coordinates
          this.vx += (tx - this.vx) * dt * 3.5;
          this.vy += (ty - this.vy) * dt * 3.5;
        }
      }
    }

    // pos += vel * dt
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Despawn padding around logical boundary limits
    const pad = 40;
    if (
      this.x < -pad || 
      this.x > CONSTANTS.GAME_WIDTH + pad || 
      this.y < -pad || 
      this.y > CONSTANTS.GAME_HEIGHT + pad
    ) {
      this.active = false;
    }
  }

  /**
   * Renders sleek glowing bullets
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const speed = Math.hypot(this.vx, this.vy);
    const dx = speed > 0 ? (this.vx / speed) : 0;
    const dy = speed > 0 ? (this.vy / speed) : 0;

    if (this.type === 'player_plasma') {
      // 1. Plasma Cannon: elongated oval with glowing cyan core + short trail
      // Draw trailing segment
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = this.radius * 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 25, this.y - dy * 25);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Glowing outer envelope
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = this.radius * 1.8;
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 12, this.y - dy * 12);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 8, this.y - dy * 8);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

    } else if (this.type === 'player_spread') {
      // 2. Spread Shot: orange bolts, wider fan pattern
      ctx.strokeStyle = 'rgba(255, 120, 0, 0.35)';
      ctx.lineWidth = this.radius * 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 14, this.y - dy * 14);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = this.radius * 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 8, this.y - dy * 8);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.radius * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 5, this.y - dy * 5);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

    } else {
      // 3. Enemy standard bullets: color-coded glowing lasers
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.radius * 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 12, this.y - dy * 12);
      ctx.lineTo(this.x + dx * 2, this.y + dy * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.radius * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x - dx * 6, this.y - dy * 6);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  get alive() {
    return this.active;
  }
}
