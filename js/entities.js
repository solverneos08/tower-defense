import { ENEMY_TYPES, TOWER_TYPES, tierStats, upgradeCost, SELL_REFUND } from './config.js';
import { cellCenter, isRightGoal, isLeftSpawn } from './map.js';
import { dist, nearestEnemyInRange } from './targeting.js';

let _eid = 0, _tid = 0, _did = 0;

export class Enemy {
  constructor(kind, hpScale = 1) {
    this.id = ++_eid;
    this.kind = kind;
    const spec = ENEMY_TYPES[kind];
    this.maxHp = spec.hp * hpScale;
    this.hp = this.maxHp;
    this.speed = spec.speed;
    this.reward = Math.floor(spec.reward * hpScale);
    this.color = spec.color;
    this.pathIndex = 0;
    this.pos = [0, 0];
    this.slowUntil = 0;
    this.slowMult = 1;
    this.radius = 12;
  }

  requestRepath(path) {
    if (!path.length) return;
    let bestI = 0, bestD = 1e9;
    for (let i = 0; i < path.length; i++) {
      const c = cellCenter(path[i][0], path[i][1]);
      const d = dist(this.pos, c);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    this.pathIndex = bestI;
  }

  update(dt, path, gameTime) {
    if (this.hp <= 0) return false;
    const slow = gameTime < this.slowUntil ? this.slowMult : 1;
    const spd = this.speed * slow;
    if (!path.length) return false;

    while (this.pathIndex < path.length) {
      const target = cellCenter(path[this.pathIndex][0], path[this.pathIndex][1]);
      const dx = target[0] - this.pos[0];
      const dy = target[1] - this.pos[1];
      const d = Math.hypot(dx, dy);
      if (d < 4) { this.pathIndex++; continue; }
      const step = spd * dt;
      if (step >= d) { this.pos = target; this.pathIndex++; }
      else { this.pos[0] += (dx / d) * step; this.pos[1] += (dy / d) * step; }
      break;
    }

    const col = Math.floor(this.pos[0] / 36);
    const row = Math.floor(this.pos[1] / 36);
    if (isRightGoal(col, row)) return true;
    if (this.pathIndex >= path.length) {
      const last = path[path.length - 1];
      if (last && isRightGoal(last[0], last[1])) return true;
    }
    return false;
  }

  applySlow(mult, duration, gameTime) {
    if (mult < this.slowMult || gameTime >= this.slowUntil) {
      this.slowMult = mult;
      this.slowUntil = gameTime + duration;
    }
  }

  applyDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }
}

export function makeEnemy(kind, waveIndex) {
  let scale = 1 + Math.max(0, waveIndex - 1) * 0.12;
  if (waveIndex > 10) scale = 1 + 9 * 0.12 + (waveIndex - 10) * 0.15;
  return new Enemy(kind, scale);
}

export class Tower {
  constructor(towerId, col, row, cost) {
    this.id = ++_tid;
    this.towerId = towerId;
    this.col = col;
    this.row = row;
    this.tier = 1;
    this.invested = cost;
    this.cooldown = 0;
    this.color = TOWER_TYPES[towerId].color;
    this.magazine = 0;
    this.reloadTimer = 0;
    this.pulseTimer = 0;
    this.spawnTimer = 0;
    this.heli = null;
    this.patrolCenter = null;
    this.patrolRadius = 80;
    this.patrolReady = false;
    this._initType();
  }

  _initType() {
    const s = this.stats;
    if (this.towerId === 7) this.magazine = s.magazine ?? 5;
    if (this.towerId === 6) this.pulseTimer = (s.pulse_interval ?? 2) * 0.5;
    if (this.towerId === 8) this.spawnTimer = (s.spawn_interval ?? 4) * 0.5;
  }

  get name() { return TOWER_TYPES[this.towerId].name; }
  get pos() { return cellCenter(this.col, this.row); }
  get stats() { return tierStats(this.towerId, this.tier); }

  getUpgradeCost() {
    if (this.tier >= 3) return 0;
    return upgradeCost(this.towerId, this.tier);
  }

  canUpgrade() { return this.tier < 3; }

  upgrade() {
    const cost = this.getUpgradeCost();
    this.tier++;
    this.invested += cost;
    this._initType();
    return cost;
  }

  sellValue() { return Math.floor(this.invested * SELL_REFUND); }

