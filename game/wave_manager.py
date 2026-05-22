"""Wave spawning."""

import random

from game.config import WAVES
from game.entities.enemy import make_enemy_for_wave
from game.map_data import left_spawn_cells


class WaveManager:
    def __init__(self):
        self.queue: list[tuple[str, float]] = []
        self.spawn_timer = 0.0

    def start_wave(self, wave_index: int):
        self.queue.clear()
        idx = min(wave_index - 1, len(WAVES) - 1)
        spec = WAVES[idx]
        interval = spec.get("interval", 0.6)
        t = 0.0
        for kind, count in spec.items():
            if kind == "interval":
                continue
            for _ in range(count):
                self.queue.append((kind, t))
                t += interval
        if wave_index > len(WAVES):
            extra = wave_index - len(WAVES)
            for _ in range(8 + extra * 2):
                k = random.choice(["grunt", "runner", "brute"])
                self.queue.append((k, t))
                t += max(0.3, interval - extra * 0.02)
        self.queue.sort(key=lambda x: x[1])
        self.spawn_timer = 0.0

    def update(self, dt: float, state, game_time: float) -> bool:
        """Spawn enemies. Returns True when wave spawn queue is done and no enemies left."""
        if not state.wave_active:
            return False

        while self.queue and self.queue[0][1] <= self.spawn_timer:
            kind, _ = self.queue.pop(0)
            enemy = make_enemy_for_wave(kind, state.wave_index)
            path = state.global_path
            if path:
                spawn = random.choice(left_spawn_cells())
                from game.map_data import cell_center

                enemy.pos = cell_center(spawn[0], spawn[1])
                enemy.path_index = 0
                for i, c in enumerate(path):
                    if c == spawn:
                        enemy.path_index = i
                        break
            state.enemies.append(enemy)

        self.spawn_timer += dt

        if not self.queue and not state.enemies:
            state.wave_active = False
            state.wave_ready = True
            return True
        return False
