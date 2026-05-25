'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Player ship entity — handles movement physics, weapons systems,
 * shield/rapid-fire buffs, damage, invincibility, and death state.
 */
export class Player {
  constructor() {
    this.x = CONSTANTS.GAME_WIDTH / 2;
    this.y = CONSTANTS.GAME_HEIGHT - 100;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.hp = CONSTANTS.PLAYER_MAX_HP;
    this.maxHp = CONSTANTS.PLAYER_MAX_HP;
    this.active = true;
    this.alive = true;

    // Weapons
    this.fireCooldown = 0;
    this.missiles = CONSTANTS.PLAYER_START_MISSILES;
    this.maxMissiles = CONSTANTS.PLAYER_MAX_MISSILES;

    // Buffs
    this.shieldActive = false;
    this.shieldAlpha = 0;
    this.rapidFireTimer = 0;

    // Invincibility
    this.invTimer = 0;
    this.invFlashTimer = 0;
    this.visible = true;

    // Death
    this.deathTimer = 0;

    // Engine trail
    this.trailTimer = 0;

    // Tilt angle for visual banking
    this.tilt = 0;
  }

  /**
   * Resets player to initial spawn state
   */
  reset() {
    this.x = CONSTANTS.GAME_WIDTH / 2;
    this.y = CONSTANTS.GAME_HEIGHT - 100;
    this.vx = 0;
    this.vy = 0;
    this.hp = CONSTANTS.PLAYER_MAX_HP;
    this.active = true;
    this.alive = true;
    this.fireCooldown = 0;
    this.missiles = CONSTANTS.PLAYER_START_MISSILES;
    this.shieldActive = false;
    this.shieldAlpha = 0;
    this.rapidFireTimer = 0;
    this.invTimer = CONSTANTS.PLAYER_INVINCIBILITY_FRAMES;
    this.deathTimer = 0;
    this.tilt = 0;
  }

  /**
   * Core player update — reads input state, applies physics and manages buff timers
   * @param {import('../engine/Input.js').Input} input
   * @param {import('../engine/Pool.js').Pool} particlePool
   * @param {any[]} particles
   */
  update(input, particlePool, particles) {
    if (!this.alive) {
      this.deathTimer--;
      return;
    }

    // Movement input
    const speed = CONSTANTS.PLAYER_SPEED;
    if (input.isKeyDown('arrowleft') || input.isKeyDown('a')) this.vx -= speed;
    if (input.isKeyDown('arrowright') || input.isKeyDown('d')) this.vx += speed;
    if (input.isKeyDown('arrowup') || input.isKeyDown('w')) this.vy -= speed;
    if (input.isKeyDown('arrowdown') || input.isKeyDown('s')) this.vy += speed;

    // Apply friction
    this.vx *= CONSTANTS.PLAYER_FRICTION;
    this.vy *= CONSTANTS.PLAYER_FRICTION;

    // Visual tilt based on horizontal velocity
    this.tilt = this.vx * 0.06;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Clamp to screen bounds
    const pad = this.radius;
    this.x = Math.max(pad, Math.min(CONSTANTS.GAME_WIDTH - pad, this.x));
    this.y = Math.max(pad, Math.min(CONSTANTS.GAME_HEIGHT - pad, this.y));

    // Fire cooldown
    if (this.fireCooldown > 0) this.fireCooldown--;

    // Rapid fire timer
    if (this.rapidFireTimer > 0) this.rapidFireTimer--;

    // Shield decay
    if (this.shieldActive) {
      this.shieldAlpha -= CONSTANTS.PLAYER_SHIELD_DECAY;
      if (this.shieldAlpha <= 0) {
        this.shieldActive = false;
        this.shieldAlpha = 0;
      }
    }

    // Invincibility
    if (this.invTimer > 0) {
      this.invTimer--;
      this.invFlashTimer++;
      this.visible = this.invFlashTimer % 6 < 3;
    } else {
      this.visible = true;
    }

    // Engine trail particles
    this.trailTimer++;
    if (this.trailTimer % 3 === 0 && particlePool && particles) {
      const p = particlePool.obtain(
        this.x + (Math.random() * 6 - 3),
        this.y + this.radius + 2,
        (Math.random() * 2 - 1) * 0.3,
        Math.random() * 1.5 + 1.0,
        Math.random() > 0.5 ? '#00f3ff' : '#0066ff',
        12,
        Math.random() * 2 + 1
      );
      particles.push(p);
    }
  }

