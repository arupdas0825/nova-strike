'use strict';

import { CONSTANTS } from './config/constants.js';
import { Canvas } from './engine/Canvas.js';
import { Input } from './engine/Input.js';
import { AudioEngine } from './engine/Audio.js';
import { Camera } from './engine/Camera.js';
import { Pool } from './engine/Pool.js';
import { Stars } from './effects/Stars.js';
import { Nebula } from './effects/Nebula.js';
import { Bullet } from './entities/Bullet.js';
import { Particle } from './entities/Particle.js';
import { PowerUp } from './entities/PowerUp.js';
import { Missile } from './entities/Missile.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Collision } from './systems/Collision.js';
import { Spawner } from './systems/Spawner.js';
import { ScoreSystem } from './systems/ScoreSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { HUD } from './ui/HUD.js';
import { TitleScreen } from './ui/TitleScreen.js';
import { GameOverScreen } from './ui/GameOverScreen.js';
import { PauseScreen } from './ui/PauseScreen.js';
import { TouchControls } from './ui/TouchControls.js';

/**
 * Main Game class — orchestrates the game loop, state machine,
 * entity management, and rendering pipeline.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvasElement
   */
  constructor(canvasElement) {
    // Core engine
    this.canvas = new Canvas(canvasElement);
    this.ctx = this.canvas.ctx;
    this.input = new Input();
    this.audio = new AudioEngine();
    this.camera = new Camera();

    // Object pools
    this.bulletPool = new Pool(Bullet, 120);
    this.particlePool = new Pool(Particle, 500);
    this.powerupPool = new Pool(PowerUp, 30);
    this.missilePool = new Pool(Missile, 20);
    this.enemyPool = new Pool(Enemy, 40);

    // Active entity arrays (swap-and-pop management)
    /** @type {Bullet[]} */
    this.bullets = [];
    /** @type {Particle[]} */
    this.particles = [];
    /** @type {PowerUp[]} */
    this.powerups = [];
    /** @type {Missile[]} */
    this.missiles = [];
    /** @type {Enemy[]} */
    this.enemies = [];

    // Player
    this.player = new Player();

    // Background effects
    this.stars = new Stars();
    this.nebula = new Nebula();

    // Systems
    this.collision = new Collision(this);
    this.spawner = new Spawner(this);
    this.scoreSystem = new ScoreSystem(this);
    this.saveSystem = new SaveSystem('novaStrikeHS');

    // UI Screens
    this.hud = new HUD(this);
    this.titleScreen = new TitleScreen();
    this.gameOverScreen = new GameOverScreen();
    this.pauseScreen = new PauseScreen();
    this.touchControls = new TouchControls(this.canvas, this.input);

    // Game State
    this.state = CONSTANTS.STATE_TITLE;
    this.highScore = this.saveSystem.loadHighScore();

    // Frame timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;

    // Audio mute persistence
    const savedMuted = this.saveSystem.loadMuted();
    if (savedMuted) {
      this.audio.setMute(true);
    }
  }

  /**
   * Starts the game loop
   */
  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * Main game loop with fixed-timestep accumulator
   * @param {number} timestamp
   */
  loop(timestamp) {
    if (!this.running) return;

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap delta to prevent spiral of death
    this.accumulator += Math.min(delta, 100);

    while (this.accumulator >= CONSTANTS.FRAME_TIME) {
      this.update();
      this.accumulator -= CONSTANTS.FRAME_TIME;
    }

    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * Main update dispatcher — delegates to current state handler
   */
  update() {
    // Global: Mute toggle
    if (this.input.isKeyJustPressed('n')) {
      this.audio.setMute(!this.audio.muted);
      this.saveSystem.saveMuted(this.audio.muted);
    }

    switch (this.state) {
      case CONSTANTS.STATE_TITLE:
        this._updateTitle();
        break;
      case CONSTANTS.STATE_PLAYING:
        this._updatePlaying();
        break;
      case CONSTANTS.STATE_PAUSED:
        this._updatePaused();
        break;
      case CONSTANTS.STATE_DYING:
        this._updateDying();
        break;
      case CONSTANTS.STATE_GAMEOVER:
        this._updateGameOver();
        break;
    }
  }

  /**
   * Main draw dispatcher — delegates to current state renderer
   */
  draw() {
    this.canvas.clear();
    const ctx = this.ctx;

    // Always draw background
    ctx.fillStyle = CONSTANTS.COLORS.BG;
    ctx.fillRect(0, 0, CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);

    switch (this.state) {
      case CONSTANTS.STATE_TITLE:
        this.stars.draw(ctx);
        this.nebula.draw(ctx);
        this.titleScreen.draw(ctx, this.highScore);
        break;

      case CONSTANTS.STATE_PLAYING:
      case CONSTANTS.STATE_DYING:
        this._drawGameplay(ctx);
        break;

      case CONSTANTS.STATE_PAUSED:
        this._drawGameplay(ctx);
        this.pauseScreen.draw(ctx);
        break;

      case CONSTANTS.STATE_GAMEOVER:
        this._drawGameplay(ctx);
        this.gameOverScreen.draw(
          ctx,
          this.scoreSystem.score,
          this.highScore,
          this.scoreSystem.level,
          this.scoreSystem.bossKills
        );
        break;
    }

    // Touch controls overlay (always on top)
    this.touchControls.draw(ctx);
  }

  // ─── STATE HANDLERS ────────────────────────────────────────

  _updateTitle() {
    this.stars.update();
    this.nebula.update();
    this.titleScreen.update();

    if (this.input.isKeyJustPressed('enter') || this.input.isKeyJustPressed(' ')) {
      this.audio.resumeContext();
      this._startNewGame();
    }
  }

  _updatePlaying() {
    // Pause toggle
    if (this.input.isKeyJustPressed('p') || this.input.isKeyJustPressed('escape')) {
      this.state = CONSTANTS.STATE_PAUSED;
      this.pauseScreen.timer = 0;
      return;
    }

    // Update background
    this.stars.update();
    this.nebula.update();
    this.camera.update();

    // Update player
    this.player.update(this.input, this.particlePool, this.particles);

    // Player firing
    if (this.player.alive && this.player.fireCooldown <= 0) {
      if (this.input.isKeyDown(' ') || this.input.isKeyDown('spacebar')) {
        this._playerFire();
      }
    }

    // Missile launch
    if (this.player.alive && this.input.isKeyJustPressed('m')) {
      this._playerMissile();
    }

    // Update entities
    this._updateEntities();

    // Systems
    this.spawner.update();
    this.collision.update();
    this.scoreSystem.update();

    // Cleanup dead entities (swap-and-pop)
    this._cleanup();

    // Check player death
    if (!this.player.alive && this.state === CONSTANTS.STATE_PLAYING) {
      this.state = CONSTANTS.STATE_DYING;
      this.player.deathTimer = CONSTANTS.PLAYER_DEATH_TIMEOUT;
      this._spawnPlayerExplosion();
    }
  }

  _updatePaused() {
    this.pauseScreen.update();

    if (this.input.isKeyJustPressed('p') || this.input.isKeyJustPressed('escape')) {
      this.state = CONSTANTS.STATE_PLAYING;
    }
  }

  _updateDying() {
    // Continue updating effects during death sequence
    this.stars.update();
    this.nebula.update();
    this.camera.update();
    this._updateEntities();
    this._cleanup();

    this.player.deathTimer--;

    if (this.player.deathTimer <= 0) {
      // Transition to game over
      const isNewHS = this.saveSystem.saveHighScore(this.scoreSystem.score);
      if (isNewHS) {
        this.highScore = this.scoreSystem.score;
      }
      this.gameOverScreen.reset(isNewHS);
      this.state = CONSTANTS.STATE_GAMEOVER;
    }
  }

  _updateGameOver() {
    this.stars.update();
    this.nebula.update();
    this.gameOverScreen.update();
    this._updateEntities();
    this._cleanup();

    if (this.gameOverScreen.timer > 60) {
      if (this.input.isKeyJustPressed('enter') || this.input.isKeyJustPressed(' ')) {
        this._startNewGame();
      }
    }
  }

  // ─── GAMEPLAY METHODS ──────────────────────────────────────

  /**
   * Initializes a fresh game session
   */
  _startNewGame() {
    // Clear all entities
    this._recycleAll(this.bullets, this.bulletPool);
    this._recycleAll(this.particles, this.particlePool);
    this._recycleAll(this.powerups, this.powerupPool);
    this._recycleAll(this.missiles, this.missilePool);
    this._recycleAll(this.enemies, this.enemyPool);

    // Reset player and systems
    this.player.reset();
    this.scoreSystem.reset();
    this.spawner.reset();
    this.camera.shakeMagnitude = 0;

    this.state = CONSTANTS.STATE_PLAYING;
  }

  /**
   * Player fires primary weapon
   */
  _playerFire() {
    this.player.fireCooldown = this.player.getFireCooldown();

    const bulletSpeed = -9;
    const b = this.bulletPool.obtain(
      this.player.x, this.player.y - this.player.radius - 4,
      0, bulletSpeed,
      CONSTANTS.COLORS.BULLET_PLAYER,
      10,
      true
    );
    this.bullets.push(b);
    this.audio.playShoot();
  }

  /**
   * Player launches homing missile
   */
  _playerMissile() {
    if (this.player.missiles <= 0) return;

    this.player.missiles--;
    const m = this.missilePool.obtain(
      this.player.x,
      this.player.y - this.player.radius - 8,
      0, -3
    );
    this.missiles.push(m);
    this.audio.playMissile();
  }

  /**
   * Spawns the player death explosion effect
   */
  _spawnPlayerExplosion() {
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      const life = Math.floor(Math.random() * 35) + 20;
      const size = Math.random() * 4 + 1;
      const color = Math.random() > 0.3 ? CONSTANTS.COLORS.PLAYER : '#ffffff';

      const p = this.particlePool.obtain(
        this.player.x, this.player.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color, life, size
      );
      this.particles.push(p);
    }
    this.audio.playExplode(true);
    this.camera.shake(18);
  }

  // ─── ENTITY MANAGEMENT ────────────────────────────────────

  /**
   * Updates all active entities
   */
  _updateEntities() {
    // Update bullets
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update();
    }

    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
    }

    // Update powerups
    for (let i = 0; i < this.powerups.length; i++) {
      this.powerups[i].update();
    }

    // Update missiles
    for (let i = 0; i < this.missiles.length; i++) {
      this.missiles[i].update(this.enemies, this.particlePool);
    }

    // Update enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(this.player.x, this.player.y);
    }
  }

  /**
   * Removes inactive entities using swap-and-pop for O(1) removal
   */
  _cleanup() {
    this._cleanArray(this.bullets, this.bulletPool);
    this._cleanArray(this.particles, this.particlePool);
    this._cleanArray(this.powerups, this.powerupPool);
    this._cleanArray(this.missiles, this.missilePool);
    this._cleanArray(this.enemies, this.enemyPool);
  }

  /**
   * Swap-and-pop cleanup for an entity array
   * @param {any[]} arr
   * @param {Pool} pool
   */
  _cleanArray(arr, pool) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].active) {
        pool.free(arr[i]);
        arr[i] = arr[arr.length - 1];
        arr.pop();
      }
    }
  }

  /**
   * Recycles all entities in an array back to the pool
   * @param {any[]} arr
   * @param {Pool} pool
   */
  _recycleAll(arr, pool) {
    for (let i = 0; i < arr.length; i++) {
      pool.free(arr[i]);
    }
    arr.length = 0;
  }

  // ─── RENDERING ─────────────────────────────────────────────

  /**
   * Draws the full gameplay scene (called during playing, dying, paused, gameover states)
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawGameplay(ctx) {
    // Background layers (no camera shake)
    this.nebula.draw(ctx);
    this.stars.draw(ctx);

    // Apply camera (screen shake)
    this.camera.applyTransform(ctx);

    // Powerups (below entities)
    for (let i = 0; i < this.powerups.length; i++) {
      this.powerups[i].draw(ctx);
    }

    // Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx);
    }

    // Player
    this.player.draw(ctx);

    // Bullets
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }

    // Missiles
    for (let i = 0; i < this.missiles.length; i++) {
      this.missiles[i].draw(ctx);
    }

    // Particles (on top)
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }

    // Remove camera transform
    this.camera.restoreTransform(ctx);

    // HUD (not affected by camera shake)
    if (this.state === CONSTANTS.STATE_PLAYING || this.state === CONSTANTS.STATE_DYING) {
      this.hud.draw(ctx);
    }
  }
}
