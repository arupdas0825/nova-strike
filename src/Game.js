'use strict';

import { CONSTANTS } from './config/constants.js';
import { Canvas } from './engine/Canvas.js';
import { Input } from './engine/Input.js';
import { AudioEngine } from './engine/Audio.js';
import { Camera } from './engine/Camera.js';
import { Pool } from './engine/Pool.js';

// Effects & post-process
import { Stars } from './effects/Stars.js';
import { Nebula } from './effects/Nebula.js';
import { Bloom } from './effects/Bloom.js';
import { Warp } from './effects/Warp.js';
import { Explosion } from './effects/Explosion.js';

// Entities
import { Bullet } from './entities/Bullet.js';
import { Particle } from './entities/Particle.js';
import { PowerUp } from './entities/PowerUp.js';
import { Missile } from './entities/Missile.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Laser } from './entities/Laser.js';

// Systems
import { Collision } from './systems/Collision.js';
import { Spawner } from './systems/Spawner.js';
import { ScoreSystem } from './systems/ScoreSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';

// UI Screens
import { HUD } from './ui/HUD.js';
import { TitleScreen } from './ui/TitleScreen.js';
import { GameOverScreen } from './ui/GameOverScreen.js';
import { PauseScreen } from './ui/PauseScreen.js';
import { SettingsScreen } from './ui/SettingsScreen.js';
import { TouchControls } from './ui/TouchControls.js';

