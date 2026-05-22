"""Helicopter for heli pad tower."""

import math

from game.targeting import dist, nearest_enemy_in_range


class Helicopter:
    STATES = ("patrol", "returning", "reloading")

    def __init__(self, pad_pos, patrol_center, patrol_radius, stats: dict):
        self.pad_pos = pad_pos
        self.patrol_center = patrol_center
        self.patrol_radius = patrol_radius
        self.stats = stats
        self.state = "patrol"
        self.pos = list(pad_pos)
        self.angle = 0.0
        self.magazine = stats.get("magazine", 5)
        self.cooldown = 0.0
        self.reload_timer = 0.0

    def update(self, dt: float, enemies: list, game) -> list:
        """Returns list of missile detonation events (x,y,splash,damage)."""
        events = []
        s = self.stats

        if self.state == "reloading":
            self.reload_timer -= dt
            if self.reload_timer <= 0:
                self.magazine = s.get("magazine", 5)
                self.state = "patrol"
            return events

        if self.state == "returning":
            dx = self.pad_pos[0] - self.pos[0]
            dy = self.pad_pos[1] - self.pos[1]
            d = math.hypot(dx, dy)
            spd = 120 * dt
            if d < 8:
                self.state = "reloading"
                self.reload_timer = s.get("reload_time", 2.0)
                self.pos = list(self.pad_pos)
            else:
                self.pos[0] += dx / d * spd
                self.pos[1] += dy / d * spd
            return events

        # patrol
        self.angle += s.get("patrol_speed", 1.8) * dt
        self.pos[0] = self.patrol_center[0] + math.cos(self.angle) * self.patrol_radius
        self.pos[1] = self.patrol_center[1] + math.sin(self.angle) * self.patrol_radius

        if self.magazine <= 0:
            self.state = "returning"
            return events

        self.cooldown -= dt
        if self.cooldown > 0:
            return events

        target = nearest_enemy_in_range(
            (self.pos[0], self.pos[1]), enemies, self.patrol_radius + 20
        )
        if target:
            self.magazine -= 1
            self.cooldown = s.get("fire_interval", 0.5)
            events.append(
                (
                    target.pos[0],
                    target.pos[1],
                    s.get("missile_splash", 60),
                    s.get("missile_damage", 50),
                )
            )
            if self.magazine <= 0:
                self.state = "returning"
        return events
