import { START_GOLD, START_LIVES } from './config.js';
import { findPath } from './pathfinder.js';

export const Phase = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  HELI_SETUP: 'heli_setup',
};

export class GameState {
  constructor() {
    this.phase = Phase.PLAYING;
    this.gold = 0;
    this.lives = 0;
    this.waveIndex = 0;
    this.waveActive = false;
    this.waveReady = true;

    this.towers = [];
    this.enemies = [];
    this.drones = [];
    this.projectiles = [];
    this.effects = [];

    this.globalPath = [];
    this.towerCells = new Set();

    this.shopSelection = null;
    this.placedSelection = null;
    this.hoverTower = null;
    this.hoverCell = null;

    this.heliSetupTower = null;
    this.fireRateBuffs = {};
  }

  resetRun() {
    this.phase = Phase.PLAYING;
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.waveIndex = 0;
    this.waveActive = false;
    this.waveReady = true;
    this.towers = [];
    this.enemies = [];
    this.drones = [];
    this.projectiles = [];
    this.effects = [];
    this.towerCells = new Set();
    this.globalPath = [];
    this.shopSelection = null;
    this.placedSelection = null;
    this.hoverTower = null;
    this.heliSetupTower = null;
    this.fireRateBuffs = {};
    this.recomputePath();
  }

  recomputePath() {
    this.globalPath = findPath(this.towerCells);
  }

  towerAt(col, row) {
    return this.towers.find(t => t.col === col && t.row === row) ?? null;
  }
}
