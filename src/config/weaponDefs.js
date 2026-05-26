'use strict';

/**
 * NOVA STRIKE Weapon Configuration Definitions
 */
export const WEAPON_DEFS = {
  PLASMA: {
    NAME: 'PLASMA CANNON',
    COOLDOWN: 8,          // base cooldown in frames
    RAPID_COOLDOWN: 2,    // cooldown under rapidfire power-up
    DAMAGE: 12,
    COLOR: '#00ffff',
    GLOW: '#00ffff',
    SPEED: 720,           // px/s
    RADIUS: 6,
    TRAIL_LENGTH: 4
  },
  SPREAD: {
    NAME: 'SPREAD SHOT',
    COOLDOWN: 18,
    RAPID_COOLDOWN: 6,
    DAMAGE: 9,            // damage per bolt
    COLOR: '#ff8800',
    GLOW: '#ff5500',
    SPEED: 650,           // px/s
    RADIUS: 5,
    SPREAD_ANGLE: 14 * Math.PI / 180, // 14 degrees in rad
    COUNT: 3
  },
  LASER: {
    NAME: 'LASER BEAM',
    DAMAGE: 2.5,          // damage per tick (each update frame, approx 60/sec)
    RANGE: 650,           // px max range
    COLOR_CORE: '#ffffff',
    COLOR_GLOW: '#00ffff',
    GLOW_WIDTH: 8,
    CORE_WIDTH: 2,
    OVERHEAT_LIMIT: 120,  // frames of continuous use
    COOL_DURATION: 90     // frames to cool down after overheating
  },
  MISSILE: {
    NAME: 'HOMING MISSILE',
    DAMAGE: 55,
    THRUST: 580,          // px/s^2 acceleration
    DRAG: 0.96,           // friction coefficient
    CAPACITY: 8,          // max missiles
    TRAIL_POINTS: 20,
    COLOR: '#be1eff',
    TRAIL_COLOR: '#00f3ff'
  }
};
