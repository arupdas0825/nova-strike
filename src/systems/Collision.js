'use strict';

import { CONSTANTS } from '../config/constants.js';
import { PowerUp } from '../entities/PowerUp.js';

/**
 * Manages all collision detection between game entities using
 * efficient circle-circle intersection tests.
 */
export class Collision {
  /**
   * @param {object} game - Reference to the main Game instance for entity access
   */
  constructor(game) {
    this.game = game;
  }

  /**
   * Runs all collision checks for a single frame
   */
  update() {
    this._bulletsVsEnemies();
    this._bulletsVsPlayer();
    this._missilesVsEnemies();
    this._enemiesVsPlayer();
    this._powerupsVsPlayer();
  }

  /**
   * Circle-circle intersection test
   * @param {number} x1
   * @param {number} y1
   * @param {number} r1
   * @param {number} x2
   * @param {number} y2
   * @param {number} r2
   * @returns {boolean}
   */
  _circleHit(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sumR = r1 + r2;
    return (dx * dx + dy * dy) < (sumR * sumR);
  }

  /** Player bullets hitting enemies */
  _bulletsVsEnemies() {
    const { bullets, enemies, bulletPool, particlePool, particles, audio, camera, scoreSystem } = this.game;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active || !b.fromPlayer) continue;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e.active) continue;

        if (this._circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
          b.active = false;

          const killed = e.takeDamage(b.damage);

          if (killed) {
            this._spawnExplosion(e.x, e.y, e.color, e.isBoss ? 45 : 18);
            audio.playExplode(e.isBoss);
            camera.shake(e.isBoss ? 14 : 5);
            scoreSystem.addKill(e.points, e.x, e.y, e.isBoss);
            this._tryDropPowerUp(e.x, e.y, e.isBoss);
          } else {
            // Hit spark
            this._spawnSparks(b.x, b.y, '#ffffff', 4);
            audio.playHit();
          }
          break;
        }
      }
    }
  }

  /** Enemy bullets hitting player */
  _bulletsVsPlayer() {
    const { bullets, player, audio, camera, particlePool, particles } = this.game;
    if (!player.alive || player.invTimer > 0) return;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active || b.fromPlayer) continue;

      if (this._circleHit(b.x, b.y, b.radius, player.x, player.y, player.radius)) {
        b.active = false;
        player.takeDamage(b.damage);
        audio.playHit();
        camera.shake(3);
        this._spawnSparks(player.x, player.y, CONSTANTS.COLORS.PLAYER, 6);
      }
    }
  }

  /** Player missiles hitting enemies */
  _missilesVsEnemies() {
    const { missiles, enemies, audio, camera, scoreSystem, particlePool, particles } = this.game;

    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      if (!m.active) continue;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e.active) continue;

        if (this._circleHit(m.x, m.y, m.radius, e.x, e.y, e.radius)) {
          m.active = false;

          const killed = e.takeDamage(m.damage);

          if (killed) {
            this._spawnExplosion(e.x, e.y, e.color, e.isBoss ? 50 : 25);
            audio.playExplode(e.isBoss);
            camera.shake(e.isBoss ? 16 : 8);
            scoreSystem.addKill(e.points, e.x, e.y, e.isBoss);
            this._tryDropPowerUp(e.x, e.y, e.isBoss);
          } else {
            this._spawnExplosion(m.x, m.y, CONSTANTS.COLORS.MISSILE, 12);
            audio.playExplode(false);
            camera.shake(4);
          }
          break;
        }
      }
    }
  }

  /** Enemies colliding with player (body collision) */
  _enemiesVsPlayer() {
    const { enemies, player, audio, camera } = this.game;
    if (!player.alive || player.invTimer > 0) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.active) continue;

      if (this._circleHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
        player.takeDamage(e.damage);
        audio.playHit();
        camera.shake(6);
        this._spawnSparks(player.x, player.y, CONSTANTS.COLORS.PLAYER, 8);
      }
    }
  }

  /** Power-ups collected by player */
  _powerupsVsPlayer() {
    const { powerups, player, audio } = this.game;
    if (!player.alive) return;

    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      if (!pu.active) continue;

      if (this._circleHit(pu.x, pu.y, pu.radius, player.x, player.y, player.radius)) {
        this._applyPowerUp(pu);
        pu.active = false;
        audio.playPowerUp();
        this._spawnSparks(pu.x, pu.y, pu.color, 10);
      }
    }
  }

  /**
   * Applies power-up effect to the player
   * @param {import('../entities/PowerUp.js').PowerUp} pu
   */
  _applyPowerUp(pu) {
    const { player } = this.game;
    switch (pu.type) {
      case PowerUp.TYPES.HEALTH:
        player.heal(30);
        break;
      case PowerUp.TYPES.RAPID:
        player.activateRapidFire();
        break;
      case PowerUp.TYPES.SHIELD:
        player.activateShield();
        break;
      case PowerUp.TYPES.MISSILE:
        player.addMissiles(3);
        break;
    }
  }

  /**
   * Attempts to drop a power-up at the given position
   * @param {number} x
   * @param {number} y
   * @param {boolean} isBoss
   */
  _tryDropPowerUp(x, y, isBoss) {
    const { powerupPool, powerups } = this.game;

    if (isBoss) {
      // Boss drops multiple power-ups
      const types = Object.values(PowerUp.TYPES);
      for (let i = 0; i < CONSTANTS.POWERUP_BOSS_DROP_COUNT; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const px = x + (Math.random() * 60 - 30);
        const py = y + (Math.random() * 40 - 20);
        const pu = powerupPool.obtain(px, py, type);
        powerups.push(pu);
      }
    } else if (Math.random() < CONSTANTS.POWERUP_DROP_CHANCE) {
      const types = Object.values(PowerUp.TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const pu = powerupPool.obtain(x, y, type);
      powerups.push(pu);
    }
  }

  /**
   * Spawns explosion particles
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} count
   */
  _spawnExplosion(x, y, color, count) {
    const { particlePool, particles } = this.game;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + 1;
      const life = Math.floor(Math.random() * 25) + 15;

      const p = particlePool.obtain(x, y, vx, vy, color, life, size);
      particles.push(p);
    }
  }

  /**
   * Spawns small spark particles
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} count
   */
  _spawnSparks(x, y, color, count) {
    const { particlePool, particles } = this.game;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      const p = particlePool.obtain(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        Math.floor(Math.random() * 12) + 8,
        Math.random() * 2 + 0.5
      );
      particles.push(p);
    }
  }
}
