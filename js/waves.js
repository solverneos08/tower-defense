import { WAVES } from './config.js';
import { cellCenter, leftSpawnCenter } from './map.js';
import { makeEnemy } from './entities.js';

export class WaveManager {
  constructor() {
    this.queue = [];
    this.spawnTimer = 0;
  }

  startWave(waveIndex) {
    this.queue = [];
    const idx = Math.min(waveIndex - 1, WAVES.length - 1);
    const spec = { ...WAVES[idx] };
    const interval = spec.interval ?? 0.6;
    delete spec.interval;
    let t = 0;
    for (const [kind, count] of Object.entries(spec)) {
      for (let i = 0; i < count; i++) {
        this.queue.push({ kind, t });
        t += interval;
      }
    }
    if (waveIndex > WAVES.length) {
      const extra = waveIndex - WAVES.length;
      const kinds = ['grunt', 'runner', 'brute'];
      for (let i = 0; i < 8 + extra * 2; i++) {
        this.queue.push({ kind: kinds[i % 3], t });
        t += Math.max(0.3, interval - extra * 0.02);
      }
    }
    this.queue.sort((a, b) => a.t - b.t);
    this.spawnTimer = 0;
  }

  spawnEnemy(state, kind) {
    const enemy = makeEnemy(kind, state.waveIndex);
    const path = state.globalPath;
    if (!path.length) {
      console.warn('No path — recompute failed');
      return enemy;
    }
    const [sc, sr] = leftSpawnCenter();
    enemy.pos = cellCenter(sc, sr);
    enemy.pathIndex = 0;
    for (let i = 0; i < path.length; i++) {
      if (path[i][0] === sc && path[i][1] === sr) {
        enemy.pathIndex = i;
        break;
      }
    }
    return enemy;
  }

  update(dt, state) {
    if (!state.waveActive) return;

    if (!state.globalPath.length) state.recomputePath();

    while (this.queue.length && this.queue[0].t <= this.spawnTimer) {
      const { kind } = this.queue.shift();
      state.enemies.push(this.spawnEnemy(state, kind));
    }
    this.spawnTimer += dt;
    if (!this.queue.length && !state.enemies.length) {
      state.waveActive = false;
      state.waveReady = true;
    }
  }
}
