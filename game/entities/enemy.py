"""Enemy units following dynamic A* path."""

import random

from game.config import ENEMY_TYPES
from game.map_data import cell_center, is_in_right_goal


class Enemy:
    _id = 0

    def __init__(self, kind: str, hp_scale: float = 1.0):
        Enemy._id += 1
        self.uid = Enemy._id
        spec = ENEMY_TYPES[kind]
        self.kind = kind
        self.max_hp = spec["hp"] * hp_scale
        self.hp = self.max_hp
        self.speed = spec["speed"]
        self.reward = int(spec["reward"] * hp_scale)
        self.color = spec["color"]
        self.path_index = 0
        self.pos = (0.0, 0.0)
        self.slow_until = 0.0
        self.slow_mult = 1.0
        self.radius = 12

    def spawn_on_path(self, path: list[tuple[int, int]], game_time: float):
        if not path:
            return
        cell = path[0]
        self.pos = cell_center(cell[0], cell[1])
        self.path_index = 0

    def request_repath(self, path: list[tuple[int, int]]):
        if not path:
            return
        best_i = 0
        best_d = 1e9
        from game.targeting import dist

        for i, cell in enumerate(path):
            c = cell_center(cell[0], cell[1])
            d = dist(self.pos, c)
            if d < best_d:
                best_d = d
                best_i = i
        self.path_index = best_i

    def update(self, dt: float, path: list[tuple[int, int]], game_time: float) -> bool:
        """Returns True if enemy leaked."""
        from game.map_data import pos_to_cell

        if self.hp <= 0:
            return False

        slow = self.slow_mult if game_time < self.slow_until else 1.0
        spd = self.speed * slow

        if not path:
            return False

        while self.path_index < len(path):
            target = cell_center(path[self.path_index][0], path[self.path_index][1])
            dx = target[0] - self.pos[0]
            dy = target[1] - self.pos[1]
            d = (dx * dx + dy * dy) ** 0.5
            if d < 4:
                self.path_index += 1
                continue
            step = spd * dt
            if step >= d:
                self.pos = target
                self.path_index += 1
            else:
                self.pos = (self.pos[0] + dx / d * step, self.pos[1] + dy / d * step)
            break

        cell = pos_to_cell(self.pos[0], self.pos[1])
        if cell and is_in_right_goal(cell[0], cell[1]):
            return True
        if self.path_index >= len(path):
            cell = path[-1] if path else None
            if cell and is_in_right_goal(cell[0], cell[1]):
                return True
        return False

    def apply_slow(self, mult: float, duration: float, game_time: float):
        if mult < self.slow_mult or game_time >= self.slow_until:
            self.slow_mult = mult
            self.slow_until = game_time + duration

    def apply_damage(self, amount: float) -> bool:
        self.hp -= amount
        return self.hp <= 0


def make_enemy_for_wave(kind: str, wave_index: int) -> Enemy:
    scale = 1.0 + max(0, wave_index - 1) * 0.12
    if wave_index > 10:
        scale = 1.0 + 9 * 0.12 + (wave_index - 10) * 0.15
    return Enemy(kind, scale)
