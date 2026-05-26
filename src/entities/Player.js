'use strict';

import { CONSTANTS } from '../config/constants.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';

/**
 * Player Starfighter Entity.
 * Simulates high-fidelity flight dynamics via Verlet integration, boundary elastic bounces,
 * cycles switchable weaponry, regulates shield absorb arc buffers, and renders gradient exhaust paths.
 */
export class Player {
  constructor() {
    this.x = CONSTANTS.GAME_WIDTH / 2;
    this.y = CONSTANTS.GAME_HEIGHT - 120;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;

    this.radius = 12;
    this.hp = CONSTANTS.PLAYER_MAX_HP;
    this.maxHp = CONSTANTS.PLAYER_MAX_HP;
    this.shield = 0;           // Shield capacity: max 60
    this.missiles = 3;         // Current missiles: max 8

    this.active = true;
    this.alive = true;

    // Weapon system manager
    this.weaponSystem = new WeaponSystem(this);

    // Invincibility parameters
    this.invTimer = 0;         // frames remaining
    this.invFlashTimer = 0;
    this.visible = true;

    // Death animation state
    this.deathTimer = 0;       // ms remaining

    // Bank tilting
    this.tilt = 0;

    // 12-point Engine trail history
    this.trail = [];
    this.trailTimer = 0;

    this.input = null; // reference set in Game
  }

  /**
   * Resets player to spawn status
   */
  reset() {
    this.x = CONSTANTS.GAME_WIDTH / 2;
    this.y = CONSTANTS.GAME_HEIGHT - 120;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    
    this.hp = CONSTANTS.PLAYER_MAX_HP;
    this.shield = 0;
    this.missiles = 3;
    
    this.active = true;
    this.alive = true;
    this.invTimer = CONSTANTS.PLAYER_INVINCIBILITY_FRAMES;
    this.deathTimer = 0;
    this.tilt = 0;
    this.trail = [];

    this.weaponSystem = new WeaponSystem(this);
  }

  /**
   * Verlet integration physics update
   * @param {Object} input 
   * @param {Object} particlePool 
   * @param {Array} particles 
   * @param {number} dt - delta time in seconds
   * @param {Object} audio
   */
  update(input, particlePool, particles, dt, audio) {
    this.input = input;

    if (!this.alive) {
      this.deathTimer = Math.max(0, this.deathTimer - dt * 1000);
      return;
    }

    // 1. Accel inputs (Keyboard / Gamepad)
    this.ax = 0;
    this.ay = 0;
    const accel = CONSTANTS.PLAYER_THRUST;

    if (input.gamepadAxes) {
      // Gamepad control
      this.ax = input.gamepadAxes.x * accel;
      this.ay = input.gamepadAxes.y * accel;
    } else {
      // Keyboard WASD/Arrow controls
      let moveX = 0;
      let moveY = 0;

      if (input.isKeyDown('arrowleft') || input.isKeyDown('a')) moveX -= 1;
      if (input.isKeyDown('arrowright') || input.isKeyDown('d')) moveX += 1;
      if (input.isKeyDown('arrowup') || input.isKeyDown('w')) moveY -= 1;
      if (input.isKeyDown('arrowdown') || input.isKeyDown('s')) moveY += 1;

      // Normalization to prevent diagonal speeding
      if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        this.ax = (moveX / length) * accel;
        this.ay = (moveY / length) * accel;
      }
    }

    // 2. Verlet Physics Integration:
    // pos += vel * dt
    // vel += acc * dt
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.vx += this.ax * dt;
    this.vy += this.ay * dt;

    // Frame-rate independent drag friction
    const friction = Math.pow(CONSTANTS.PLAYER_FRICTION, dt * 60);
    this.vx *= friction;
    this.vy *= friction;

    // Speed clamping
    const curSpeed = Math.hypot(this.vx, this.vy);
    if (curSpeed > CONSTANTS.PLAYER_MAX_SPEED) {
      this.vx = (this.vx / curSpeed) * CONSTANTS.PLAYER_MAX_SPEED;
      this.vy = (this.vy / curSpeed) * CONSTANTS.PLAYER_MAX_SPEED;
    }

    // 3. Elastic boundary bouncing with 0.65 damping
    const pad = this.radius;
    const bounceDamping = CONSTANTS.PLAYER_DAMPING;

    if (this.x < pad) {
      this.x = pad;
      this.vx = -this.vx * bounceDamping;
    } else if (this.x > CONSTANTS.GAME_WIDTH - pad) {
      this.x = CONSTANTS.GAME_WIDTH - pad;
      this.vx = -this.vx * bounceDamping;
    }

    if (this.y < pad) {
      this.y = pad;
      this.vy = -this.vy * bounceDamping;
    } else if (this.y > CONSTANTS.GAME_HEIGHT - pad) {
      this.y = CONSTANTS.GAME_HEIGHT - pad;
      this.vy = -this.vy * bounceDamping;
    }

    // 4. Visual tilt bank (vx * 0.04 capped at 0.22 rad)
    const rawTilt = this.vx * CONSTANTS.PLAYER_TILT_SCALE;
    this.tilt = Math.max(-CONSTANTS.PLAYER_TILT_MAX, Math.min(CONSTANTS.PLAYER_TILT_MAX, rawTilt));