  /**
   * Returns the current fire cooldown value based on rapid-fire buff
   * @returns {number}
   */
  getFireCooldown() {
    return this.rapidFireTimer > 0
      ? CONSTANTS.PLAYER_RAPID_COOLDOWN
      : CONSTANTS.PLAYER_BASE_COOLDOWN;
  }

  /**
   * Applies damage to the player, considering shield absorption
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.invTimer > 0) return;

    if (this.shieldActive) {
      // Shield absorbs all damage
      this.shieldAlpha -= 0.25;
      if (this.shieldAlpha <= 0) {
        this.shieldActive = false;
        this.shieldAlpha = 0;
      }
      return;
    }

    this.hp -= amount;
    this.invTimer = 20; // Brief invincibility after hit

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.active = false;
      this.deathTimer = CONSTANTS.PLAYER_DEATH_TIMEOUT;
    }
  }

  /**
   * Heals the player
   * @param {number} amount
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Activates shield buff
   */
  activateShield() {
    this.shieldActive = true;
    this.shieldAlpha = 1.0;
  }

  /**
   * Activates rapid-fire buff
   */
  activateRapidFire() {
    this.rapidFireTimer = CONSTANTS.PLAYER_RAPID_DURATION;
  }

  /**
   * Adds missiles to inventory
   * @param {number} count
   */
  addMissiles(count) {
    this.missiles = Math.min(this.maxMissiles, this.missiles + count);
  }

  /**
   * Renders the player ship as a premium vector polygon
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.alive || !this.visible) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    // Engine glow
    ctx.shadowColor = CONSTANTS.COLORS.PLAYER;
    ctx.shadowBlur = 15;

    // Main fuselage — angular fighter shape
    ctx.fillStyle = CONSTANTS.COLORS.PLAYER;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius - 4);   // Nose
    ctx.lineTo(-8, -2);                 // Left shoulder
    ctx.lineTo(-12, this.radius);       // Left wing tip
    ctx.lineTo(-4, this.radius - 4);    // Left inner wing
    ctx.lineTo(0, this.radius + 2);     // Tail center
    ctx.lineTo(4, this.radius - 4);     // Right inner wing
    ctx.lineTo(12, this.radius);        // Right wing tip
    ctx.lineTo(8, -2);                  // Right shoulder
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit canopy
    ctx.fillStyle = '#003050';
    ctx.strokeStyle = '#00d0ff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(-3, -3);
    ctx.lineTo(0, 2);
    ctx.lineTo(3, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Engine exhaust nozzles (twin flame dots)
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.arc(-4, this.radius - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, this.radius - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Shield overlay
    if (this.shieldActive) {
      ctx.save();
      ctx.globalAlpha = this.shieldAlpha * 0.4;
      ctx.strokeStyle = CONSTANTS.COLORS.SHIELD;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = CONSTANTS.COLORS.SHIELD;
      ctx.shadowBlur = 20;

      const shieldRadius = this.radius + 10 + Math.sin(Date.now() * 0.008) * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner hex grid pattern
      ctx.globalAlpha = this.shieldAlpha * 0.15;
      ctx.fillStyle = CONSTANTS.COLORS.SHIELD;
      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldRadius - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Rapid fire indicator
    if (this.rapidFireTimer > 0) {
      ctx.save();
      const flashAlpha = 0.3 + Math.sin(Date.now() * 0.015) * 0.2;
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = CONSTANTS.COLORS.POWERUP_RAPID;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
