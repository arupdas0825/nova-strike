'use strict';

import { CONSTANTS } from '../config/constants.js';
import { ENEMY_DEFS, ENEMY_TYPES } from '../config/enemyDefs.js';

/**
 * Enemy Starfighter Entity.
 * Implements Verlet physics, dodge rolls (Fighters), pass-and-retreat runs (Interceptors),
 * horizontal sweeping and armored bottom shielding (Dreadnoughts), and a 3-phase combat machine
 * for the Boss. Includes detailed HUD gauges and engine glow.
 */
export class Enemy {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.spawnX = 0;

    this.radius = 12;
    this.hp = 10;
    this.maxHp = 10;
    this.speed = 100;
    this.damage = 10;
    
    this.fireRate = 80;
    this.fireCooldown = 0;
    this.points = 10;
    this.color = '#ff00ff';
    this.type = ENEMY_TYPES.SCOUT;
    
    this.active = false;

    // AI states
    this.behaviorTimer = 0;
    this.zigzagDir = 1;
    this.entryComplete = false;
    this.targetY = 0;

    // Fighter dodge roll state
    this.dodgeRollTimer = 0; // seconds remaining
    this.dodgeRollDirection = 1;

    // Interceptor state
    this.interceptorState = 'dash'; // 'dash' or 'retreat'
    this.interceptorStateTimer = 0;

    // Dreadnought state
    this.weakpointRadius = 8;

    // Boss state
    this.isBoss = false;
    this.bossPhase = 1;
    this.bossAngle = 0;
    this.chargeTimer = 0;
    this.chargeState = 'drift'; // 'drift' or 'charge'
    this.chargeTargetX = 0;
    this.chargeTargetY = 0;
    
    // Attack timers for boss
    this.missileTimer = 0;
    this.ringBurstTimer = 0;
    this.deathSpiralTimer = 0;

