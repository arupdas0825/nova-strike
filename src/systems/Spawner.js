'use strict';

import { CONSTANTS } from '../config/constants.js';
import { ENEMY_TYPES } from '../config/enemyDefs.js';

/**
 * Enemy spawner — manages progressive wave difficulty, type selection,
 * boss milestone spawning, and enemy firing.
 */
export class Spawner {
  /**
   * @param {object} game - Reference to the main Game instance
   */
  constructor(game) {
    this.game = game;
    this.spawnCooldown = 0;
    this.lastBossScore = 0;
    this.bossActive = false;
  }

  /**
   * Resets spawner state for a new game
   */
  reset() {
    this.spawnCooldown = 120; // Delay before first enemy
    this.lastBossScore = 0;
    this.bossActive = false;
  }

  /**
   * Main spawner tick — handles spawning new enemies and firing for existing ones
   */
  update() {
    const { enemies, scoreSystem } = this.game;
    const level = scoreSystem.level;

    // Count active enemies
    let liveCount = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].active) liveCount++;
    }

    // Check boss milestones
    this._checkBossMilestone(scoreSystem.score);

    // Spawn cooldown management
    this.spawnCooldown--;
    if (this.spawnCooldown <= 0 && !this.bossActive) {
      const maxLive = CONSTANTS.SPAWNER_MAX_LIVE_ENEMIES_BASE + Math.floor(level * 0.5);
      if (liveCount < maxLive) {
        this._spawnEnemy(level);
      }

      // Progressive cooldown reduction with level
      const cooldown = Math.max(
        CONSTANTS.SPAWNER_COOLDOWN_MIN,
        CONSTANTS.SPAWNER_COOLDOWN_BASE - (level * CONSTANTS.SPAWNER_LEVEL_COOLDOWN_REDUCTION)
      );
      this.spawnCooldown = cooldown;
    }

    // Fire from active enemies
    this._handleEnemyFiring();
  }

  /**
   * Checks if a boss should be spawned based on score milestones
   * @param {number} score
   */
  _checkBossMilestone(score) {
    const milestone = CONSTANTS.BOSS_SCORE_MILESTONE;
    const currentMilestone = Math.floor(score / milestone) * milestone;

    if (currentMilestone > this.lastBossScore && currentMilestone > 0) {
      this.lastBossScore = currentMilestone;

      // Check if boss is already active
      let hasBoss = false;
      for (let i = 0; i < this.game.enemies.length; i++) {
        if (this.game.enemies[i].active && this.game.enemies[i].isBoss) {
          hasBoss = true;
          break;
        }
      }

      if (!hasBoss) {
        this._spawnBoss();
      }
    }
  }

  /**
   * Spawns a regular enemy based on current level probabilities
   * @param {number} level
   */
  _spawnEnemy(level) {
    const { enemyPool, enemies } = this.game;

    // Type selection based on level progression
    let type;
    const roll = Math.random();

    if (level < 2) {
      // Early game: mostly scouts
      type = roll < 0.85 ? ENEMY_TYPES.SCOUT : ENEMY_TYPES.FIGHTER;
    } else if (level < 5) {
      // Mid game: mix of scouts and fighters, some bombers
      if (roll < 0.4) type = ENEMY_TYPES.SCOUT;
      else if (roll < 0.8) type = ENEMY_TYPES.FIGHTER;
      else type = ENEMY_TYPES.BOMBER;
    } else {
      // Late game: heavier mix
      if (roll < 0.25) type = ENEMY_TYPES.SCOUT;
      else if (roll < 0.55) type = ENEMY_TYPES.FIGHTER;
      else type = ENEMY_TYPES.BOMBER;
    }

    const x = Math.random() * (CONSTANTS.GAME_WIDTH - 80) + 40;
    const y = -30;

    const enemy = enemyPool.obtain(x, y, type);
    enemies.push(enemy);
  }

  /**
   * Spawns a boss enemy
   */
  _spawnBoss() {
    const { enemyPool, enemies, audio } = this.game;

    this.bossActive = true;

    const enemy = enemyPool.obtain(CONSTANTS.GAME_WIDTH / 2, -60, ENEMY_TYPES.BOSS);
    enemies.push(enemy);

    audio.playBossAlarm();

    // Disable boss flag when boss dies — checked in collision
    // We'll monitor this in the update loop
  }

  /**
   * Handles firing logic for all active enemies
   */
  _handleEnemyFiring() {
    const { enemies, bulletPool, bullets, player } = this.game;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;

      // Track if boss is still active
      if (e.isBoss && !e.active) {
        this.bossActive = false;
      }

      if (e.canFire()) {
        if (e.isBoss) {
          // Boss fires spread pattern
          this._fireSpread(e, player);
        } else {
          // Normal enemies fire aimed shot
          this._fireAimed(e, player);
        }
      }
    }

    // Check if boss died
    if (this.bossActive) {
      let hasBoss = false;
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].active && enemies[i].isBoss) {
          hasBoss = true;
          break;
        }
      }
      if (!hasBoss) this.bossActive = false;
    }
  }

  /**
   * Fires a single aimed bullet toward the player
   * @param {import('../entities/Enemy.js').Enemy} enemy
   * @param {import('../entities/Player.js').Player} player
   */
  _fireAimed(enemy, player) {
    const { bulletPool, bullets } = this.game;
    if (!player.alive) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return;

    const bulletSpeed = 4.5;
    const vx = (dx / dist) * bulletSpeed;
    const vy = (dy / dist) * bulletSpeed;

    const b = bulletPool.obtain(
      enemy.x, enemy.y + enemy.radius,
      vx, vy,
      CONSTANTS.COLORS.BULLET_ENEMY,
      enemy.damage,
      false
    );
    bullets.push(b);
  }

  /**
   * Fires a spread pattern of bullets (boss attack)
   * @param {import('../entities/Enemy.js').Enemy} enemy
   * @param {import('../entities/Player.js').Player} player
   */
  _fireSpread(enemy, player) {
    const { bulletPool, bullets } = this.game;
    if (!player.alive) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const baseAngle = Math.atan2(dy, dx);
    const bulletSpeed = 4;
    const spreadCount = 5;
    const spreadArc = Math.PI / 5; // ~36 degrees spread

    for (let i = 0; i < spreadCount; i++) {
      const angle = baseAngle - spreadArc / 2 + (spreadArc / (spreadCount - 1)) * i;
      const vx = Math.cos(angle) * bulletSpeed;
      const vy = Math.sin(angle) * bulletSpeed;

      const b = bulletPool.obtain(
        enemy.x, enemy.y + enemy.radius,
        vx, vy,
        CONSTANTS.COLORS.BULLET_ENEMY,
        enemy.damage,
        false
      );
      bullets.push(b);
    }
  }
}
