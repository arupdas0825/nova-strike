'use strict';

/**
 * NOVA STRIKE Game Constants - Pro Realism Edition (v3.0)
 */
export const CONSTANTS = {
  // Logical Game Dimensions (internally scaled to physical screen resolution)
  GAME_WIDTH: 1200,
  GAME_HEIGHT: 800,
  TARGET_FPS: 60,

  // Global Debug Flag (disables console logging when false)
  DEBUG: false,

  // Game State Machine Enums
  STATE_TITLE: 'title',
  STATE_PLAYING: 'playing',
  STATE_PAUSED: 'paused',
  STATE_SETTINGS: 'settings',
  STATE_DYING: 'dying',
  STATE_GAMEOVER: 'gameover',

  // LocalStorage Keys
  LOCAL_STORAGE_SCORE_KEY: 'novaStrikeHS',
  LOCAL_STORAGE_SETTINGS_KEY: 'novaStrikeSettings',

  // Entity Limits (Performance limits)
  MAX_PARTICLES: 500,
  MAX_BULLETS: 150,
  MAX_POWERUPS: 30,
  MAX_ENEMIES: 25,
  MAX_EXPLOSIONS: 50,

  // Player Physics and Controls (Verlet integration)
  PLAYER_THRUST: 420,             // px/s^2 acceleration
  PLAYER_MAX_SPEED: 340,          // px/s capped speed
  PLAYER_FRICTION: 0.88,          // frame-rate independent drag coefficient (used in power decay)
  PLAYER_ROTATION_SPEED: 3.2,     // rad/s
  PLAYER_TILT_MAX: 0.22,          // capped max tilt in radians (vx * 0.04 capped at 0.22)
  PLAYER_TILT_SCALE: 0.04,        // tilt scale factor
  PLAYER_MAX_HP: 100,
  PLAYER_INVINCIBILITY_FRAMES: 95,
  PLAYER_DEATH_DURATION: 1800,    // ms of cinematic death
  PLAYER_DAMPING: 0.65,           // boundary bounce damping

  // Weapon Upgrade Durations
  WEAPON_UPGRADE_DURATION: 300,   // 300 frames of ×1.5 damage
  RAPID_FIRE_DURATION: 360,       // 360 frames of ÷3 cooldown

  // Spawner and Wave Parameters
  SPAWNER_MAX_LIVE_ENEMIES_BASE: 4,
  SPAWNER_COOLDOWN_BASE: 120,
  SPAWNER_COOLDOWN_MIN: 30,
  BOSS_SCORE_MILESTONE: 500,

  // Power-Up System Parameters
  POWERUP_DROP_CHANCE: 0.45,
  POWERUP_BOSS_DROP_COUNT: 4,
  POWERUP_LIFESPAN: 720,          // total frames before disappear
  POWERUP_FLASH_THRESHOLD: 180,   // frames left when flashing starts
  POWERUP_SPEED: 90,              // px/s descent

  // Combo and Progression System
  COMBO_MAX: 10,
  COMBO_DECAY_FRAMES: 150,
  SCORE_PER_LEVEL: 350,

  // Camera Trauma System
  TRAUMA_DECAY: 0.92,             // multiplier per frame

  // Sound Config
  DEFAULT_MASTER_VOLUME: 0.70,
  DEFAULT_SFX_VOLUME: 0.85,

  // Difficulty Modifiers
  DIFFICULTY: {
    EASY: {
      NAME: 'Easy',
      hpMultiplier: 0.7,
      fireRateMultiplier: 0.6,
      spawnRateMultiplier: 0.7,
      predictiveAim: false
    },
    NORMAL: {
      NAME: 'Normal',
      hpMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      predictiveAim: false
    },
    HARD: {
      NAME: 'Hard',
      hpMultiplier: 1.3,
      fireRateMultiplier: 1.3,
      spawnRateMultiplier: 1.2,
      predictiveAim: false
    },
    INSANE: {
      NAME: 'Insane',
      hpMultiplier: 1.8,
      fireRateMultiplier: 1.7,
      spawnRateMultiplier: 1.5,
      predictiveAim: true // enemies aim ahead!
    }
  },

  // Color Palette
  COLORS: {
    BG: '#020208',
    PLAYER: '#00f3ff',
    SHIELD: '#0088ff',
    SCOUT: '#ff00ff',
    FIGHTER: '#ff8800',
    BOMBER: '#ff2244',
    INTERCEPTOR: '#00ffaa',
    DREADNOUGHT: '#6600ff',
    BOSS: '#bb00ff',
    BULLET_PLAYER: '#00ffff',
    BULLET_SPREAD: '#ff8800',
    BULLET_ENEMY: '#ff003c',
    MISSILE: '#be1eff',
    POWERUP_HEALTH: '#00ff88',
    POWERUP_RAPID: '#ff4400',
    POWERUP_SHIELD: '#0088ff',
    POWERUP_MISSILE: '#bb00ff',
    POWERUP_WEAPONUP: '#ffff00',
    POWERUP_NUKE: '#ff0000',
    TEXT_CYAN: '#00ffff',
    TEXT_MAGENTA: '#ff00ff',
    TEXT_WHITE: '#ffffff',
    TEXT_GREY: '#888899',
    TEXT_YELLOW: '#ffff00'
  }
};
