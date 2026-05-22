"""Game session state."""

from __future__ import annotations

from enum import Enum, auto


class GamePhase(Enum):
    MENU = auto()
    PLAYING = auto()
    PAUSED = auto()
    GAME_OVER = auto()
    HELI_SETUP = auto()


class GameState:
    def __init__(self):
        self.phase = GamePhase.MENU
        self.gold = 0
        self.lives = 0
        self.wave_index = 0
        self.wave_active = False
        self.wave_ready = True

        self.towers: list = []
        self.enemies: list = []
        self.drones: list = []
        self.projectiles: list = []
        self.effects: list = []

        self.global_path: list[tuple[int, int]] = []
        self.tower_cells: set[tuple[int, int]] = set()

        self.shop_selection: int | None = None
        self.placed_selection = None
        self.hover_tower = None
        self.hover_cell: tuple[int, int] | None = None

        self.heli_setup_tower = None
        self.heli_patrol_center: tuple[float, float] | None = None
        self.heli_patrol_radius = 80.0

        self.fire_rate_buffs: dict = {}
        self.muted = False

    def reset_run(self):
        from game.config import START_GOLD, START_LIVES

        self.phase = GamePhase.PLAYING
        self.gold = START_GOLD
        self.lives = START_LIVES
        self.wave_index = 0
        self.wave_active = False
        self.wave_ready = True
        self.towers.clear()
        self.enemies.clear()
        self.drones.clear()
        self.projectiles.clear()
        self.effects.clear()
        self.tower_cells.clear()
        self.global_path.clear()
        self.shop_selection = None
        self.placed_selection = None
        self.hover_tower = None
        self.heli_setup_tower = None
        self.heli_patrol_center = None
        self.fire_rate_buffs.clear()
        self.recompute_path()

    def recompute_path(self):
        from game.pathfinder import find_path

        self.global_path = find_path(self.tower_cells)

    def tower_at(self, col: int, row: int):
        for t in self.towers:
            if t.col == col and t.row == row:
                return t
        return None
