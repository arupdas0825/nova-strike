'use strict';

import { CONSTANTS } from '../config/constants.js';
import { PowerUp } from '../entities/PowerUp.js';

/**
 * Spatial Hashing Grid helper to optimize broadphase collision checks to O(1) complexity.
 */
class SpatialHashGrid {
  /**
   * @param {number} cellSize 
   */
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = {};
    this.retrievedList = [];
    this.queryId = 0;
  }

  /**
   * Clears grid bins without GC allocation hits
   */
  clear() {
    for (const key in this.grid) {
      this.grid[key].length = 0;
    }
  }

  /**
   * Inserts an active circular bounding entity into overlapping grid cells
   * @param {Object} entity 
   */
  insert(entity) {
    const colStart = Math.floor((entity.x - entity.radius) / this.cellSize);
    const colEnd = Math.floor((entity.x + entity.radius) / this.cellSize);
    const rowStart = Math.floor((entity.y - entity.radius) / this.cellSize);
    const rowEnd = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let c = colStart; c <= colEnd; c++) {
      for (let r = rowStart; r <= rowEnd; r++) {
        const key = `${c},${r}`;
        if (!this.grid[key]) {
          this.grid[key] = [];
        }
        this.grid[key].push(entity);
      }
    }
  }

  /**
   * Retrieves all candidate entities intersecting cells overlapping query limits
   * @param {Object} entity 
   * @returns {Array} Zero-allocation candidates array
   */
  retrieve(entity) {
    this.queryId++;
    this.retrievedList.length = 0;

    const colStart = Math.floor((entity.x - entity.radius) / this.cellSize);
    const colEnd = Math.floor((entity.x + entity.radius) / this.cellSize);
    const rowStart = Math.floor((entity.y - entity.radius) / this.cellSize);
    const rowEnd = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let c = colStart; c <= colEnd; c++) {
      for (let r = rowStart; r <= rowEnd; r++) {
        const key = `${c},${r}`;
        const cell = this.grid[key];
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const ent = cell[i];
            if (ent._queryId !== this.queryId) {
              ent._queryId = this.queryId;
              this.retrievedList.push(ent);
            }
          }
        }
      }
    }
    return this.retrievedList;
  }
}

/**
 * Spatial-hash collision solver.
 * Handles primary-bullet, homing missile, player chassis, and powerups interactions.
 */
export class Collision {
  /**
   * @param {Object} game 
   */
  constructor(game) {
    this.game = game;
    this.grid = new SpatialHashGrid(64); // 64px spatial hash cells
  }

  /**
   * Re-hashes and updates all collision systems
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    // 1. Re-build spatial hash grid for all active enemies
    this.grid.clear();
    const enemies = this.game.enemies;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.active) {
        this.grid.insert(e);
      }
    }

    // 2. Perform broadphase checked sweeps
    this._bulletsVsEnemies();
    this._bulletsVsPlayer();
    this._missilesVsEnemies();
    this._enemiesVsPlayer();
    this._powerupsVsPlayer();
  }

  /**
   * Squared circle-circle distance check (eliminates Math.sqrt)
   */
  _circleHit(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sumR = r1 + r2;
    return (dx * dx + dy * dy) < (sumR * sumR);
  }

  /**
   * Player bullets hitting enemies (optimized via Spatial Grid lookup)
   */
  _bulletsVsEnemies() {
    const { bullets, explosions, explosionPool, particlePool, audio, camera, scoreSystem } = this.game;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active || !b.fromPlayer) continue;

      // O(1) broadphase candidates retrieve
      const candidates = this.grid.retrieve(b);