    // 5. Update weapon cooldowns
    this.weaponSystem.update(dt);

    // Q/Select weapon swap
    if (input.isKeyJustPressed('q')) {
      this.weaponSystem.switchWeapon(audio);
    }

    // Weapon Upgrades and invincibility
    if (this.invTimer > 0) {
      this.invTimer -= dt * 60;
      this.invFlashTimer++;
      this.visible = this.invFlashTimer % 6 < 3;
    } else {
      this.visible = true;
    }

    // 6. 12-point engine trail history tracking
    this.trailTimer++;
    if (this.trailTimer % 2 === 0) {
      this.trail.unshift({ x: this.x, y: this.y + this.radius });
      if (this.trail.length > 12) {
        this.trail.pop();
      }
    }

    // Generate exhaust particles too for kinetic spray
    if (this.trailTimer % 3 === 0 && particlePool && particles) {
      const p = particlePool.obtain();
      if (p) {
        const enginePower = Math.hypot(this.vx, this.vy) / CONSTANTS.PLAYER_MAX_SPEED;
        const driftX = (Math.random() * 2 - 1) * 2;
        const speedY = Math.random() * 120 + 80 + (enginePower * 100);
        
        p.init(
          this.x + driftX,
          this.y + this.radius + 2,
          (Math.random() * 2 - 1) * 12,
          speedY,
          0.18 + Math.random() * 0.1,
          Math.random() > 0.4 ? '#00f3ff' : '#0066ff',
          Math.random() * 2.0 + 1.0
        );
      }
    }
  }

  /**
   * Inflicts damage, reducing shield reserves or hull integrity
   * @param {number} amount 
   * @param {Object} camera 
   * @param {Object} audio 
   */
  takeDamage(amount, camera, audio) {
    if (this.invTimer > 0 || !this.alive) return;

    if (this.shield > 0) {
      audio.playShieldAbsorb();
      this.shield -= amount;
      if (this.shield < 0) {
        this.hp += this.shield; // spillover
        this.shield = 0;
      }
      this.invTimer = 18; // short invincibility on shield hit
      camera.shake(0.24);
      return;
    }

    audio.playPlayerHit();
    this.hp -= amount;
    this.invTimer = 40; // longer invincibility
    
    // Intense camera shake on direct hull damage
    camera.shake(0.48);

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.active = false;
      this.deathTimer = CONSTANTS.PLAYER_DEATH_DURATION;
      audio.playExplosionLarge();
    }
  }

  /**
   * Refill hull hitpoints
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Refill shield capacity (max 60)
   */
  activateShield() {
    this.shield = 60;
  }

  /**
   * Renders player starfighter ship, glowing engines, engine trail, and shields.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.alive || !this.visible) return;

    // 1. Draw tapering gradient engine trail
    if (this.trail.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Draw path
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }

      // Trail: white core -> cyan -> transparent
      const grad = ctx.createLinearGradient(
        this.x, this.y, 
        this.trail[this.trail.length - 1].x, 
        this.trail[this.trail.length - 1].y
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.25, 'rgba(0, 243, 255, 0.6)');
      grad.addColorStop(0.7, 'rgba(0, 102, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw Ship
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    // Engine flame scale relative to velocity length
    const speedPower = Math.hypot(this.vx, this.vy) / CONSTANTS.PLAYER_MAX_SPEED;
    const flameHeight = Math.max(5, 5 + speedPower * 14 + Math.sin(Date.now() * 0.05) * 3);

    // Draw engine flame
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flameGrad = ctx.createLinearGradient(0, this.radius, 0, this.radius + flameHeight);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#00ffff');
    flameGrad.addColorStop(0.7, '#0055ff');
    flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-4, this.radius);
    ctx.lineTo(0, this.radius + flameHeight);
    ctx.lineTo(4, this.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Fuselage shadow glow
    ctx.shadowColor = CONSTANTS.COLORS.PLAYER;
    ctx.shadowBlur = 15;

    // Ship shape (Premium vector design)
    ctx.fillStyle = CONSTANTS.COLORS.PLAYER;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius - 4);   // Nose
    ctx.lineTo(-8, -2);                 // Left shoulder
    ctx.lineTo(-12, this.radius);       // Left wingtip
    ctx.lineTo(-4, this.radius - 4);    // Left inner hull
    ctx.lineTo(0, this.radius + 2);     // Center tail
    ctx.lineTo(4, this.radius - 4);     // Right inner hull
    ctx.lineTo(12, this.radius);        // Right wingtip
    ctx.lineTo(8, -2);                  // Right shoulder
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Canopy glass
    ctx.fillStyle = '#002540';
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

    ctx.restore();

    // 3. Shield Ring: arc drawn around player ship directly
    if (this.shield > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Arc matches current shield percentage
      const shieldPct = this.shield / 60;
      const angleEnd = Math.PI * 2 * shieldPct - Math.PI / 2;

      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0088ff';
      ctx.shadowBlur = 12;

      // Draw active shield arc
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12, -Math.PI / 2, angleEnd);
      ctx.stroke();

      // Draw faint background shield path
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.12)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Weapon Upgrade Aura
    if (this.weaponSystem.weaponUpgradeTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.015) * 0.15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
