'use strict';

import { CONSTANTS } from '../config/constants.js';
import { ENEMY_TYPES } from '../config/enemyDefs.js';
import { FORMATION_DEFS } from '../config/formationDefs.js';

/**
 * Manages wave difficulty scaling, schedules enemy spawns,
 * controls group formations, and drives hostile weapon firing mechanisms.
 */
export class Spawner {
  /**
   * @param {Object} game 
   */
  constructor(game) {
    this.game = game;
    
    this.spawnCooldown = 0;      // frame-rate independent countdown
    this.lastBossScore = 0;
    this.bossActive = false;

    // timers for dreadnought missiles
    this.dreadnoughtMissileTimers = {};
  }

  /**
   * Resets spawner waves
   */
  reset() {
    this.spawnCooldown = 120; // 2 seconds before first enemy spawns
    this.lastBossScore = 0;
    this.bossActive = false;
    this.dreadnoughtMissileTimers = {};
  }

  /**
   * Updates spawner schedules and handles hostile weapon fire
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    const { enemies, scoreSystem } = this.game;
    const level = scoreSystem.level;

    // Count live enemies
    let liveCount = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].active) {
        liveCount++;
      }
    }

    // Monitor Boss Milestones
    this._checkBossMilestone(scoreSystem.score);

    // Progressive Spawning waves
    if (this.spawnCooldown > 0) {
      this.spawnCooldown -= dt * 60;
    }

    if (this.spawnCooldown <= 0 && !this.bossActive) {
      const difficultyDef = CONSTANTS.DIFFICULTY[this.game.settings.difficulty.toUpperCase()] || CONSTANTS.DIFFICULTY.NORMAL;
      const maxLive = (CONSTANTS.SPAWNER_MAX_LIVE_ENEMIES_BASE + Math.floor(level * 0.6)) * difficultyDef.spawnRateMultiplier;
      
      if (liveCount < maxLive) {
        // Spawn formations from Level 3+ (40% chance)
        if (level >= 3 && Math.random() < 0.40) {
          this._spawnFormation(level);
        } else {
          this._spawnIndividualEnemy(level);
        }
      }

      // Wave interval cooling (frame-rate independent)
      const baseCool = CONSTANTS.SPAWNER_COOLDOWN_BASE - (level * CONSTANTS.SPAWNER_LEVEL_COOLDOWN_REDUCTION);
      const cooldown = Math.max(CONSTANTS.SPAWNER_COOLDOWN_MIN, baseCool) / difficultyDef.spawnRateMultiplier;
      this.spawnCooldown = cooldown;
    }

    // Direct hostile firing
    this._handleEnemyFiring(dt);
  }

  /**
   * Triggers boss milestone alerts
   * @param {number} score 
   */
  _checkBossMilestone(score) {
    const milestone = CONSTANTS.BOSS_SCORE_MILESTONE;
    const currentMilestone = Math.floor(score / milestone) * milestone;

    if (currentMilestone > this.lastBossScore && currentMilestone > 0) {
      this.lastBossScore = currentMilestone;

      // Verify no boss already exists
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
   * Spawns a single individual enemy based on level ratios
   * @param {number} level 
   */
  _spawnIndividualEnemy(level) {
    const { enemyPool, enemies } = this.game;

    let type = ENEMY_TYPES.SCOUT;
    const roll = Math.random();

    if (level < 2) {
      // Early levels: scouts only
      type = ENEMY_TYPES.SCOUT;
    } else if (level < 5) {
      // Mid levels: scouts (40%), fighters (45%), bombers (15%)
      if (roll < 0.40) type = ENEMY_TYPES.SCOUT;
      else if (roll < 0.85) type = ENEMY_TYPES.FIGHTER;
      else type = ENEMY_TYPES.BOMBER;
    } else if (level < 8) {
      // High levels: introduce Interceptors
      if (roll < 0.30) type = ENEMY_TYPES.SCOUT;
      else if (roll < 0.60) type = ENEMY_TYPES.FIGHTER;
      else if (roll < 0.85) type = ENEMY_TYPES.BOMBER;
      else type = ENEMY_TYPES.INTERCEPTOR;
    } else {
      // Late levels: introduce Dreadnoughts
      if (roll < 0.20) type = ENEMY_TYPES.SCOUT;
      else if (roll < 0.45) type = ENEMY_TYPES.FIGHTER;
      else if (roll < 0.65) type = ENEMY_TYPES.BOMBER;
      else if (roll < 0.85) type = ENEMY_TYPES.INTERCEPTOR;
      else type = ENEMY_TYPES.DREADNOUGHT;
    }

    const x = Math.random() * (CONSTANTS.GAME_WIDTH - 120) + 60;
    const y = -40;

    const enemy = enemyPool.obtain(x, y, type);
    enemies.push(enemy);
  }

  /**
   * Spawns a group formation of ships (Level 3+)
   * @param {number} level 
   */
  _spawnFormation(level) {
    const { enemyPool, enemies } = this.game;

    // Filter available formations for current level
    const candidates = FORMATION_DEFS.filter(f => level >= f.minLevel);
    if (candidates.length === 0) return;

    const formation = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Choose central anchor spawn point
    const padding = 150;
    const centerX = Math.random() * (CONSTANTS.GAME_WIDTH - padding * 2) + padding;

    let leader = null;
    const group = [];

    // Spawn members
    formation.members.forEach(member => {
      const type = member.enemyType || formation.enemyType;
      const sx = centerX + member.xOffset;
      const sy = -120 + member.yOffset;

      const enemy = enemyPool.obtain(sx, sy, type);
      enemies.push(enemy);

      enemy.formationName = formation.name;

      if (member.isLeader) {
        enemy.isFormationLeader = true;
        leader = enemy;
      } else {
        group.push(enemy);
      }
    });

    // Connect rest of squadron to leader scatter checks
    if (leader) {
      group.forEach(m => {
        m.formationLeaderRef = leader;
      });
    }
  }

  /**
   * Spawns Bomber homing mines on death
   * @param {number} bx 
   * @param {number} by 
   */
  spawnHomingMines(bx, by) {
    const { enemyPool, enemies } = this.game;
    
    // 3 homing mines spawned slightly separated
    const offsets = [
      { x: -28, y: -5 },
      { x: 28, y: -5 },
      { x: 0, y: 22 }
    ];

    offsets.forEach(offset => {
      const mine = enemyPool.obtain(bx + offset.x, by + offset.y, 'mine');
      enemies.push(mine);
    });
  }

  /**
   * Spawn Boss unit
   */
  _spawnBoss() {
    const { enemyPool, enemies, audio } = this.game;

    this.bossActive = true;
    
    const boss = enemyPool.obtain(CONSTANTS.GAME_WIDTH / 2, -100, ENEMY_TYPES.BOSS);
    enemies.push(boss);

    audio.playBossAlarm();
  }

  /**
   * Orchestrates firing patterns for all active hostiles
   * @param {number} dt - delta time in seconds
   */
  _handleEnemyFiring(dt) {
    const { enemies, bulletPool, bullets, player, audio } = this.game;
    const settings = this.game.settings;

    // Track boss status
    let activeBossCount = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;

      if (e.isBoss) {
        activeBossCount++;
        this._updateBossAttacks(e, player, dt, audio);
      } else if (e.type === ENEMY_TYPES.DREADNOUGHT) {
        this._updateDreadnoughtAttacks(e, player, dt, audio);
      } else {
        // Standard Aimed fire
        if (e.canFire(settings)) {
          this._fireAimed(e, player, 270, CONSTANTS.COLORS.BULLET_ENEMY, 'enemy');
        }
      }
    }

    this.bossActive = activeBossCount > 0;
  }

  /**
   * Fires a single aimed bullet toward the player.
   * Employs aimed bullet lead prediction on Insane difficulty.
   */
  _fireAimed(enemy, player, speed = 260, color = CONSTANTS.COLORS.BULLET_ENEMY, type = 'enemy') {
    const { bulletPool, bullets } = this.game;
    if (!player.alive) return;

    let targetX = player.x;
    let targetY = player.y;

    const diff = CONSTANTS.DIFFICULTY[this.game.settings.difficulty.toUpperCase()] || CONSTANTS.DIFFICULTY.NORMAL;
    
    // Insane Difficulty: Enemies aim ahead!
    if (diff.predictiveAim) {
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      const bulletTravelTime = dist / speed;

      // Predict future position
      targetX = player.x + player.vx * bulletTravelTime;
      targetY = player.y + player.vy * bulletTravelTime;
    }

    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist === 0) return;

    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const bullet = bulletPool.obtain();
    if (bullet) {
      bullet.init(
        enemy.x, 
        enemy.y + enemy.radius + 4, 
        vx, 
        vy, 
        enemy.damage, 
        type, 
        color
      );
      bullets.push(bullet);
    }
  }

