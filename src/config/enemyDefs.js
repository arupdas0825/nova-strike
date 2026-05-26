'use strict';

/**
 * NOVA STRIKE Enemy Types and Characteristics
 */
export const ENEMY_TYPES = {
  SCOUT: 'scout',
  FIGHTER: 'fighter',
  BOMBER: 'bomber',
  INTERCEPTOR: 'interceptor',
  DREADNOUGHT: 'dreadnought',
  BOSS: 'boss'
};

export const ENEMY_DEFS = {
  [ENEMY_TYPES.SCOUT]: {
    hp: 25,
    speed: 320,       // px/s (Verlet physics)
    radius: 11,
    damage: 6,
    fireRate: 75,     // frames between shots
    points: 10,
    color: '#ff00ff',
    behavior: 'zigzag'
  },
  [ENEMY_TYPES.FIGHTER]: {
    hp: 55,
    speed: 210,       // px/s
    radius: 15,
    damage: 12,
    fireRate: 50,
    points: 25,
    color: '#ff8800',
    behavior: 'direct'
  },
  [ENEMY_TYPES.BOMBER]: {
    hp: 110,
    speed: 130,      // px/s
    radius: 20,
    damage: 22,
    fireRate: 35,
    points: 55,
    color: '#ff2244',
    behavior: 'slow_arc'
  },
  [ENEMY_TYPES.INTERCEPTOR]: {
    hp: 38,
    speed: 420,      // px/s (extremely fast)
    radius: 9,
    damage: 8,
    fireRate: 90,
    points: 35,
    color: '#00ffaa',
    behavior: 'dash_retreat',
    minLevel: 5
  },
  [ENEMY_TYPES.DREADNOUGHT]: {
    hp: 180,
    speed: 75,       // px/s (slow powerhouse)
    radius: 30,
    damage: 28,
    fireRate: 22,
    points: 120,
    color: '#6600ff',
    behavior: 'dreadnought_sweep',
    minLevel: 8
  },
  [ENEMY_TYPES.BOSS]: {
    hp: 400,
    speed: 60,       // px/s
    radius: 44,
    points: 300,
    color: '#bb00ff',
    behavior: 'multiphase'
  }
};
