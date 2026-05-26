'use strict';

import { CONSTANTS } from '../config/constants.js';
import { WEAPON_DEFS } from '../config/weaponDefs.js';

/**
 * Handles the continuous player Laser Beam weapon.
 * Casts a vertical ray, detects closest enemy intersections using circle-ray math,
 * handles thermal heating/overheating states, and emits spark particles on impact.
 */
export class Laser {
  constructor() {
    this.active = false;
    this.heat = 0;             // 0 to 120
    this.overheated = false;   // lock state until cooled to 0
    this.currentLength = WEAPON_DEFS.LASER.RANGE;
    this.hitEnemy = null;
    this.impactX = 0;
    this.impactY = 0;
  }

  /**
   * Updates laser state, ray casting, and thermal regulation
   * @param {Object} player 
   * @param {Array} enemies 
   * @param {Object} particlePool 
   * @param {number} dt 
   * @param {Object} audio 
   */
  update(player, enemies, particlePool, dt, audio) {
    const isFiring = player.input.isKeyDown(' ') && player.weaponSystem.activeWeapon === 'LASER';
    
    // 1. Thermal management
    if (isFiring && !this.overheated) {
      this.active = true;
      
      // Heat increases at 60 units per second (2.0s to overheat)
      this.heat += dt * 60;
      if (this.heat >= WEAPON_DEFS.LASER.OVERHEAT_LIMIT) {
        this.heat = WEAPON_DEFS.LASER.OVERHEAT_LIMIT;
        this.overheated = true;
        this.active = false;
        audio.stopLaserHum();
      }
    } else {
      this.active = false;
      audio.stopLaserHum();

      // Cooling rate
      if (this.overheated) {
        // Overheated: cools to 0 over 90 frames (1.5 seconds)
        this.heat -= dt * (WEAPON_DEFS.LASER.OVERHEAT_LIMIT / WEAPON_DEFS.LASER.COOL_DURATION) * 60;
        if (this.heat <= 0) {
          this.heat = 0;
          this.overheated = false;
        }
      } else {
        // Normal cooling (cooldown of unused laser)
        this.heat = Math.max(0, this.heat - dt * 90);
      }
    }

    if (!this.active) {
      this.hitEnemy = null;
      return;
    }

    // 2. Continuous laser hum sound
    audio.startLaserHum();

    // 3. Ray casting intersection math
    const startX = player.x;
    const startY = player.y - 22; // offset from ship nose
    let minLength = WEAPON_DEFS.LASER.RANGE;
    let closestEnemy = null;
    let closestY = startY - WEAPON_DEFS.LASER.RANGE;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.alive || enemy.y > startY) continue;

      // Vertical ray intersection check:
      // Laser X is startX. If enemy X is within radius of laser X, we have intersection.
      const dx = Math.abs(enemy.x - startX);
      if (dx <= enemy.radius) {
        // Compute bottom intersection Y of circle:
        // (y - enemy.y)^2 = radius^2 - dx^2
        const dy = Math.sqrt(enemy.radius * enemy.radius - dx * dx);
        const intersectY = enemy.y + dy;

        // Verify it is above the player and within range
        if (intersectY < startY && intersectY >= startY - WEAPON_DEFS.LASER.RANGE) {
          const distance = startY - intersectY;
          if (distance < minLength) {
            minLength = distance;
            closestEnemy = enemy;
            closestY = intersectY;
          }
        }
      }
    }

    this.currentLength = minLength;
    this.hitEnemy = closestEnemy;
    this.impactX = startX;
    this.impactY = closestY;

    // 4. Handle impact triggers
    if (this.hitEnemy) {
      // Apply weapon scaling (damage multiplier) from player powerups if active
      const dmgMultiplier = player.weaponSystem.damageMultiplier;
      const damageTick = WEAPON_DEFS.LASER.DAMAGE * dmgMultiplier * dt * 60;
      
      // Dreadnought shield bullet absorption check
      let hitWeakpoint = true;
      if (this.hitEnemy.type === 'dreadnought') {
        // Dreadnought absorbs bullets from below unless hitting glowing weak point (top center)
        // If impact point is not near the weakpoint (top center), absorb it
        const weakPointX = this.hitEnemy.x;
        const weakPointY = this.hitEnemy.y - 25; // weak point is at top center R:8
        const distToWeak = Math.hypot(startX - weakPointX, closestY - weakPointY);
        if (distToWeak > 14) {
          hitWeakpoint = false;
        }
      }

      if (hitWeakpoint) {
        this.hitEnemy.takeDamage(damageTick);
      } else {
        // Absorbed by dreadnought armor
        audio.playShieldAbsorb();
      }

      // Spark particle bursts at impact point
      const sparkCount = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < sparkCount; j++) {
        const spark = particlePool.obtain();
        if (spark) {
          // Initialize short-lived spark sparks
          const angle = Math.PI / 2 + (Math.random() * 1.2 - 0.6); // spray downwards
          const speed = Math.random() * 120 + 80;
          spark.init(
            this.impactX, 
            this.impactY, 
            Math.cos(angle) * speed, 
            Math.sin(angle) * speed, 
            0.15 + Math.random() * 0.1, 
            '#00ffff', 
            Math.random() * 1.5 + 1.0
          );
        }
      }

      // Play laser impact high-frequency sizzle
      audio.playLaserImpact();
    }
  }

  /**
   * Renders the laser beam with a glowing core and distortion shimmers
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} player
   */
  draw(ctx, player) {
    if (!this.active) return;

    const startX = player.x;
    const startY = player.y - 22;
    const endY = startY - this.currentLength;

    ctx.save();
    
    // Additive screen glow
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    // 1. Shimmering outer cyan glow
    // Randomly fluctuate glow width to simulate distortion shimmer
    const shimmer = Math.random() * 4 - 2;
    const glowWidth = Math.max(4, WEAPON_DEFS.LASER.GLOW_WIDTH + shimmer);

    ctx.strokeStyle = WEAPON_DEFS.LASER.COLOR_GLOW;
    ctx.lineWidth = glowWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, endY);
    ctx.stroke();

    // Secondary lighter overlay glow
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = glowWidth + 6;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, endY);
    ctx.stroke();

    // 2. Pure white hot central core
    ctx.strokeStyle = WEAPON_DEFS.LASER.COLOR_CORE;
    ctx.lineWidth = WEAPON_DEFS.LASER.CORE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, endY);
    ctx.stroke();

    ctx.restore();
  }
}
