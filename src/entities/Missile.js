'use strict';

import { CONSTANTS } from '../config/constants.js';
import { WEAPON_DEFS } from '../config/weaponDefs.js';

/**
 * Player Homing Missile.
 * Employs predictive intercept (lead targeting) calculation to home in on the
 * predicted future position of enemies. Driven by Verlet thrust vectors, leaving
 * a 20-point cyan exhaust trail, and drawing an orange lock UI target indicator.
 */
export class Missile {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 7;
    this.damage = WEAPON_DEFS.MISSILE.DAMAGE;
    this.color = WEAPON_DEFS.MISSILE.COLOR;
    this.active = false;
    this.target = null;
    
    // 20-point smoke trail history
    this.trail = [];
    this.trailTimer = 0;

    // Lock visual pulse timer
    this.lockPulse = 0;
  }

  /**
   * Initializes or recycles a missile instance from the pool
   * @param {number} x 
   * @param {number} y 
   * @param {number} vx - initial ejection x velocity
   * @param {number} vy - initial ejection y velocity
   * @param {Object} target - starting enemy target lock
   */
  init(x, y, vx, vy, target = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
    this.target = target;
    this.trail = [];
    this.trailTimer = 0;
    this.lockPulse = 0;
  }

  /**
   * Performs predictive steering calculations and Verlet physics integrations
   * @param {Array} enemies 
   * @param {Object} particlePool 
   * @param {number} dt 
   */
  update(enemies, particlePool, dt) {
    if (!this.active) return;

    // 1. Maintain or acquire target
    this.acquireTarget(enemies);

    let targetX = this.x;
    let targetY = this.y - 400; // default straight up

    if (this.target && this.target.alive) {
      // 2. Predictive Lead Targeting:
      // Predict where the enemy will be based on its velocity and missile's distance
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Average speed of missile (approx 450 px/s)
      const avgMissileSpeed = 500;
      const timeToTarget = dist / avgMissileSpeed;

      // Predict target coordinates
      // Some enemies drift (e.g. Scouts zigzag, Fighters direct chase)
      targetX = this.target.x + (this.target.vx || 0) * timeToTarget;
      targetY = this.target.y + (this.target.vy || 0) * timeToTarget;

      // Pulse lock indicator
      this.lockPulse += dt * 5;
    } else {
      this.target = null;
    }

    // 3. Steering thrust vector toward target
    const tx = targetX - this.x;
    const ty = targetY - this.y;
    const tDist = Math.hypot(tx, ty);

    let ax = 0;
    let ay = -WEAPON_DEFS.MISSILE.THRUST; // default launch upwards

    if (tDist > 0) {
      ax = (tx / tDist) * WEAPON_DEFS.MISSILE.THRUST;
      ay = (ty / tDist) * WEAPON_DEFS.MISSILE.THRUST;
    }

    // Apply acceleration
    this.vx += ax * dt;
    this.vy += ay * dt;

    // Apply drag (friction: 0.96 per frame)
    const friction = Math.pow(WEAPON_DEFS.MISSILE.DRAG, dt * 60);
    this.vx *= friction;
    this.vy *= friction;

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Out of bounds cleanup
    const pad = 60;
    if (
      this.x < -pad || 
      this.x > CONSTANTS.GAME_WIDTH + pad || 
      this.y < -pad || 
      this.y > CONSTANTS.GAME_HEIGHT + pad
    ) {
      this.active = false;
    }

    // 4. Update 20-point cyan smoke trail history
    this.trailTimer++;
    if (this.trailTimer % 2 === 0) {
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > WEAPON_DEFS.MISSILE.TRAIL_POINTS) {
        this.trail.pop();
      }
    }
  }

  /**
   * Scans active enemies and locks on closest
   * @param {Array} enemies 
   */
  acquireTarget(enemies) {
    if (this.target && this.target.alive) return; // keep lock

    let closest = null;
    let minD = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.alive || enemy.y < -20) continue;

      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d < minD) {
        minD = d;
        closest = enemy;
      }
    }

    this.target = closest;
  }

  /**
   * Draws the missile fuselage, trailing flame, smoke path, and locking reticle.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    // 1. Draw 20-point tapering cyan smoke trail
    if (this.trail.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 136, 255, 0.18)';
      ctx.lineWidth = 7.0;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw Target Lock Indicator above the nearest locked enemy
    if (this.target && this.target.alive) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(this.target.x, this.target.y);
      
      // Spinner rotating animation
      ctx.rotate(this.lockPulse);

      const r = this.target.radius + 8 + Math.sin(this.lockPulse * 3) * 2;
      ctx.strokeStyle = '#ff7700'; // brief orange lock indicator
      ctx.lineWidth = 1.5;

      // Draw brackets instead of a complete circle for tech aesthetics
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r, i * Math.PI / 2 - 0.25, i * Math.PI / 2 + 0.25);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 3. Draw Missile Ship
    ctx.save();
    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Glowing thruster flame
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-13 - Math.random() * 6, 0);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();

    // Shadow envelope
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // Tail Fins
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-9, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-9, 7);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    // Missile body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -2.5);
    ctx.lineTo(3, -2.5);
    ctx.quadraticCurveTo(8, 0, 3, 2.5);
    ctx.lineTo(-6, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  get alive() {
    return this.active;
  }
}
