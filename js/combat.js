import { findPathReverse } from './pathfinder.js';
import { chainTargets, enemiesInRadius, nearestEnemyInRange } from './targeting.js';
import { Drone, setupHeli } from './entities.js';
import { spawnExplosion } from './sprites.js';

export function applySupportBuffs(state) {
  const buffs = {};
  for (const t of state.towers) {
    if (t.towerId !== 5) continue;
    const s = t.stats;
    for (const other of state.towers) {
      if (other === t || other.towerId === 5) continue;
      const d = Math.hypot(t.pos[0] - other.pos[0], t.pos[1] - other.pos[1]);
      if (d <= (s.aura ?? 100)) {
        buffs[other.id] = Math.min(0.4, (buffs[other.id] ?? 0) + (s.buff_pct ?? 0.2));
      }
    }
  }
  state.fireRateBuffs = buffs;
}

export function damageSplash(state, x, y, splash, damage, enemies, gameTime, slow = null) {
  const variant = slow ? 'ice' : splash >= 50 ? 'kamikaze' : 'fire';
  spawnExplosion(state, x, y, splash, variant);
  for (const e of enemiesInRadius([x, y], enemies, splash)) {
    e.applyDamage(damage);
    if (slow) e.applySlow(slow[0], slow[1], gameTime);
  }
}

export function updateCombat(state, dt, gameTime) {
  applySupportBuffs(state);

  for (const t of state.towers) {
    const buff = state.fireRateBuffs[t.id] ?? 0;
    t.cooldown -= dt;
    const s = t.stats;
    const pos = t.pos;

    if (t.towerId === 5) continue;

    if (t.towerId === 6) {
      t.pulseTimer -= dt;
      if (t.pulseTimer <= 0) {
        state.effects.push({
          type: 'shock', x: pos[0], y: pos[1], radius: 8, maxRadius: s.max_radius,
          damage: s.damage, speed: s.max_radius / 0.5, hit: new Set(), dead: false,
        });
        t.pulseTimer = s.pulse_interval;
      }
      continue;
    }

    if (t.towerId === 8) {
      t.spawnTimer -= dt;
      if (t.spawnTimer <= 0) {
        const path = findPathReverse(state.towerCells);
        if (path.length) {
          state.drones.push(new Drone(path, s.drone_speed, s.drone_damage, s.boom_radius));
        }
        t.spawnTimer = s.spawn_interval;
      }
      continue;
    }

    if (t.towerId === 9) {
      if (t.heli && t.patrolReady) {
        const events = t.heli.update(dt, state.enemies);
        for (const ev of events) {
          damageSplash(state, ev.x, ev.y, ev.splash, ev.dmg, state.enemies, gameTime);
        }
      }
      continue;
    }

    if (t.cooldown > 0) continue;

    if (t.towerId === 7) {
      const maxMag = s.magazine ?? 5;
      if (t.magazine <= 0) {
        t.reloadTimer -= dt;
        if (t.reloadTimer <= 0) {
          t.magazine++;
          t.reloadTimer = s.reload_per ?? 2;
          if (t.magazine >= maxMag) { t.magazine = maxMag; t.reloadTimer = 0; }
        }
        continue;
      }
      const target = nearestEnemyInRange(pos, state.enemies, s.range ?? 200);
      if (target) {
        state.projectiles.push({
          pos: [...pos], target, speed: 280, damage: s.damage, splash: 0, homing: true, dead: false, kind: 'homing',
        });
        t.magazine--;
        if (t.magazine <= 0) t.reloadTimer = s.reload_per ?? 2;
        t.cooldown = 0.2;
      }
      continue;
    }

    const target = nearestEnemyInRange(pos, state.enemies, s.range ?? 100);
    if (!target) continue;
    const interval = t.effectiveFireInterval(buff);

    if (t.towerId === 1) {
      target.applyDamage(s.damage);
      t.cooldown = interval;
    } else if (t.towerId === 2) {
      state.projectiles.push({
        pos: [...pos], target, speed: 200, damage: s.damage, splash: s.splash ?? 55, homing: false, dead: false, kind: 'missile',
      });
      t.cooldown = interval;
    } else if (t.towerId === 3) {
      state.projectiles.push({
        pos: [...pos], target, speed: 180, damage: s.damage ?? 4, splash: s.splash ?? 50,
        slow: [s.slow ?? 0.5, s.slow_dur ?? 2], homing: false, dead: false, kind: 'slow',
      });
      t.cooldown = interval;
    } else if (t.towerId === 4) {
      const chain = chainTargets(target, state.enemies, s.chain_radius ?? 70, s.chains ?? 3);
      let dmg = s.damage;
      const pts = [pos];
      for (const e of chain) {
        e.applyDamage(dmg);
        pts.push(e.pos);
        dmg *= s.falloff ?? 0.7;
      }
      state.effects.push({ type: 'lightning', points: pts, timer: 0.15, dead: false });
      spawnExplosion(state, target.pos[0], target.pos[1], 30, 'electric');
      t.cooldown = interval;
    }
  }

  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    if (!p.target || p.target.hp <= 0) { state.projectiles.splice(i, 1); continue; }
    const tx = p.target.pos[0], ty = p.target.pos[1];
    const dx = tx - p.pos[0], dy = ty - p.pos[1];
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      if (p.splash) damageSplash(state, p.pos[0], p.pos[1], p.splash, p.damage, state.enemies, gameTime, p.slow ?? null);
      else {
        if (p.target.hp > 0) p.target.applyDamage(p.damage);
        spawnExplosion(state, p.pos[0], p.pos[1], 18, p.kind === 'homing' ? 'fire' : 'fire');
      }
      state.projectiles.splice(i, 1);
      continue;
    }
    const step = p.speed * dt;
    p.pos[0] += (dx / d) * Math.min(step, d);
    p.pos[1] += (dy / d) * Math.min(step, d);
  }

  for (let i = state.effects.length - 1; i >= 0; i--) {
    const eff = state.effects[i];
    if (eff.type === 'shock') {
      eff.radius += eff.speed * dt;
      for (const e of state.enemies) {
        if (e.hp <= 0 || eff.hit.has(e.id)) continue;
        const d = Math.hypot(e.pos[0] - eff.x, e.pos[1] - eff.y);
        if (Math.abs(d - eff.radius) < 14) {
          e.applyDamage(eff.damage);
          eff.hit.add(e.id);
        }
      }
      if (eff.radius >= eff.maxRadius) eff.dead = true;
    } else if (eff.type === 'lightning') {
      eff.timer -= dt;
      if (eff.timer <= 0) eff.dead = true;
    } else if (eff.type === 'explosion') {
      eff.timer += dt;
      eff.radius = 6 + (eff.maxRadius - 6) * Math.min(1, eff.timer / eff.duration);
      if (eff.timer >= eff.duration) eff.dead = true;
    }
    if (eff.dead) state.effects.splice(i, 1);
  }

  for (let i = state.drones.length - 1; i >= 0; i--) {
    const hit = state.drones[i].update(dt, state.enemies);
    if (hit) {
      damageSplash(state, hit.x, hit.y, hit.r, hit.dmg, state.enemies, gameTime);
      state.drones.splice(i, 1);
    }
  }
}

export { setupHeli };
