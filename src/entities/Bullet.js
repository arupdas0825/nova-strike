'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Standard laser projectile fired by player and enemies.
 */
export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4;
    this.color = '#ffffff';
    this.damage = 10;
    this.fromPlayer = false;
    this.active = false;
  }

  /**
   * Initializes the bullet's values for reuse from the object pool.
   * @param {number} x 
   * @param {number} y 
   * @param {number} vx 
   * @param {number} vy 
   * @param {string} color 
   * @param {number} damage 
   * @param {boolean} fromPlayer 
   */
  init(x, y, vx, vy, color, damage, fromPlayer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = fromPlayer ? 3.5 : 4.5;
    this.color = color;
    this.damage = damage;
    this.fromPlayer = fromPlayer;
    this.active = true;
  }

  /**
   * Updates bullet position. Flags active as false when it exits logical screen bounds.
   */
  update() {
    if (!this.active) return;

    this.x += this.vx;
    this.y += this.vy;

    // Despawn padding around logical bounds
    const pad = 30;
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
   * Draws a sleek, glowing capsule laser projectile
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    
    // Draw neon capsule line representing high-speed laser
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 2;
    ctx.lineCap = 'round';
    
    // Velocity vector direction line
    const speed = Math.hypot(this.vx, this.vy);
    const lengthMultiplier = 1.8;
    const dx = (this.vx / speed) * this.radius * lengthMultiplier;
    const dy = (this.vy / speed) * this.radius * lengthMultiplier;

    ctx.beginPath();
    ctx.moveTo(this.x - dx, this.y - dy);
    ctx.lineTo(this.x + dx, this.y + dy);
    ctx.stroke();

    ctx.restore();
  }
}
