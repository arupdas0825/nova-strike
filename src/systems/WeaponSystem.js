'use strict';

import { CONSTANTS } from '../config/constants.js';
import { WEAPON_DEFS } from '../config/weaponDefs.js';

/**
 * Orchestrates player weaponry: weapon cycling (Plasma -> Spread -> Laser),
 * fire rate regulation, active power-up tracking, and ammunition releases.
 */
export class WeaponSystem {
  /**
   * @param {Object} player 
   */
  constructor(player) {
    this.player = player;

    this.weaponsList = ['PLASMA', 'SPREAD', 'LASER'];
    this.activeIndex = 0; // default PLASMA

    this.cooldown = 0;             // frame-rate independent countdown (at 60hz base)
    this.missileCooldown = 0;      // homing missile refire lag

    // Active power-up buffs
    this.rapidFireTimer = 0;       // frames remaining
    this.weaponUpgradeTimer = 0;   // frames remaining
  }

  get activeWeapon() {
    return this.weaponsList[this.activeIndex];
  }

  get damageMultiplier() {
    return this.weaponUpgradeTimer > 0 ? 1.5 : 1.0;
  }

  get isRapidFireActive() {
    return this.rapidFireTimer > 0;
  }

  /**
   * Cycle player weapons: PLASMA -> SPREAD -> LASER
   * @param {Object} audio 
   */
  switchWeapon(audio) {
    this.activeIndex = (this.activeIndex + 1) % this.weaponsList.length;
    audio.playWeaponSwitch();
  }

  /**
   * Updates cooldowns and powerup timers frame-rate independently
   * @param {number} dt 
   */
  update(dt) {
    const ticks = dt * 60; // conversion to nominal frames

    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - ticks);
    }
    if (this.missileCooldown > 0) {
      this.missileCooldown = Math.max(0, this.missileCooldown - ticks);
    }

    if (this.rapidFireTimer > 0) {
      this.rapidFireTimer = Math.max(0, this.rapidFireTimer - ticks);
    }
    if (this.weaponUpgradeTimer > 0) {
      this.weaponUpgradeTimer = Math.max(0, this.weaponUpgradeTimer - ticks);
    }
  }

  /**
   * Attempt to fire the active primary weapon
   * @param {number} x 
   * @param {number} y 
   * @param {Object} bulletPool 
   * @param {Object} audio 
   */
  firePrimary(x, y, bulletPool, audio) {
    if (this.cooldown > 0) return;

    const type = this.activeWeapon;
    const dmg = WEAPON_DEFS[type].DAMAGE * this.damageMultiplier;

    if (type === 'PLASMA') {
      audio.playPlasma();
      
      const bullet = bulletPool.obtain();
      if (bullet) {
        // Plasma: cyan color, elongated orb, travels straight up
        bullet.init(
          x, 
          y - 20, 
          0, 
          -WEAPON_DEFS.PLASMA.SPEED, 
          dmg, 
          'player_plasma', 
          WEAPON_DEFS.PLASMA.COLOR
        );
      }

      this.cooldown = this.isRapidFireActive 
        ? WEAPON_DEFS.PLASMA.RAPID_COOLDOWN 
        : WEAPON_DEFS.PLASMA.COOLDOWN;

    } else if (type === 'SPREAD') {
      audio.playSpread();

      // Spread: 3 bolts in fan pattern at -14°, 0°, +14° angles
      const count = WEAPON_DEFS.SPREAD.COUNT;
      const angleStep = WEAPON_DEFS.SPREAD.SPREAD_ANGLE;
      const speed = WEAPON_DEFS.SPREAD.SPEED;

      for (let i = 0; i < count; i++) {
        const bullet = bulletPool.obtain();
        if (bullet) {
          const angle = -angleStep + (i * angleStep); // -14, 0, +14
          const vx = Math.sin(angle) * speed;
          const vy = -Math.cos(angle) * speed;

          bullet.init(
            x, 
            y - 18, 
            vx, 
            vy, 
            dmg, 
            'player_spread', 
            WEAPON_DEFS.SPREAD.COLOR
          );
        }
      }

      this.cooldown = this.isRapidFireActive 
        ? WEAPON_DEFS.SPREAD.RAPID_COOLDOWN 
        : WEAPON_DEFS.SPREAD.COOLDOWN;
    }
  }

  /**
   * Fires a homing missile at the designated target
   * @param {number} x 
   * @param {number} y 
   * @param {Object} target 
   * @param {Object} missilePool 
   * @param {Object} audio 
   */
  fireHomingMissile(x, y, target, missilePool, audio) {
    if (this.missileCooldown > 0 || this.player.missiles <= 0) return;

    this.player.missiles--;
    audio.playMissileLaunch();

    const missile = missilePool.obtain();
    if (missile) {
      // Spawn homing missile drifting upwards initially
      missile.init(x, y - 10, 0, -220, target);
    }

    this.missileCooldown = 28; // refire delay
  }

  /**
   * Activate Rapid Fire powerup
   */
  activateRapidFire() {
    this.rapidFireTimer = CONSTANTS.RAPID_FIRE_DURATION;
  }

  /**
   * Activate Damage Upgrade powerup
   */
  activateWeaponUpgrade() {
    this.weaponUpgradeTimer = CONSTANTS.WEAPON_UPGRADE_DURATION;
  }
}
