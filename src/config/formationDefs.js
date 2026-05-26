'use strict';

import { ENEMY_TYPES } from './enemyDefs.js';

/**
 * NOVA STRIKE Enemy Formation Definitions
 * Spawns from Level 3+
 */
export const FORMATION_DEFS = [
  {
    name: 'V_FORMATION',
    type: 'V',
    minLevel: 3,
    enemyType: ENEMY_TYPES.SCOUT,
    members: [
      { xOffset: 0, yOffset: -50, isLeader: true },
      { xOffset: -60, yOffset: -100, isLeader: false },
      { xOffset: 60, yOffset: -100, isLeader: false },
      { xOffset: -120, yOffset: -150, isLeader: false },
      { xOffset: 120, yOffset: -150, isLeader: false }
    ]
  },
  {
    name: 'PINCER',
    type: 'PINCER',
    minLevel: 3,
    enemyType: ENEMY_TYPES.FIGHTER,
    members: [
      { xOffset: -200, yOffset: -80, isLeader: true, spawnSide: 'left' },
      { xOffset: 200, yOffset: -80, isLeader: false, spawnSide: 'right' }
    ]
  },
  {
    name: 'WALL',
    type: 'WALL',
    minLevel: 4,
    enemyType: ENEMY_TYPES.BOMBER,
    members: [
      { xOffset: -150, yOffset: -100, isLeader: true },
      { xOffset: -50, yOffset: -100, isLeader: false },
      { xOffset: 50, yOffset: -100, isLeader: false },
      { xOffset: 150, yOffset: -100, isLeader: false }
    ]
  },
  {
    name: 'SWARM',
    type: 'SWARM',
    minLevel: 3,
    enemyType: ENEMY_TYPES.SCOUT,
    members: [
      { xOffset: 0, yOffset: -100, isLeader: true },
      { xOffset: -30, yOffset: -70, isLeader: false },
      { xOffset: 30, yOffset: -70, isLeader: false },
      { xOffset: -30, yOffset: -130, isLeader: false },
      { xOffset: 30, yOffset: -130, isLeader: false },
      { xOffset: -60, yOffset: -100, isLeader: false },
      { xOffset: 60, yOffset: -100, isLeader: false },
      { xOffset: 0, yOffset: -160, isLeader: false }
    ]
  },
  {
    name: 'ESCORT',
    type: 'ESCORT',
    minLevel: 5,
    members: [
      { xOffset: 0, yOffset: -120, enemyType: ENEMY_TYPES.DREADNOUGHT, isLeader: true },
      { xOffset: -80, yOffset: -80, enemyType: ENEMY_TYPES.FIGHTER, isLeader: false },
      { xOffset: 80, yOffset: -80, enemyType: ENEMY_TYPES.FIGHTER, isLeader: false }
    ]
  }
];
