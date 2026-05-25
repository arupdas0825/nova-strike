'use strict';

/**
 * NOVA STRIKE Enemy Typings and Characteristics
 */
export const ENEMY_TYPES = {
  SCOUT: 'scout',
  FIGHTER: 'fighter',
  BOMBER: 'bomber',
  BOSS: 'boss'
};

export const ENEMY_DEFS = {
  [ENEMY_TYPES.SCOUT]: {
    hp: 22,
    speed: 3.2,
    radius: 10,
    damage: 5,
    fireRate: 80, // frames between shots
    points: 10,
    color: '#ff0055',
    behavior: 'zigzag'
  },
  [ENEMY_TYPES.FIGHTER]: {
    hp: 48,
    speed: 2.0,
    radius: 14,
    damage: 10,
    fireRate: 55,
    points: 25,
    color: '#ff5500',
    behavior: 'direct'
  },
  [ENEMY_TYPES.BOMBER]: {
    hp: 95,
    speed: 1.3,
    radius: 18,
    damage: 20,
    fireRate: 38,
    points: 50,
    color: '#a800ff',
    behavior: 'slow_arc'
  },
  [ENEMY_TYPES.BOSS]: {
    hp: 260,
    speed: 0.9,
    radius: 38,
    damage: 30,
    fireRate: 28,
    points: 200,
    color: '#ffaa00',
    behavior: 'spread_wobble'
  }
};