    // Formation tracking
    this.formationName = null;
    this.isFormationLeader = false;
    this.formationLeaderRef = null;
  }

  /**
   * Initializes or recycles an enemy instance from the pool
   * @param {number} x 
   * @param {number} y 
   * @param {string} type 
   */
  init(x, y, type) {
    const def = ENEMY_DEFS[type] || {
      hp: 15, speed: 180, radius: 7, damage: 10, fireRate: 9999, points: 5, color: '#ff2244', behavior: 'direct'
    };

    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.vx = 0;
    this.vy = 80; // initial entering speed
    
    this.type = type;
    this.radius = def.radius;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.fireRate = def.fireRate;
    
    // Stagger initial shots slightly
    this.fireCooldown = Math.random() * this.fireRate;
    this.points = def.points;
    this.color = def.color;
    
    this.active = true;
    this.entryComplete = false;
    this.behaviorTimer = 0;
    this.zigzagDir = Math.random() > 0.5 ? 1 : -1;
    this.targetY = type === ENEMY_TYPES.BOSS ? 100 : 70 + Math.random() * 120;

    // Reset behaviors
    this.dodgeRollTimer = 0;
    this.interceptorState = 'dash';
    this.interceptorStateTimer = 0;

    this.isBoss = type === ENEMY_TYPES.BOSS;
    this.bossPhase = 1;
    this.bossAngle = 0;
    this.chargeTimer = 0;
    this.chargeState = 'drift';
    this.missileTimer = 0;
    this.ringBurstTimer = 0;
    this.deathSpiralTimer = 0;

    // Formation defaults
    this.formationName = null;
    this.isFormationLeader = false;
    this.formationLeaderRef = null;
  }

  /**
   * Updates AI routines and integrates Verlet positions
   * @param {Object} player 
   * @param {number} dt - delta time in seconds
   * @param {Object} spawner 
   */
  update(player, dt, spawner) {
    if (!this.active) return;

    this.behaviorTimer += dt;

    // 1. Formation scatter check:
    // If we are part of a formation, and our leader has died, we scatter (use individual AI)
    if (this.formationLeaderRef && !this.formationLeaderRef.alive) {
      this.formationLeaderRef = null;
      this.formationName = null;
      this.isFormationLeader = false;
    }

    // 2. Spawn entrance drift
    if (!this.entryComplete && this.type !== 'mine') {
      this.vy = this.speed * 0.9;
      this.vx = 0;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (this.y >= this.targetY) {
        this.entryComplete = true;
        this.vy = 0;
      }
      return;
    }

    // 3. AI Behavior Trees
    if (this.type === 'mine') {
      // Homing Mine: directly heads to player at 180 px/s
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else {
      switch (this.type) {
        case ENEMY_TYPES.SCOUT:
          // Scout: zigzag sine wave (amplitude 80px, freq 0.08 rad/f -> 4.8 rad/s)
          // centered around starting spawnX
          this.x = this.spawnX + Math.sin(this.behaviorTimer * 4.8) * 80;
          this.vy = 70; // slow drift downwards
          break;

        case ENEMY_TYPES.FIGHTER:
          // Fighter: direct chase + dodge roll when taking damage
          if (this.dodgeRollTimer > 0) {
            this.dodgeRollTimer -= dt;
            this.vx = this.dodgeRollDirection * 270; // high sidestep speed
            this.vy = 40; // slow drift down
          } else {
            // direct chase player X
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            this.vx = dist > 0 ? (dx / dist) * this.speed : 0;
            this.vy = dist > 0 ? (dy / dist) * this.speed * 0.4 : 0;

            // Stay in upper 65% of screen
            if (this.y > CONSTANTS.GAME_HEIGHT * 0.65) {
              this.vy = -60;
            }
          }
          break;

        case ENEMY_TYPES.BOMBER:
          // Bomber: slow arc descent
          this.vx = Math.sin(this.behaviorTimer * 1.6) * 110;
          this.vy = 55;
          break;

        case ENEMY_TYPES.INTERCEPTOR:
          // Interceptor: high-speed dashes at player, retreats upwards after pass
          this.interceptorStateTimer += dt;
          
          if (this.interceptorState === 'dash') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
              this.vx = (dx / dist) * this.speed;
              this.vy = (dy / dist) * this.speed;
            }

            // Pass trigger: if past player Y, retreat
            if (this.y > player.y - 10) {
              this.interceptorState = 'retreat';
              this.interceptorStateTimer = 0;
            }
          } else {
            // Retreat state: escapes upwards rapidly
            this.vx = Math.sin(this.behaviorTimer * 3) * 120;
            this.vy = -260;

            if (this.interceptorStateTimer > 1.8) {
              this.interceptorState = 'dash';
              this.interceptorStateTimer = 0;
            }
          }
          break;

        case ENEMY_TYPES.DREADNOUGHT:
          // Dreadnought: slow horizontal sweeps, stays in upper 40%
          this.vy = this.y < 160 ? 30 : 0;
          this.vx = Math.sin(this.behaviorTimer * 0.7) * this.speed;
          break;

        case ENEMY_TYPES.BOSS:
          this._updateBossAI(player, dt);
          break;
      }
    }

    // 4. Verlet Integration position updates
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp boss to screen bounds, wrap others horizontally
    if (this.isBoss) {
      const margin = this.radius + 10;
      this.x = Math.max(margin, Math.min(CONSTANTS.GAME_WIDTH - margin, this.x));
      this.y = Math.max(50, Math.min(260, this.y));
    } else if (this.type !== 'mine') {
      const margin = this.radius + 30;
      if (this.x < -margin) this.x = CONSTANTS.GAME_WIDTH + margin - 5;
      if (this.x > CONSTANTS.GAME_WIDTH + margin) this.x = -margin + 5;
    }

    // Despawn if drifted far past screen bottom
    if (this.y > CONSTANTS.GAME_HEIGHT + 100) {
      this.active = false;
    }

    // 5. Shot cooldown deductions
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt * 60;
    }
  }

  /**
   * Specialized Boss Phase AI transitions
   * @param {Object} player 
   * @param {number} dt 
   */
  _updateBossAI(player, dt) {
    const hpPct = this.hp / this.maxHp;

    // Phase Transitions
    if (this.bossPhase === 1 && hpPct <= 0.6) {
      this.bossPhase = 2;
      this.chargeState = 'drift';
      this.chargeTimer = 0;
      // Triggers screen flash + siren in Spawner or Game loop
    } else if (this.bossPhase === 2 && hpPct <= 0.3) {
      this.bossPhase = 3;
      // Triggers full screen shake
    }

    // Movement by phase
    if (this.bossPhase === 1) {
      // Phase 1: wide sine drift across top third
      this.bossAngle += dt * 1.2;
      this.vx = Math.sin(this.bossAngle) * this.speed * 2.2;
      this.vy = Math.cos(this.bossAngle * 0.6) * 30;

    } else if (this.bossPhase === 2) {
      // Phase 2: Berserker erratic diagonal charges every 240 frames (4.0s)
      this.chargeTimer += dt;
      
      if (this.chargeState === 'drift') {
        this.bossAngle += dt * 2.2; // faster oscillation
        this.vx = Math.sin(this.bossAngle) * this.speed * 2.8;
        this.vy = Math.cos(this.bossAngle * 0.9) * 40;

        if (this.chargeTimer >= 4.0) {
          this.chargeState = 'charge';
          this.chargeTimer = 0;
          this.chargeTargetX = player.x;
          this.chargeTargetY = player.y - 150; // swoop down close
        }
      } else {
        // Charging at player X/Y
        const dx = this.chargeTargetX - this.x;
        const dy = this.chargeTargetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 20 && this.chargeTimer < 1.2) {
          this.vx = (dx / dist) * 380;
          this.vy = (dy / dist) * 380;
        } else {
          // charge finished, return to drift
          this.chargeState = 'drift';
          this.chargeTimer = 0;
        }
      }

    } else {
      // Phase 3: Destroyer constant slow advance, unstoppable
      this.vx = Math.sin(this.behaviorTimer * 2.2) * 50;
      this.vy = 22; // advancing slowly downward
    }
  }

  /**
   * Standard shot fired evaluation. Adjusts based on difficulty modifiers.
   * @param {Object} gameSettings 
   * @returns {boolean}
   */
  canFire(gameSettings) {
    if (!this.active || !this.entryComplete || this.type === 'mine') return false;

    // Apply difficulty modifiers to fire rates
    const diff = CONSTANTS.DIFFICULTY[gameSettings.difficulty.toUpperCase()] || CONSTANTS.DIFFICULTY.NORMAL;
    const currentFireRate = this.fireRate / diff.fireRateMultiplier;

    if (this.fireCooldown <= 0) {
      this.fireCooldown = currentFireRate;
      return true;
    }
    
    return false;
  }

  /**
   * Inflicts damage, handles rolls (Fighters), and evaluates death status
   * @param {number} amount 
   * @returns {boolean} - true if dead
   */
  takeDamage(amount) {
    this.hp -= amount;

    // Fighter dodge roll sidestep trigger (33% chance or on hit)
    if (this.type === ENEMY_TYPES.FIGHTER && this.dodgeRollTimer <= 0) {
      this.dodgeRollTimer = 0.33; // 20 frames
      this.dodgeRollDirection = Math.random() > 0.5 ? 1 : -1;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      return true;
    }

    return false;
  }

  /**
   * Draws custom ship configurations and tech overlays
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow effects
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;

    switch (this.type) {
      case ENEMY_TYPES.SCOUT:
        this._drawScout(ctx);
        break;
      case ENEMY_TYPES.FIGHTER:
        this._drawFighter(ctx);
        break;
      case ENEMY_TYPES.BOMBER:
        this._drawBomber(ctx);
        break;
      case ENEMY_TYPES.INTERCEPTOR:
        this._drawInterceptor(ctx);
        break;
      case ENEMY_TYPES.DREADNOUGHT:
        this._drawDreadnought(ctx);
        break;
      case ENEMY_TYPES.BOSS:
        this._drawBoss(ctx);
        break;
      case 'mine':
        this._drawMine(ctx);
        break;
    }

    ctx.shadowBlur = 0;

    // Renders custom tech HP indicators
    if (this.hp < this.maxHp && this.type !== ENEMY_TYPES.BOSS && this.type !== 'mine') {
      this._drawHPBar(ctx);
    }

    ctx.restore();
  }

  _drawScout(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, r + 3);       // pointed downwards
    ctx.lineTo(-r - 2, -r + 2);
    ctx.lineTo(0, -r + 5);
    ctx.lineTo(r + 2, -r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // engine flare dot
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(0, -r + 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFighter(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(0, r + 4);       // aggressive wings down
    ctx.lineTo(-r - 4, -r + 2);
    ctx.lineTo(-r + 2, -r + 5);
    ctx.lineTo(0, -r + 9);
    ctx.lineTo(r - 2, -r + 5);
    ctx.lineTo(r + 4, -r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tech sensor eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBomber(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;

    // Hexagonal armored hull
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // inner cooling vents
    ctx.strokeStyle = '#ff003c';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawInterceptor(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;

    // Sharp forward sweeping forks
    ctx.beginPath();
    ctx.moveTo(0, r + 5);
    ctx.lineTo(-r, -r);
    ctx.lineTo(-r + 4, -r + 3);
    ctx.lineTo(0, -r + 6);
    ctx.lineTo(r - 4, -r + 3);
    ctx.lineTo(r, -r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  _drawDreadnought(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;

    // Massive arrowhead flying brick shape
    ctx.beginPath();
    ctx.moveTo(0, r + 8);
    ctx.lineTo(-r - 10, -r + 5);
    ctx.lineTo(-r + 5, -r + 10);
    ctx.lineTo(0, -r + 5);
    ctx.lineTo(r - 5, -r + 10);
    ctx.lineTo(r + 10, -r + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing shield generators
    ctx.fillStyle = '#be1eff';
    ctx.beginPath();
    ctx.arc(-r / 2, -r / 2, 4, 0, Math.PI * 2);
    ctx.arc(r / 2, -r / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Top Center weak point R:8
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, -r + 5, this.weakpointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  _drawMine(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;

    // Rotating small spiked core
    const rot = this.behaviorTimer * 4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI / 4);
      const pr = i % 2 === 0 ? r : r * 0.4;
      const px = Math.cos(a) * pr;
      const py = Math.sin(a) * pr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  _drawBoss(ctx) {
    const r = this.radius;

    // 1. Draw spinning outer fragment ring
    ctx.save();
    const rotSpeed = this.bossPhase === 1 ? 1.0 : (this.bossPhase === 2 ? 2.5 : 4.0);
    ctx.rotate(this.behaviorTimer * rotSpeed);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.0;

    // Draw broken circular ring pieces
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      // ring fragments visible in phase 3
      const arcWidth = this.bossPhase === 3 ? 0.35 : 0.70;
      ctx.arc(0, 0, r + 10, i * Math.PI / 2 - arcWidth, i * Math.PI / 2 + arcWidth);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Heavy armored fuselage
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(0, r + 10);      // nose
    ctx.lineTo(-r - 12, 0);     // left shoulder
    ctx.lineTo(-r, -r + 5);     // top left
    ctx.lineTo(0, -r - 5);      // tail tip
    ctx.lineTo(r, -r + 5);      // top right
    ctx.lineTo(r + 12, 0);      // right shoulder
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing cannons flanking
    ctx.fillStyle = '#888899';
    ctx.fillRect(-r - 16, -10, 6, 20);
    ctx.fillRect(r + 10, -10, 6, 20);

    // 3. Central core
    // Pulsates red in phase 2, solid pulsing white in phase 3
    let coreColor = 'rgba(255, 85, 0, 0.8)';
    if (this.bossPhase === 2) {
      // core flickers red
      const flicker = Math.sin(Date.now() * 0.08) > 0 ? 0.9 : 0.3;
      coreColor = `rgba(255, 0, 0, ${flicker})`;
    } else if (this.bossPhase === 3) {
      // core pulses bright white
      const pulse = 0.6 + Math.sin(Date.now() * 0.03) * 0.4;
      coreColor = `rgba(255, 255, 255, ${pulse})`;
    }

    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.50, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawHPBar(ctx) {
    const barWidth = this.radius * 2.2;
    const barHeight = 3.5;
    const x = -barWidth / 2;
    const y = this.radius + 7;
    const pct = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x, y, barWidth, barHeight);

    const hue = pct * 120;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(x, y, barWidth * pct, barHeight);
  }

  get alive() {
    return this.active;
  }
}