/**
 * Master Game Controller and State Machine.
 * Orchestrates the variable-frame Verlet physics engine, registers input clicks,
 * filters offscreen composite bloom blits, and scales difficulty layers.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvasElement 
   */
  constructor(canvasElement) {
    // 1. Core Engine
    this.canvas = new Canvas(canvasElement);
    this.ctx = this.canvas.ctx;
    this.input = new Input();
    this.audio = new AudioEngine();
    this.camera = new Camera();

    // 2. Save/Load settings
    this.saveSystem = new SaveSystem();
    this.settings = this.saveSystem.loadSettings();

    // Sync audio parameters
    this.audio.setVolumes(this.settings.masterVolume / 100, this.settings.sfxVolume / 100);
    if (this.settings.muted) {
      this.audio.setMute(true);
    }

    // 3. Object Pools
    this.bulletPool = new Pool(Bullet, CONSTANTS.MAX_BULLETS);
    this.particlePool = new Pool(Particle, CONSTANTS.MAX_PARTICLES);
    this.powerupPool = new Pool(PowerUp, CONSTANTS.MAX_POWERUPS);
    this.missilePool = new Pool(Missile, 24);
    this.enemyPool = new Pool(Enemy, CONSTANTS.MAX_ENEMIES);
    this.explosionPool = new Pool(Explosion, CONSTANTS.MAX_EXPLOSIONS);

    // 4. Entity lists (managed via swap-and-pop)
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.missiles = [];
    this.enemies = [];
    this.explosions = [];

    // Player
    this.player = new Player();

    // 5. Visual Backgrounds & Post-Processing
    this.stars = new Stars();
    this.nebula = new Nebula();
    this.bloom = new Bloom(CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);
    this.bloom.enabled = this.settings.bloomEnabled;
    this.warp = new Warp();

    // Continuous laser weapon
    this.laser = new Laser();

    // 6. Gameplay Systems
    this.collision = new Collision(this);
    this.spawner = new Spawner(this);
    this.scoreSystem = new ScoreSystem(this);

    // 7. Interactive Screens
    this.hud = new HUD(this);
    this.titleScreen = new TitleScreen();
    this.settingsScreen = new SettingsScreen(this);
    this.gameOverScreen = new GameOverScreen();
    this.pauseScreen = new PauseScreen();
    this.touchControls = new TouchControls(this.canvas, this.input);

    // Initial state
    this.state = 'loading';
    this.highScore = this.saveSystem.loadHighScore();

    // Variable Timestep metrics
    this.lastTime = 0;
    this.running = false;
    
    // FPS tracking and bloom auto-disabler
    this.fps = 60;
    this.lowFpsTimer = 0; // seconds spent under 40 FPS

    // Event listener mappings
    this._bindPointerEvents(canvasElement);

    // Expose player globally for hostile missiles homing
    window.__gamePlayer = this.player;

    // HARD FALLBACK: if still loading after 3 seconds, force Title state and remove loader overlay
    this._loadingTimeout = setTimeout(() => {
      if (this.state === 'loading') {
        console.warn('NOVA STRIKE: Loading timed out — forcing title state.');
        this.state = CONSTANTS.STATE_TITLE;
        this._hideLoadingScreen();
      }
    }, 3000);
  }

  /**
   * Binds pointer clicks to Settings, Title, and GameOver button coordinates
   * @param {HTMLCanvasElement} el 
   */
  _bindPointerEvents(el) {
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const scaleX = CONSTANTS.GAME_WIDTH / rect.width;
      const scaleY = CONSTANTS.GAME_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Global audio gestured startup
      this.audio.resumeContext();

      if (this.state === CONSTANTS.STATE_TITLE) {
        // Settings/Config button check Y: 700 - 726, W: 140 centered
        const cx = CONSTANTS.GAME_WIDTH / 2;
        if (clickY >= 700 && clickY <= 726 && clickX >= cx - 70 && clickX <= cx + 70) {
          this.state = CONSTANTS.STATE_SETTINGS;
          this.settingsScreen.returnState = CONSTANTS.STATE_TITLE;
          this.audio.playWeaponSwitch();
          return;
        }

        // Tap to start individual
        this._startNewGame();
      } else if (this.state === CONSTANTS.STATE_SETTINGS) {
        this.settingsScreen.handleClick(clickX, clickY, this.audio);
      } else if (this.state === CONSTANTS.STATE_GAMEOVER) {
        if (this.gameOverScreen.timer > 60) {
          this._startNewGame();
        }
      }
    };

    el.addEventListener('pointerdown', handler);
  }

  /**
   * Synchronous boot sequence coordinating asset preloading, race timeouts, and state transition.
   */
  boot() {
    this._showLoadingScreen();

    // Simulate asset loading with guaranteed completion
    const loadPromise = this._loadAssets();
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));

    // Race: complete loading OR timeout after 2s — never hang
    Promise.race([loadPromise, timeout])
      .catch((err) => {
        if (CONSTANTS.DEBUG) console.error('NOVA STRIKE: Asset preloading error:', err);
      })
      .finally(() => {
        // Guarantee clear timeout
        if (this._loadingTimeout) {
          clearTimeout(this._loadingTimeout);
          this._loadingTimeout = null;
        }
        
        this._hideLoadingScreen();
        this.state = CONSTANTS.STATE_TITLE;
        this.start();
      });
  }

  /**
   * Simulates visual asset generation / cache checks
   * @returns {Promise<void>}
   */
  _loadAssets() {
    return Promise.resolve();
  }

  /**
   * Accesses the HTML preloader and displays it
   */
  _showLoadingScreen() {
    const el = document.getElementById('loader');
    if (!el) return;
    el.style.opacity = '1';
    el.style.display = 'flex';
    el.style.pointerEvents = 'auto';
  }

  /**
   * Dismisses the HTML preloader with a smooth opacity transition
   */
  _hideLoadingScreen() {
    const el = document.getElementById('loader');
    if (!el) return;
    
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
    
    // Completely disable pointer events and display after transition
    setTimeout(() => {
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }, 420);
  }

  /**
   * Boots up the animation loop
   */
  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Calculate real-time FPS
    if (delta > 0) {
      this.fps = Math.round(1000 / delta);
    }

    // Cap delta to prevent massive leaps on tab switches (0.05s / 20fps cap)
    const dt = Math.min(delta / 1000, 0.05);

    try {
      // Tick FPS monitor to disable bloom if dragging down mid-range systems
      this._monitorPerformance(dt);

      this.update(dt);
      this.draw();
    } catch (err) {
      if (CONSTANTS.DEBUG || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.error('[GameLoop] Frame error:', err);
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * Automatically disables bloom if FPS drops below 40 for 3+ consecutive seconds
   * @param {number} dt 
   */
  _monitorPerformance(dt) {
    if (this.bloom.enabled) {
      if (this.fps < 40) {
        this.lowFpsTimer += dt;
        if (this.lowFpsTimer >= 3.0) {
          this.lowFpsTimer = 0;
          this.settings.bloomEnabled = false;
          this.bloom.enabled = false;
          this.saveSystem.saveSettings(this.settings);
          
          if (CONSTANTS.DEBUG) console.warn('NOVA STRIKE Performance: Bloom automatically disabled due to low FPS.');
        }
      } else {
        this.lowFpsTimer = 0;
      }
    }
  }

  /**
   * Main game updates dispatcher using variable dt
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    // Update Input gamepad polling
    this.input.update();

    // Global: physical key mute toggle
    if (this.input.isKeyJustPressed('n')) {
      this.audio.setMute(!this.audio.muted);
      this.settings.muted = this.audio.muted;
      this.saveSystem.saveSettings(this.settings);
    }

    switch (this.state) {
      case CONSTANTS.STATE_TITLE:
        this._updateTitle(dt);
        break;

      case CONSTANTS.STATE_SETTINGS:
        this._updateSettings(dt);
        break;

      case CONSTANTS.STATE_PLAYING:
        this._updatePlaying(dt);
        break;

      case CONSTANTS.STATE_PAUSED:
        this._updatePaused(dt);
        break;

      case CONSTANTS.STATE_DYING:
        this._updateDying(dt);
        break;

      case CONSTANTS.STATE_GAMEOVER:
        this._updateGameOver(dt);
        break;
    }
  }

  /**
   * Drawing pipeline orchestrating layer hierarchies
   */
  draw() {
    this.canvas.clear();
    const ctx = this.ctx;

    // Draw background color
    ctx.fillStyle = CONSTANTS.COLORS.BG;
    ctx.fillRect(0, 0, CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);

    switch (this.state) {
      case CONSTANTS.STATE_TITLE:
        this.stars.draw(ctx);
        this.nebula.draw(ctx);
        this.titleScreen.draw(ctx, this.highScore);
        break;

      case CONSTANTS.STATE_SETTINGS:
        this.stars.draw(ctx);
        this.settingsScreen.draw(ctx);
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

    // Draw FPS counter if active
    if (this.settings.showFPS) {
      ctx.save();
      ctx.fillStyle = '#00ff66';
      ctx.font = "bold 11px 'Orbitron', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(`FPS: ${this.fps}`, CONSTANTS.GAME_WIDTH - 20, 52);
      ctx.restore();
    }

    // Touch controls overlay (drawn on top)
    this.touchControls.draw(ctx);
  }

  // ─── STATE UPDATE HANDLERS ─────────────────────────────────

  _updateTitle(dt) {
    this.stars.update(dt);
    this.nebula.update(dt);
    this.titleScreen.update(dt);

    // Play title ambient music loop
    this.audio.startMusic();

    if (this.input.isKeyJustPressed('enter')) {
      this._startNewGame();
    }
  }

  _updateSettings(dt) {
    this.stars.update(dt);
    this.settingsScreen.update(dt);
  }

  _updatePlaying(dt) {
    // Pause / Settings subpanel key maps
    if (this.input.isKeyJustPressed('escape') || this.input.isKeyJustPressed('p')) {
      this.state = CONSTANTS.STATE_PAUSED;
      this.pauseScreen.timer = 0;
      this.audio.playWeaponSwitch();
      return;
    }

    // Config settings key trigger
    if (this.input.isKeyJustPressed('c')) {
      this.state = CONSTANTS.STATE_SETTINGS;
      this.settingsScreen.returnState = CONSTANTS.STATE_PLAYING;
      this.audio.playWeaponSwitch();
      return;
    }

    // Scroll speed is scaled up during warp speedlines
    const starSpeedMultiplier = this.warp.active ? 8.0 : 1.0;
    this.stars.update(dt * starSpeedMultiplier);
    this.nebula.update(dt);
    this.camera.update(dt);
    this.warp.update(dt);

    // Update player
    this.player.update(this.input, this.particlePool, this.particles, dt, this.audio);

    // Player Firing Primary blasters
    if (this.player.alive && this.player.weaponSystem.cooldown <= 0) {
      const isFirePressed = this.input.isKeyDown(' ');
      
      if (isFirePressed) {
        this.player.weaponSystem.firePrimary(this.player.x, this.player.y, this.bulletPool, this.audio);
      }
    }

    // Player Firing Continuous Laser Ray
    this.laser.update(this.player, this.enemies, this.particlePool, dt, this.audio);

    // Fire missiles
    if (this.player.alive && this.input.isKeyJustPressed('m')) {
      // Lock onto closest enemy target
      this.player.weaponSystem.fireHomingMissile(this.player.x, this.player.y, this.player.weaponSystem.player.target, this.missilePool, this.audio);
    }

    // Update active entities list
    this._updateEntities(dt);

    // Systems orchestration
    this.spawner.update(dt);
    this.collision.update(dt);
    this.scoreSystem.update(dt);

    // Cleanup dead elements
    this._cleanup();

    // Check player death state
    if (!this.player.alive) {
      this.state = CONSTANTS.STATE_DYING;
      this.player.deathTimer = CONSTANTS.PLAYER_DEATH_DURATION;
      this._spawnPlayerExplosion();
      this.audio.stopLaserHum();
    }
  }

  _updatePaused(dt) {
    this.pauseScreen.update();

    if (this.input.isKeyJustPressed('escape') || this.input.isKeyJustPressed('p')) {
      this.state = CONSTANTS.STATE_PLAYING;
    }
  }

  _updateDying(dt) {
    // Continue background drifts
    this.stars.update(dt);
    this.nebula.update(dt);
    this.camera.update(dt);

    this._updateEntities(dt);
    this._cleanup();

    // Decrement cinematic death sequence
    this.player.update(this.input, this.particlePool, this.particles, dt, this.audio);

    if (this.player.deathTimer <= 0) {
      // Save high score comparison
      const isNewHS = this.saveSystem.saveHighScore(this.scoreSystem.score);
      if (isNewHS) {
        this.highScore = this.scoreSystem.score;
      }
      this.gameOverScreen.reset(isNewHS);
      this.state = CONSTANTS.STATE_GAMEOVER;
    }
  }

  _updateGameOver(dt) {
    this.stars.update(dt);
    this.nebula.update(dt);
    this.gameOverScreen.update(dt);

    this._updateEntities(dt);
    this._cleanup();

    if (this.gameOverScreen.timer > 60) {
      if (this.input.isKeyJustPressed('enter') || this.input.isKeyJustPressed(' ')) {
        this._startNewGame();
      }
    }
  }

  // ─── GAMEPLAY ENTITY HELPERS ───────────────────────────────

  _startNewGame() {
    // Stop ambient title music
    this.audio.stopMusic();

    // Recycle all active array nodes
    this._recycleAll(this.bullets, this.bulletPool);
    this._recycleAll(this.particles, this.particlePool);
    this._recycleAll(this.powerups, this.powerupPool);
    this._recycleAll(this.missiles, this.missilePool);
    this._recycleAll(this.enemies, this.enemyPool);
    this._recycleAll(this.explosions, this.explosionPool);

    this.player.reset();
    this.scoreSystem.reset();
    this.spawner.reset();
    this.camera.trauma = 0;
    this.warp.active = false;

    // Load Settings
    this.settings = this.saveSystem.loadSettings();
    this.bloom.enabled = this.settings.bloomEnabled;

    this.state = CONSTANTS.STATE_PLAYING;
  }

  _spawnPlayerExplosion() {
    this.camera.shake(0.95);
    const exp = this.explosionPool.obtain(this.player.x, this.player.y, 60, true);
    this.explosions.push(exp);
  }

  _updateEntities(dt) {
    // 1. Bullets
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update(dt);
    }

    // 2. Homing missiles
    for (let i = 0; i < this.missiles.length; i++) {
      this.missiles[i].update(this.enemies, this.particlePool, dt);
    }

    // 3. Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(this.player, dt, this.spawner);
    }

    // 4. Powerups
    for (let i = 0; i < this.powerups.length; i++) {
      this.powerups[i].update(dt);
    }

    // 5. Particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(dt);
    }

    // 6. concentric ring explosions
    for (let i = 0; i < this.explosions.length; i++) {
      this.explosions[i].update(dt);
    }
  }

  _cleanup() {
    this._cleanArray(this.bullets, this.bulletPool);
    this._cleanArray(this.missiles, this.missilePool);
    this._cleanArray(this.enemies, this.enemyPool);
    this._cleanArray(this.powerups, this.powerupPool);
    this._cleanArray(this.particles, this.particlePool);
    this._cleanArray(this.explosions, this.explosionPool);
  }

  _cleanArray(arr, pool) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].alive) {
        pool.free(arr[i]);
        arr[i] = arr[arr.length - 1];
        arr.pop();
      }
    }
  }

  _recycleAll(arr, pool) {
    for (let i = 0; i < arr.length; i++) {
      pool.free(arr[i]);
    }
    arr.length = 0;
  }

  // ─── COMPOSITE RENDER PASSES ───────────────────────────────

  /**
   * Draw ordered elements:
   * nebula→stars→particles→powerUps→enemies→bullets→missiles→laser→player→explosions→HUD→bloom composite
   */
  _drawGameplay(ctx) {
    // 1. DRAW BASE BACKGROUND (No camera shake)
    this.nebula.draw(ctx);
    this.stars.draw(ctx);

    // Apply screen shake
    this.camera.applyTransform(ctx);

    // 2. DRAW GLOWING ELEMENTS ON BLOOM BUFFER (If active)
    if (this.bloom.enabled) {
      this.bloom.clear();
      const bCtx = this.bloom.ctx;

      // Draw active glow targets
      for (let i = 0; i < this.powerups.length; i++) this.powerups[i].draw(bCtx);
      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(bCtx);
      for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw(bCtx);
      for (let i = 0; i < this.missiles.length; i++) this.missiles[i].draw(bCtx);
      
      this.laser.draw(bCtx, this.player);
      this.player.draw(bCtx);
      
      for (let i = 0; i < this.explosions.length; i++) this.explosions[i].draw(bCtx);
      for (let i = 0; i < this.particles.length; i++) {
        // Glowing particles only (no floating text)
        if (!this.particles[i].text) this.particles[i].draw(bCtx);
      }
    }

    // 3. DRAW GAME LAYERS TO MAIN SCREEN normally
    // Warp hyperspace line sweep under elements
    this.warp.draw(ctx);

    // Collectibles
    for (let i = 0; i < this.powerups.length; i++) {
      this.powerups[i].draw(ctx);
    }

    // Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx);
    }

    // Bullets
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }

    // Missiles
    for (let i = 0; i < this.missiles.length; i++) {
      this.missiles[i].draw(ctx);
    }

    // Continuous Laser beam
    this.laser.draw(ctx, this.player);

    // Player Starfighter
    this.player.draw(ctx);

    // concentrics explosions
    for (let i = 0; i < this.explosions.length; i++) {
      this.explosions[i].draw(ctx);
    }

    // Particles (glow sparks + text)
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }

    // Restore camera offsets
    this.camera.restoreTransform(ctx);

    // 4. APPLY COMPOSITE BLURS
    if (this.bloom.enabled) {
      this.bloom.apply(ctx);
    }

    // 5. DRAW HUD OVERLAY (No camera shake or blur)
    if (this.state === CONSTANTS.STATE_PLAYING || this.state === CONSTANTS.STATE_DYING) {
      this.hud.draw(ctx);
    }
  }
}