  effectiveFireInterval(buffMult) {
    const s = this.stats;
    if ([5, 6, 8, 9].includes(this.towerId)) return 999;
    if (this.towerId === 7) return s.reload_per ?? 2;
    let interval = s.fire_interval ?? 1;
    if (buffMult > 0) interval /= 1 + buffMult;
    return Math.max(0.05, interval);
  }

  displayRange() {
    const s = this.stats;
    if (this.towerId === 5) return s.aura ?? 100;
    if (this.towerId === 6) return s.max_radius ?? 95;
    if (this.towerId === 9 && this.patrolCenter) return this.patrolRadius;
    return s.range ?? 100;
  }
}

export class Drone {
  constructor(path, speed, damage, boomRadius) {
    this.id = ++_did;
    this.path = path;
    this.pathIndex = 0;
    this.speed = speed;
    this.damage = damage;
    this.boomRadius = boomRadius;
    this.pos = path.length ? cellCenter(path[0][0], path[0][1]) : [0, 0];
    this.radius = 10;
    this.dead = false;
  }

  update(dt, enemies) {
    if (this.dead || !this.path.length) return null;
    while (this.pathIndex < this.path.length) {
      const target = cellCenter(this.path[this.pathIndex][0], this.path[this.pathIndex][1]);
      const dx = target[0] - this.pos[0];
      const dy = target[1] - this.pos[1];
      const d = Math.hypot(dx, dy);
      if (d < 4) { this.pathIndex++; continue; }
      const step = this.speed * dt;
      if (step >= d) { this.pos = [...target]; this.pathIndex++; }
      else { this.pos[0] += (dx / d) * step; this.pos[1] += (dy / d) * step; }
      break;
    }
    const col = Math.floor(this.pos[0] / 36);
    const row = Math.floor(this.pos[1] / 36);
    if (isLeftSpawn(col, row)) { this.dead = true; return { x: this.pos[0], y: this.pos[1], r: this.boomRadius, dmg: this.damage }; }
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = dist(this.pos, e.pos);
      if (d < this.radius + e.radius) {
        this.dead = true;
        return { x: this.pos[0], y: this.pos[1], r: this.boomRadius, dmg: this.damage };
      }
    }
    if (this.pathIndex >= this.path.length) {
      this.dead = true;
      return { x: this.pos[0], y: this.pos[1], r: this.boomRadius, dmg: this.damage };
    }
    return null;
  }
}

export class Helicopter {
  constructor(padPos, patrolCenter, patrolRadius, stats) {
    this.padPos = padPos;
    this.patrolCenter = patrolCenter;
    this.patrolRadius = patrolRadius;
    this.stats = stats;
    this.state = 'patrol';
    this.pos = [...padPos];
    this.angle = 0;
    this.magazine = stats.magazine ?? 5;
    this.cooldown = 0;
    this.reloadTimer = 0;
  }

  update(dt, enemies) {
    const events = [];
    const s = this.stats;
    if (this.state === 'reloading') {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.magazine = s.magazine ?? 5;
        this.state = 'patrol';
      }
      return events;
    }
    if (this.state === 'returning') {
      const dx = this.padPos[0] - this.pos[0];
      const dy = this.padPos[1] - this.pos[1];
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        this.state = 'reloading';
        this.reloadTimer = s.reload_time ?? 2;
        this.pos = [...this.padPos];
      } else {
        const spd = 120 * dt;
        this.pos[0] += (dx / d) * spd;
        this.pos[1] += (dy / d) * spd;
      }
      return events;
    }
    this.angle += (s.patrol_speed ?? 1.8) * dt;
    this.pos[0] = this.patrolCenter[0] + Math.cos(this.angle) * this.patrolRadius;
    this.pos[1] = this.patrolCenter[1] + Math.sin(this.angle) * this.patrolRadius;
    if (this.magazine <= 0) { this.state = 'returning'; return events; }
    this.cooldown -= dt;
    if (this.cooldown > 0) return events;
    const target = nearestEnemyInRange(this.pos, enemies, this.patrolRadius + 20);
    if (target) {
      this.magazine--;
      this.cooldown = s.fire_interval ?? 0.5;
      events.push({ x: target.pos[0], y: target.pos[1], splash: s.missile_splash ?? 60, dmg: s.missile_damage ?? 50 });
      if (this.magazine <= 0) this.state = 'returning';
    }
    return events;
  }
}

export function setupHeli(tower, center, radius) {
  tower.patrolCenter = center;
  tower.patrolRadius = Math.max(40, Math.min(radius, 160));
  tower.patrolReady = true;
  tower.heli = new Helicopter(tower.pos, center, tower.patrolRadius, tower.stats);
}
