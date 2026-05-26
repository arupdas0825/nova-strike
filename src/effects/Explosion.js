'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Procedural explosion system supporting expanding shockwave rings, 
 * rapid radial flash sweeps, and physically accurate tumbling rectangular debris shards.
 */
export class Explosion {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.active = false;
    
    this.isBoss = false;
    this.maxRadius = 50;
    this.age = 0;
    this.lifetime = 0.8; // seconds

    this.rings = [];
    this.shockwave = null;
    this.shards = [];
    this.flashActive = false;
    this.flashAlpha = 0;
  }

  /**
   * Initializes or recycles an explosion event
   * @param {number} x 
   * @param {number} y 
   * @param {number} radius - target explosion size
   * @param {boolean} isBoss - if true, sequences 4 delayed rings
   */
  init(x, y, radius = 40, isBoss = false) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.isBoss = isBoss;
    this.maxRadius = radius;
    this.age = 0;
    
    // Boss explosions last longer
    this.lifetime = isBoss ? 1.4 : 0.65; 

    this.rings = [];
    this.shards = [];
    this.flashActive = isBoss; // screen flash triggers on boss death
    this.flashAlpha = isBoss ? 0.6 : 0;

    // Staggered rings configurations
    // 25 frames is approx 0.42 seconds duration
    const ringDur = 0.42; 
    
    if (isBoss) {
      // 4 rings at 0f, 8f, 16f, 24f (0s, 0.13s, 0.27s, 0.40s)
      this.rings.push({ delay: 0.0,  duration: ringDur, maxR: radius * 0.7, color: '#bb00ff', currentR: 0, opacity: 1.0 });
      this.rings.push({ delay: 0.13, duration: ringDur, maxR: radius * 1.0, color: '#ff00ff', currentR: 0, opacity: 1.0 });
      this.rings.push({ delay: 0.27, duration: ringDur, maxR: radius * 0.8, color: '#00ffff', currentR: 0, opacity: 1.0 });
      this.rings.push({ delay: 0.40, duration: ringDur, maxR: radius * 1.2, color: '#ffffff', currentR: 0, opacity: 1.0 });
    } else {
      // Standard: 3 expanding rings
      this.rings.push({ delay: 0.0,  duration: ringDur, maxR: radius * 0.6, color: '#ff8800', currentR: 0, opacity: 1.0 });
      this.rings.push({ delay: 0.06, duration: ringDur, maxR: radius * 0.9, color: '#ff3300', currentR: 0, opacity: 1.0 });
      this.rings.push({ delay: 0.12, duration: ringDur, maxR: radius * 1.0, color: '#ffff00', currentR: 0, opacity: 1.0 });
    }

    // Shockwave (single thin ring, expands to 2.5x r over 0.2s)
    this.shockwave = {
      currentR: 0,
      maxR: radius * 2.5,
      duration: 0.22,
      opacity: 1.0
    };

    // Shards: 6 to 12 rectangular debris shards flying outward with drag + rotation
    const shardCount = isBoss ? 20 : (Math.floor(Math.random() * 7) + 6);
    const colors = isBoss 
      ? ['#bb00ff', '#ff00ff', '#ffffff', '#00ffff'] 
      : ['#ff5500', '#ffaa00', '#ff3300', '#cccccc'];

    for (let i = 0; i < shardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 140; // px/s
      
      this.shards.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 2 - 1) * 8.0, // radians/s
        w: Math.random() * 6 + 3,
        h: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1.0,
        drag: 0.93 // frame independent drag
      });
    }
  }

  /**
   * Updates rings, shockwaves, and shard positions under Verlet physics
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    this.age += dt;

    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    // Update screen flash for Boss deaths
    if (this.flashActive) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.2);
      if (this.flashAlpha <= 0) {
        this.flashActive = false;
      }
    }

    // Update shockwave
    if (this.age < this.shockwave.duration) {
      const shockProgress = this.age / this.shockwave.duration;
      this.shockwave.currentR = shockProgress * this.shockwave.maxR;
      this.shockwave.opacity = Math.max(0, 1.0 - shockProgress);
    }

    // Update rings
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (this.age >= ring.delay) {
        const ringAge = this.age - ring.delay;
        if (ringAge < ring.duration) {
          const progress = ringAge / ring.duration;
          ring.currentR = progress * ring.maxR;
          ring.opacity = Math.max(0, 1.0 - progress);
        } else {
          ring.opacity = 0;
        }
      }
    }

    // Update debris shards using Verlet drag integrations
    for (let i = 0; i < this.shards.length; i++) {
      const shard = this.shards[i];
      
      // Position update
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      
      // Drag physics (independent of framerate)
      const friction = Math.pow(shard.drag, dt * 60);
      shard.vx *= friction;
      shard.vy *= friction;

      // Rotation
      shard.angle += shard.rotSpeed * dt;

      // Fade out based on overall explosion age
      const fadeProgress = this.age / this.lifetime;
      shard.opacity = Math.max(0, 1.0 - fadeProgress);
    }
  }

  /**
   * Draws rings, shockwave ring, shards, and applies additive blending glows.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Draw Shockwave
    if (this.age < this.shockwave.duration && this.shockwave.opacity > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.shockwave.opacity * 0.85})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.shockwave.currentR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw expanding concentric rings
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (this.age >= ring.delay && ring.opacity > 0) {
        ctx.fillStyle = ring.color;
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.opacity * 0.45;
        
        // Draw glow fill
        ctx.beginPath();
        ctx.arc(this.x, this.y, ring.currentR, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer ring boundary
        ctx.globalAlpha = ring.opacity;
        ctx.lineWidth = 3.0;
        ctx.stroke();
      }
    }

    // 3. Draw Debris Shards (drawn as solid rectangles)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < this.shards.length; i++) {
      const shard = this.shards[i];
      if (shard.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = shard.opacity;
        ctx.fillStyle = shard.color;
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.angle);
        ctx.fillRect(-shard.w / 2, -shard.h / 2, shard.w, shard.h);
        ctx.restore();
      }
    }

    ctx.restore();

    // 4. Draw screen flash on boss death
    if (this.flashActive && this.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);
      ctx.restore();
    }
  }

  get alive() {
    return this.active;
  }
}
