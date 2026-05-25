'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Homing rocket launched by the player that targets and chases the closest enemy.
 */
export class Missile {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 7;
    this.speed = 1.5;
    this.maxSpeed = 8.5;
    this.turnRate = 0.082; // Angular turn rate (steering interpolation factor)
    this.damage = 75;      // High payload damage
    this.color = CONSTANTS.COLORS.MISSILE;
    this.active = false;
    
    /** @type {any|null} Target enemy reference */
    this.target = null;
    this.trailTimer = 0;
  }

  /**
   * Initializes missile coordinates and velocities.
   * @param {number} x 
   * @param {number} y 
   * @param {number} vx 
   * @param {number} vy 
   */
  init(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = Math.hypot(vx, vy) || 2;
    this.active = true;
    this.target = null;
    this.trailTimer = 0;
  }

  /**
   * Evaluates active target steering and emits engine trails
   * @param {any[]} enemies - Array of active enemies
   * @param {any} particlePool - Reference to particle pool for trails
   */
  update(enemies, particlePool) {
    if (!this.active) return;

    // Acquire or re-validate nearest target
    this.acquireTarget(enemies);

    if (this.target && this.target.active) {
      // Calculate normalized steering vector towards target
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0) {
        const targetVx = (dx / distance) * this.speed;
        const targetVy = (dy / distance) * this.speed;

        // Interpolate velocity vector (Steering force)
        this.vx += (targetVx - this.vx) * this.turnRate;
        this.vy += (targetVy - this.vy) * this.turnRate;
      }
    }

    // Accelerate to maximum speed
    if (this.speed < this.maxSpeed) {
      this.speed += 0.22;
    }

    // Normalize velocity vector and scale to active speed
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > 0) {
      this.vx = (this.vx / currentSpeed) * this.speed;
      this.vy = (this.vy / currentSpeed) * this.speed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundary checking (Deactivate if out of window boundaries)
    const padding = 50;
    if (
      this.x < -padding || 
      this.x > CONSTANTS.GAME_WIDTH + padding || 
      this.y < -padding || 
      this.y > CONSTANTS.GAME_HEIGHT + padding
    ) {
      this.active = false;
    }

    // Generate exhaust particles behind rocket body
    this.trailTimer++;
    if (this.active && this.trailTimer % 2 === 0) {
      this.spawnTrail(particlePool);
    }
  }

  /**
   * Scans active enemies to find and lock onto the closest target
   * @param {any[]} enemies 
   */
  acquireTarget(enemies) {
    if (this.target && this.target.active) return; // Retain lock
    
    let closestEnemy = null;
    let minDistance = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.active || enemy.type === 'boss_entering') continue;

      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestEnemy = enemy;
      }
    }

    this.target = closestEnemy;
  }

  /**
   * Emits rocket thruster particles into pool
   * @param {any} pool 
   */
  spawnTrail(pool) {
    const speed = Math.hypot(this.vx, this.vy) || 1;
    // Calculate vector pointing directly opposite of velocity
    const backX = -this.vx / speed;
    const backY = -this.vy / speed;

    // Offset position to emerge from exhaust nozzle
    const px = this.x + backX * 8;
    const py = this.y + backY * 8;

    // Slight variance to particles
    const pvx = backX * 1.5 + (Math.random() * 2 - 1) * 0.4;
    const pvy = backY * 1.5 + (Math.random() * 2 - 1) * 0.4;

    // Add trailing exhaust particle (fading orange/purple color)
    const color = Math.random() > 0.4 ? '#d21eff' : '#ff5500';
    pool.obtain(px, py, pvx, pvy, color, 14, 2.5);
  }

  /**
   * Renders a premium glowing vector-based homing rocket
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    
    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Glow effects
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // Fins / Wings
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    // Rocket Fuselage (Body)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(4, -3);
    ctx.quadraticCurveTo(10, 0, 4, 3);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fuselage Glass Nose Cone
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
