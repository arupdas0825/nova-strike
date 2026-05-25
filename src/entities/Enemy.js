'use strict';

import { CONSTANTS } from '../config/constants.js';
import { ENEMY_DEFS, ENEMY_TYPES } from '../config/enemyDefs.js';

/**
 * Enemy entity with type-driven stats, behavior AI, firing,
 * HP tracking, and premium vector rendering.
 */
export class Enemy {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
    this.hp = 10;
    this.maxHp = 10;
    this.speed = 1;
    this.damage = 5;
    this.fireRate = 100;
    this.fireCooldown = 0;
    this.points = 10;
    this.color = '#ff0055';
    this.type = ENEMY_TYPES.SCOUT;
    this.behavior = 'zigzag';
    this.active = false;

    // Behavior state
    this.behaviorTimer = 0;
    this.zigzagDir = 1;
    this.entryComplete = false;
    this.targetY = 0;

    // Boss specific
    this.isBoss = false;
    this.bossPhase = 0;
    this.bossAngle = 0;
  }

  /**
   * Initializes enemy from type definition and spawn position
   * @param {number} x
   * @param {number} y
   * @param {string} type - Enemy type key from ENEMY_TYPES
   */
  init(x, y, type) {
    const def = ENEMY_DEFS[type];
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = def.radius;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.fireRate = def.fireRate;
    this.fireCooldown = Math.floor(Math.random() * def.fireRate);
    this.points = def.points;
    this.color = def.color;
    this.behavior = def.behavior;
    this.active = true;

    this.behaviorTimer = 0;
    this.zigzagDir = Math.random() > 0.5 ? 1 : -1;
    this.entryComplete = false;
    this.targetY = 80 + Math.random() * 200;
    this.isBoss = type === ENEMY_TYPES.BOSS;
    this.bossPhase = 0;
    this.bossAngle = 0;

    this.vx = 0;
    this.vy = this.speed;
  }

  /**
   * Updates AI behavior, position, and firing cooldown
   * @param {number} playerX
   * @param {number} playerY
   */
  update(playerX, playerY) {
    if (!this.active) return;

    this.behaviorTimer++;

    // Entry phase — drift to target Y position
    if (!this.entryComplete) {
      this.vy = this.speed * 1.5;
      this.vx = 0;
      if (this.y >= this.targetY) {
        this.entryComplete = true;
        this.vy = 0;
      }
    } else {
      // Active behavior patterns
      switch (this.behavior) {
        case 'zigzag':
          this._behaviorZigzag();
          break;
        case 'direct':
          this._behaviorDirect(playerX, playerY);
          break;
        case 'slow_arc':
          this._behaviorSlowArc();
          break;
        case 'spread_wobble':
          this._behaviorBoss(playerX);
          break;
      }
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Screen bounds (horizontal wrapping for non-boss)
    if (!this.isBoss) {
      if (this.x < -this.radius * 2) this.x = CONSTANTS.GAME_WIDTH + this.radius;
      if (this.x > CONSTANTS.GAME_WIDTH + this.radius * 2) this.x = -this.radius;
    } else {
      // Boss clamped to screen
      this.x = Math.max(this.radius + 10, Math.min(CONSTANTS.GAME_WIDTH - this.radius - 10, this.x));
    }

    // Despawn if drifted far below screen
    if (this.y > CONSTANTS.GAME_HEIGHT + 80) {
      this.active = false;
    }

    // Fire cooldown
    if (this.fireCooldown > 0) this.fireCooldown--;
  }

  /** Scout zigzag — horizontal oscillation with slow downward drift */
  _behaviorZigzag() {
    this.vx = this.speed * 2.5 * this.zigzagDir;
    this.vy = 0.35;

    // Reverse direction periodically
    if (this.behaviorTimer % 90 === 0) {
      this.zigzagDir *= -1;
    }
  }

  /** Fighter direct approach — aims toward player */
  _behaviorDirect(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      this.vx = (dx / dist) * this.speed * 0.6;
      this.vy = (dy / dist) * this.speed * 0.5;
    }
    // Clamp vertical to stay in upper portion
    if (this.y > CONSTANTS.GAME_HEIGHT * 0.65) {
      this.vy = -this.speed * 0.4;
    }
  }

  /** Bomber slow arc — sinusoidal horizontal path, very slow descent */
  _behaviorSlowArc() {
    this.vx = Math.sin(this.behaviorTimer * 0.025) * this.speed * 2.5;
    this.vy = 0.2;
  }

  /** Boss spread wobble — sinusoidal horizontal, phased vertical bobbing */
  _behaviorBoss(playerX) {
    this.bossAngle += 0.015;
    this.vx = Math.sin(this.bossAngle) * this.speed * 3.5;

    // Slow drift toward player X
    const dx = playerX - this.x;
    this.vx += Math.sign(dx) * 0.15;

    // Vertical bobbing
    this.vy = Math.cos(this.bossAngle * 0.7) * 0.6;
    if (this.y < 60) this.vy = Math.abs(this.vy);
    if (this.y > 250) this.vy = -Math.abs(this.vy);
  }

  /**
   * Returns true if the enemy should fire this frame
   * @returns {boolean}
   */
  canFire() {
    if (!this.active || !this.entryComplete) return false;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      return true;
    }
    return false;
  }

  /**
   * Applies damage and returns true if dead
   * @param {number} amount
   * @returns {boolean}
   */
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      return true;
    }
    return false;
  }

  /**
   * Renders enemy based on type with premium vector graphics
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

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
      case ENEMY_TYPES.BOSS:
        this._drawBoss(ctx);
        break;
    }

    ctx.shadowBlur = 0;

    // HP bar for non-full-health enemies
    if (this.hp < this.maxHp) {
      this._drawHPBar(ctx);
    }

    ctx.restore();
  }

  /** Scout — small angular dart shape */
  _drawScout(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, r + 2);       // Nose (pointing down)
    ctx.lineTo(-r, -r);
    ctx.lineTo(0, -r + 4);
    ctx.lineTo(r, -r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /** Fighter — angular aggressive craft */
  _drawFighter(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    ctx.moveTo(0, r + 4);       // Nose down
    ctx.lineTo(-r - 4, -r + 2);
    ctx.lineTo(-r + 2, -r + 4);
    ctx.lineTo(0, -r + 8);
    ctx.lineTo(r - 2, -r + 4);
    ctx.lineTo(r + 4, -r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Bomber — heavy armored hexagonal hull */
  _drawBomber(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Hexagonal shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner armor ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** Boss — large menacing craft with animated energy core */
  _drawBoss(ctx) {
    const r = this.radius;

    // Outer hull — large diamond shape
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, r + 8);       // Bottom point
    ctx.lineTo(-r - 8, 0);      // Left
    ctx.lineTo(-r, -r + 5);     // Top left
    ctx.lineTo(0, -r - 3);      // Top point
    ctx.lineTo(r, -r + 5);      // Top right
    ctx.lineTo(r + 8, 0);       // Right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing extensions
    ctx.fillStyle = '#cc8800';
    ctx.beginPath();
    ctx.moveTo(-r - 8, 0);
    ctx.lineTo(-r - 16, -6);
    ctx.lineTo(-r - 12, 6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r + 8, 0);
    ctx.lineTo(r + 16, -6);
    ctx.lineTo(r + 12, 6);
    ctx.closePath();
    ctx.fill();

    // Pulsating energy core
    const pulse = Math.sin(Date.now() * 0.006) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 80, 0, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Core ring
    ctx.strokeStyle = '#ff3300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Draws a thin HP bar beneath the enemy */
  _drawHPBar(ctx) {
    const barWidth = this.radius * 2;
    const barHeight = 3;
    const x = -barWidth / 2;
    const y = this.radius + 6;
    const hpRatio = this.hp / this.maxHp;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Fill
    const hue = hpRatio * 120; // Red to green
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
  }
}