      for (let j = 0; j < candidates.length; j++) {
        const e = candidates[j];
        if (!e.active) continue;

        if (this._circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
          
          // Dreadnought armored bottom absorbing logic
          let hitWeakpoint = true;
          if (e.type === 'dreadnought') {
            const weakPointX = e.x;
            const weakPointY = e.y - 25; // weak point center top R:8
            const distToWeak = Math.hypot(b.x - weakPointX, b.y - weakPointY);
            
            if (distToWeak > 14) {
              hitWeakpoint = false;
            }
          }

          b.active = false;

          if (hitWeakpoint) {
            const killed = e.takeDamage(b.damage);

            if (killed) {
              // Create dynamic shockwave ring explosion
              const expSize = e.isBoss ? 90 : (e.type === 'dreadnought' ? 65 : (e.type === 'bomber' ? 50 : 35));
              const exp = explosionPool.obtain(e.x, e.y, expSize, e.isBoss);
              explosions.push(exp);

              // Bomber drops 3 homing mines on death
              if (e.type === 'bomber') {
                this.game.spawner.spawnHomingMines(e.x, e.y);
              }

              audio.playExplode(e.isBoss);
              camera.shake(e.isBoss ? 0.95 : (e.type === 'dreadnought' ? 0.55 : 0.28));
              scoreSystem.addKill(e.points, e.x, e.y, e.isBoss);
              this._tryDropPowerUp(e.x, e.y, e.isBoss);
            } else {
              // Neon impact flash sparks
              this._spawnSparks(b.x, b.y, '#ffffff', 3);
              audio.playHit();
            }
          } else {
            // Bullet absorbed by Dreadnought shield armor
            this._spawnSparks(b.x, b.y, '#be1eff', 5);
            audio.playShieldAbsorb();
          }

          break; // break inner loop, bullet is spent
        }
      }
    }
  }

  /**
   * Enemy bullets hitting player
   */
  _bulletsVsPlayer() {
    const { bullets, player, camera, audio } = this.game;
    if (!player.alive || player.invTimer > 0) return;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active || b.fromPlayer) continue;

      if (this._circleHit(b.x, b.y, b.radius, player.x, player.y, player.radius)) {
        b.active = false;
        player.takeDamage(b.damage, camera, audio);
        
        // Neon player sparks
        this._spawnSparks(player.x, player.y, CONSTANTS.COLORS.PLAYER, 5);
      }
    }
  }

  /**
   * Player homing missiles hitting enemies (Spatial broadphase optimized)
   */
  _missilesVsEnemies() {
    const { missiles, explosions, explosionPool, audio, camera, scoreSystem } = this.game;

    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      if (!m.active) continue;

      const candidates = this.grid.retrieve(m);

      for (let j = 0; j < candidates.length; j++) {
        const e = candidates[j];
        if (!e.active) continue;

        if (this._circleHit(m.x, m.y, m.radius, e.x, e.y, e.radius)) {
          m.active = false;

          const killed = e.takeDamage(m.damage);

          if (killed) {
            const expSize = e.isBoss ? 95 : (e.type === 'dreadnought' ? 70 : 45);
            const exp = explosionPool.obtain(e.x, e.y, expSize, e.isBoss);
            explosions.push(exp);

            if (e.type === 'bomber') {
              this.game.spawner.spawnHomingMines(e.x, e.y);
            }

            audio.playExplode(e.isBoss);
            camera.shake(e.isBoss ? 0.95 : 0.45);
            scoreSystem.addKill(e.points, e.x, e.y, e.isBoss);
            this._tryDropPowerUp(e.x, e.y, e.isBoss);
          } else {
            // Missile detonates on body
            const exp = explosionPool.obtain(m.x, m.y, 25, false);
            explosions.push(exp);
            audio.playExplosionSmall();
            camera.shake(0.2);
          }
          break;
        }
      }
    }
  }

  /**
   * Enemies colliding with player (Chassis collision)
   */
  _enemiesVsPlayer() {
    const { enemies, player, camera, audio } = this.game;
    if (!player.alive || player.invTimer > 0) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.active) continue;

      if (this._circleHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
        // Mine explodes instantly on contact
        if (e.type === 'mine') {
          e.active = false;
          const exp = this.game.explosionPool.obtain(e.x, e.y, 35, false);
          this.game.explosions.push(exp);
          audio.playExplosionSmall();
        }

        player.takeDamage(e.damage, camera, audio);
        this._spawnSparks(player.x, player.y, CONSTANTS.COLORS.PLAYER, 7);
      }
    }
  }

  /**
   * Powerups collected by player
   */
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
        this._spawnSparks(pu.x, pu.y, pu.color, 12);
      }
    }
  }

  /**
   * Applies the powerup's custom mechanics to player and trigger screen shockwaves
   */
  _applyPowerUp(pu) {
    const { player, enemies, explosions, explosionPool, audio, camera, scoreSystem } = this.game;
    
    switch (pu.type) {
      case PowerUp.TYPES.HEALTH:
        // +60 HP (max 100)
        player.heal(60);
        break;

      case PowerUp.TYPES.RAPID:
        // Cooldown ÷3 for 360 frames
        player.weaponSystem.activateRapidFire();
        break;

      case PowerUp.TYPES.SHIELD:
        // Shield = 60, glowing blue ring
        player.activateShield();
        break;

      case PowerUp.TYPES.MISSILE:
        // +3 missiles (max 8)
        player.addMissiles(3);
        break;

      case PowerUp.TYPES.WEAPON_UP:
        // Weapon Damage ×1.5 for 300 frames
        player.weaponSystem.activateWeaponUpgrade();
        break;

      case PowerUp.TYPES.NUKE:
        // Destroys all non-boss enemies instantly + shockwave
        camera.shake(0.95);
        
        // Massive nuclear explosion flash ring centered
        const nukeExp = explosionPool.obtain(pu.x, pu.y, 250, true);
        explosions.push(nukeExp);

        enemies.forEach(e => {
          if (e.active && !e.isBoss) {
            e.takeDamage(9999); // absolute instakill
            
            const exp = explosionPool.obtain(e.x, e.y, e.radius * 2, false);
            explosions.push(exp);
            
            scoreSystem.addKill(e.points, e.x, e.y, false);
          }
        });
        audio.playExplosionLarge();
        break;
    }
  }

  /**
   * Powerup drops. Boss always guarantees 4 drops.
   */
  _tryDropPowerUp(x, y, isBoss) {
    const { powerupPool, powerups } = this.game;
    const types = Object.values(PowerUp.TYPES);

    if (isBoss) {
      for (let i = 0; i < CONSTANTS.POWERUP_BOSS_DROP_COUNT; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const px = x + (Math.random() * 80 - 40);
        const py = y + (Math.random() * 60 - 30);
        const pu = powerupPool.obtain(px, py, type);
        powerups.push(pu);
      }
    } else if (Math.random() < CONSTANTS.POWERUP_DROP_CHANCE) {
      const type = types[Math.floor(Math.random() * types.length)];
      const pu = powerupPool.obtain(x, y, type);
      powerups.push(pu);
    }
  }

  /**
   * Spawns neon tech sparks
   */
  _spawnSparks(x, y, color, count) {
    const { particlePool, particles } = this.game;
    for (let i = 0; i < count; i++) {
      const p = particlePool.obtain();
      if (p) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50; // px/s
        p.init(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.2 + Math.random() * 0.15,
          color,
          Math.random() * 2 + 0.8
        );
        particles.push(p);
      }
    }
  }
}
