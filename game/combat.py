"""Tower combat, projectiles, effects."""

import math

from game.config import tier_stats
from game.entities.drone import Drone
from game.entities.helicopter import Helicopter
from game.pathfinder import find_path_reverse
from game.targeting import chain_targets, dist, enemies_in_radius, nearest_enemy_in_range


class Projectile:
    def __init__(self, x, y, target, speed, damage, splash=0, slow=None, homing=False):
        self.pos = [x, y]
        self.target = target
        self.speed = speed
        self.damage = damage
        self.splash = splash
        self.slow = slow
        self.homing = homing
        self.dead = False

    def update(self, dt, enemies):
        if self.target and self.target.hp > 0:
            tx, ty = self.target.pos
        else:
            self.dead = True
            return None
        dx, dy = tx - self.pos[0], ty - self.pos[1]
        d = math.hypot(dx, dy)
        if d < 10:
            return (self.pos[0], self.pos[1], self.damage, self.splash, self.slow)
        step = self.speed * dt
        if self.homing or step < d:
            self.pos[0] += dx / d * min(step, d)
            self.pos[1] += dy / d * min(step, d)
        else:
            self.pos[0], self.pos[1] = tx, ty
            return (self.pos[0], self.pos[1], self.damage, self.splash, self.slow)
        return None


class ShockwaveEffect:
    def __init__(self, x, y, max_radius, damage, duration=0.5):
        self.x, self.y = x, y
        self.radius = 8.0
        self.max_radius = max_radius
        self.damage = damage
        self.speed = max_radius / duration
        self.hit_ids: set[int] = set()
        self.dead = False

    def update(self, dt, enemies):
        self.radius += self.speed * dt
        for e in enemies:
            if e.hp <= 0 or id(e) in self.hit_ids:
                continue
            d = dist((self.x, self.y), e.pos)
            if abs(d - self.radius) < 14:
                e.apply_damage(self.damage)
                self.hit_ids.add(id(e))
        if self.radius >= self.max_radius:
            self.dead = True


class LightningEffect:
    def __init__(self, points: list, duration=0.15):
        self.points = points
        self.timer = duration
        self.dead = False

    def update(self, dt, _):
        self.timer -= dt
        if self.timer <= 0:
            self.dead = True


def apply_support_buffs(state):
    from game.config import TOWER_TYPES

    buffs = {}
    for t in state.towers:
        if t.tower_id != 5:
            continue
        s = t.stats
        aura = s.get("aura", 100)
        pct = s.get("buff_pct", 0.2)
        for other in state.towers:
            if other is t or other.tower_id == 5:
                continue
            if dist(t.pos, other.pos) <= aura:
                buffs[other.uid] = min(0.4, buffs.get(other.uid, 0) + pct)
    state.fire_rate_buffs = buffs


def damage_splash(x, y, splash, damage, enemies, game_time, slow=None):
    killed = []
    for e in enemies_in_radius((x, y), enemies, splash):
        if e.apply_damage(damage):
            killed.append(e)
        if slow:
            e.apply_slow(slow[0], slow[1], game_time)
    return killed


def update_combat(state, dt: float, game_time: float, audio):
    apply_support_buffs(state)

    for t in state.towers:
        buff = state.fire_rate_buffs.get(t.uid, 0)
        t.cooldown -= dt

        if t.tower_id == 5:
            continue

        if t.tower_id == 6:
            t.pulse_timer -= dt
            if t.pulse_timer <= 0:
                s = t.stats
                state.effects.append(
                    ShockwaveEffect(t.pos[0], t.pos[1], s["max_radius"], s["damage"])
                )
                t.pulse_timer = s["pulse_interval"]
            continue

        if t.tower_id == 8:
            t.spawn_timer -= dt
            if t.spawn_timer <= 0:
                s = t.stats
                path = find_path_reverse(state.tower_cells)
                if path:
                    state.drones.append(
                        Drone(path, s["drone_speed"], s["drone_hp"], s["drone_damage"], s["boom_radius"])
                    )
                t.spawn_timer = s["spawn_interval"]
            continue

        if t.tower_id == 9:
            if t.heli and t.patrol_ready:
                events = t.heli.update(dt, state.enemies, state)
                for x, y, splash, dmg in events:
                    damage_splash(x, y, splash, dmg, state.enemies, game_time)
            continue

        if t.cooldown > 0:
            continue

        s = t.stats
        pos = t.pos

        if t.tower_id == 7:
            max_mag = s.get("magazine", 5)
            if t.magazine <= 0:
                t.reload_timer -= dt
                if t.reload_timer <= 0:
                    t.magazine += 1
                    t.reload_timer = s.get("reload_per", 2.0)
                    if t.magazine >= max_mag:
                        t.magazine = max_mag
                        t.reload_timer = 0
                continue
            target = nearest_enemy_in_range(pos, state.enemies, s.get("range", 200))
            if target:
                state.projectiles.append(
                    Projectile(pos[0], pos[1], target, 280, s["damage"], homing=True)
                )
                t.magazine -= 1
                if t.magazine <= 0:
                    t.reload_timer = s.get("reload_per", 2.0)
                t.cooldown = 0.2
            continue

        target = nearest_enemy_in_range(pos, state.enemies, s.get("range", 100))
        if not target:
            continue

        interval = t.effective_fire_interval(buff)

        if t.tower_id == 1:
            target.apply_damage(s["damage"])
            t.cooldown = interval
            if audio:
                audio.play("shoot")

        elif t.tower_id == 2:
            state.projectiles.append(
                Projectile(pos[0], pos[1], target, 200, s["damage"], s.get("splash", 55))
            )
            t.cooldown = interval

        elif t.tower_id == 3:
            state.projectiles.append(
                Projectile(
                    pos[0], pos[1], target, 180, s.get("damage", 4),
                    s.get("splash", 50), (s.get("slow", 0.5), s.get("slow_dur", 2.0))
                )
            )
            t.cooldown = interval

        elif t.tower_id == 4:
            chain = chain_targets(
                target, state.enemies, s.get("chain_radius", 70), s.get("chains", 3)
            )
            falloff = s.get("falloff", 0.7)
            dmg = s["damage"]
            pts = [pos]
            for i, e in enumerate(chain):
                e.apply_damage(dmg)
                pts.append(e.pos)
                dmg *= falloff
            state.effects.append(LightningEffect(pts))
            t.cooldown = interval

    # projectiles
    for p in state.projectiles[:]:
        hit = p.update(dt, state.enemies)
        if hit:
            x, y, dmg, splash, slow = hit
            if splash:
                damage_splash(x, y, splash, dmg, state.enemies, game_time, slow)
            elif p.target and p.target.hp > 0:
                p.target.apply_damage(dmg)
            elif p.target:
                pass
            p.dead = True
        if p.dead:
            state.projectiles.remove(p)

    for eff in state.effects[:]:
        eff.update(dt, state.enemies)
        if eff.dead:
            state.effects.remove(eff)

    for d in state.drones[:]:
        exploded, x, y, r = d.update(dt, state.enemies)
        if exploded:
            damage_splash(x, y, r, d.damage, state.enemies, game_time)
            state.drones.remove(d)


def setup_heli(tower, center, radius):
    tower.patrol_center = center
    tower.patrol_radius = max(40, min(radius, 160))
    tower.patrol_ready = True
    tower.heli = Helicopter(tower.pos, center, tower.patrol_radius, tower.stats)
