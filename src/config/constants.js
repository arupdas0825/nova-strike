'use strict';

/**
 * NOVA STRIKE Game Constants
 */
export const CONSTANTS = {
  // Logical Game Dimensions (internally scaled to physical screen resolution)
  GAME_WIDTH: 1200,
  GAME_HEIGHT: 800,
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60,

  // Global Debug Flag (disables console logging when false)
  DEBUG: false,

  // Game State Machine Enums
  STATE_TITLE: 'title',
  STATE_PLAYING: 'playing',
  STATE_PAUSED: 'paused',
  STATE_DYING: 'dying',
  STATE_GAMEOVER: 'gameover',

  // Entity Limits (Performance limits)
  MAX_PARTICLES: 400,
  MAX_BULLETS: 100,
  MAX_POWERUPS: 20,

  // Player Physics and Controls
  PLAYER_SPEED: 0.65,
  PLAYER_FRICTION: 0.88,
  PLAYER_MAX_HP: 100,
  PLAYER_INVINCIBILITY_FRAMES: 95,
  PLAYER_SHIELD_DECAY: 0.06,
  PLAYER_BASE_COOLDOWN: 14,
  PLAYER_RAPID_COOLDOWN: 3,
  PLAYER_RAPID_DURATION: 320,
  PLAYER_MAX_MISSILES: 10,
  PLAYER_START_MISSILES: 3,
  PLAYER_DEATH_TIMEOUT: 96, // 1600ms at 60fps (96 frames)

  // Spawner and Wave Parameters
  SPAWNER_MAX_LIVE_ENEMIES_BASE: 3,
  SPAWNER_COOLDOWN_BASE: 105,
  SPAWNER_COOLDOWN_MIN: 28,
  SPAWNER_LEVEL_COOLDOWN_REDUCTION: 5,
  BOSS_SCORE_MILESTONE: 500,

  // Power-Up System Parameters
  POWERUP_DROP_CHANCE: 0.48,
  POWERUP_BOSS_DROP_COUNT: 5,
  POWERUP_LIFESPAN: 600,
  POWERUP_GRAVITY: 0.1,
  POWERUP_RADIUS_SUM: 25, // circle collision radius 13 + player radius 12 = 25

  // Combo and Progression System
  COMBO_MAX: 10,
  COMBO_DECAY_FRAMES: 130,
  SCORE_PER_LEVEL: 200,

  // Visual Effects
  STAR_COUNT: 220,
  NEBULA_COUNT: 4,
  SCREEN_SHAKE_DECAY: 0.82,

  // Audio settings
  AUDIO_VOLUME: 0.12,

  // Color Palette
  COLORS: {
    BG: '#020208',
    PLAYER: '#00f3ff',
    SHIELD: '#00d0ff',
    SCOUT: '#ff0055',
    FIGHTER: '#ff5500',
    BOMBER: '#a800ff',
    BOSS: '#ffaa00',
    BULLET_PLAYER: '#00ffff',
    BULLET_ENEMY: '#ff003c',
    MISSILE: '#d21eff',
    POWERUP_HEALTH: '#00ff66',
    POWERUP_RAPID: '#ff7700',
    POWERUP_SHIELD: '#00aeff',
    POWERUP_MISSILE: '#be1eff',
    TEXT_YELLOW: '#ffea00',
    TEXT_WHITE: '#ffffff',
    TEXT_GREY: '#888899',
    TEXT_MAGENTA: '#ff00ff'
  }
};