  /**
   * Dreadnought attack sweep routines
   */
  _updateDreadnoughtAttacks(enemy, player, dt, audio) {
    const settings = this.game.settings;
    if (!player.alive) return;

    // 1. 5-bullet spread every 22 frames
    if (enemy.canFire(settings)) {
      this._fireSpread(enemy, player, 5, Math.PI / 4, 230, CONSTANTS.COLORS.DREADNOUGHT, 'enemy');
    }

    // 2. 1 homing missile every 120 frames
    const id = `${enemy.x}_${enemy.y}`;
    if (!this.dreadnoughtMissileTimers[id]) {
      this.dreadnoughtMissileTimers[id] = 0;
    }
    this.dreadnoughtMissileTimers[id] += dt * 60;

    if (this.dreadnoughtMissileTimers[id] >= 120) {
      this.dreadnoughtMissileTimers[id] = 0;
      this._fireHostileHomingMissile(enemy, player, audio);
    }
  }

  /**
   * Boss multi-phase attack routines
   */
  _updateBossAttacks(boss, player, dt, audio) {
    const settings = this.game.settings;
    if (!player.alive) return;

    boss.missileTimer += dt * 60;
    boss.ringBurstTimer += dt * 60;
    boss.deathSpiralTimer += dt * 60;

    const hpPct = boss.hp / boss.maxHp;

    if (boss.bossPhase === 1) {
      // --- PHASE 1 ---
      // 3-spread aimed shot (FR: 30f)
      if (boss.canFire(settings)) {
        this._fireSpread(boss, player, 3, Math.PI / 6, 250, boss.color, 'enemy');
      }
      // 1 homing missile (FR: 180f)
      if (boss.missileTimer >= 180) {
        boss.missileTimer = 0;
        this._fireHostileHomingMissile(boss, player, audio);
      }

    } else if (boss.bossPhase === 2) {
      // --- PHASE 2 ---
      // 5-spread aimed shot (FR: 22f)
      if (boss.canFire(settings)) {
        this._fireSpread(boss, player, 5, Math.PI / 4, 270, boss.color, 'enemy');
      }
      // 2 homing missiles (FR: 120f)
      if (boss.missileTimer >= 120) {
        boss.missileTimer = 0;
        this._fireHostileHomingMissile(boss, player, audio);
        setTimeout(() => this._fireHostileHomingMissile(boss, player, audio), 200);
      }
      // Ring burst (8 bullets radially every 200f)
      if (boss.ringBurstTimer >= 200) {
        boss.ringBurstTimer = 0;
        this._fireRadialBurst(boss, 8, 220, boss.color);
      }

    } else {
      // --- PHASE 3 ---
      // 7-spread aimed shot (FR: 18f)
      if (boss.canFire(settings)) {
        this._fireSpread(boss, player, 7, Math.PI / 3, 290, boss.color, 'enemy');
      }
      // 3 homing missiles (FR: 90f)
      if (boss.missileTimer >= 90) {
        boss.missileTimer = 0;
        this._fireHostileHomingMissile(boss, player, audio);
        setTimeout(() => this._fireHostileHomingMissile(boss, player, audio), 150);
        setTimeout(() => this._fireHostileHomingMissile(boss, player, audio), 300);
      }
      // Spinning death spiral (12 bullets every 60f in rotating patterns)
      if (boss.deathSpiralTimer >= 60) {
        boss.deathSpiralTimer = 0;
        this._fireSpiralBurst(boss, 12, 230, boss.color);
      }
    }
  }

  /**
   * Fires a fan-shape spread of bullets
   */
  _fireSpread(enemy, player, count, arc, speed, color, type) {
    const { bulletPool, bullets } = this.game;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const baseAngle = Math.atan2(dy, dx);
    const angleStep = arc / (count - 1);

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - arc / 2 + (angleStep * i);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = bulletPool.obtain();
      if (bullet) {
        bullet.init(
          enemy.x, 
          enemy.y + enemy.radius, 
          vx, 
          vy, 
          enemy.damage, 
          type, 
          color
        );
        bullets.push(bullet);
      }
    }
  }

  /**
   * Fires a radial ring of bullets expanding outwards
   */
  _fireRadialBurst(enemy, count, speed, color) {
    const { bulletPool, bullets } = this.game;
    const step = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * step;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = bulletPool.obtain();
      if (bullet) {
        bullet.init(
          enemy.x, 
          enemy.y, 
          vx, 
          vy, 
          enemy.damage, 
          'enemy', 
          color
        );
        bullets.push(bullet);
      }
    }
  }

  /**
   * Fires a spinning spiral burst
   */
  _fireSpiralBurst(enemy, count, speed, color) {
    const { bulletPool, bullets } = this.game;
    
    // incremental offset angle over time
    const spiralOffset = this.behaviorTimer * 3.5;
    const step = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = spiralOffset + i * step;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = bulletPool.obtain();
      if (bullet) {
        bullet.init(
          enemy.x, 
          enemy.y, 
          vx, 
          vy, 
          enemy.damage, 
          'enemy', 
          color
        );
        bullets.push(bullet);
      }
    }
  }

  /**
   * Fires a hostile homing projectile targeting the player.
   * Represented as a special red-shifting bullet.
   */
  _fireHostileHomingMissile(enemy, player, audio) {
    const { bulletPool, bullets } = this.game;
    if (!player.alive) return;

    audio.playMissileLaunch();

    const bullet = bulletPool.obtain();
    if (bullet) {
      // Ejected slowly downwards, steers on update
      bullet.init(
        enemy.x, 
        enemy.y + enemy.radius + 6, 
        0, 
        150, 
        enemy.damage * 1.5, 
        'enemy_missile', 
        '#ff003c'
      );
      
      // Inject player reference for homing steering calculations in Bullet loop
      bullet.playerRef = player;
      bullets.push(bullet);
    }
  }
}
