"""Placed tower entity."""

from __future__ import annotations

from game.config import TOWER_TYPES, tier_stats, upgrade_cost
from game.map_data import cell_center


class Tower:
    _id = 0

    def __init__(self, tower_id: int, col: int, row: int, cost: int):
        Tower._id += 1
        self.uid = Tower._id
        self.tower_id = tower_id
        self.col = col
        self.row = row
        self.tier = 1
        self.invested = cost
        self.cooldown = 0.0
        self.color = TOWER_TYPES[tower_id]["color"]

        # Type-specific runtime state
        self.magazine = 0
        self.reload_timer = 0.0
        self.pulse_timer = 0.0
        self.spawn_timer = 0.0
        self.heli = None
        self.patrol_center: tuple[float, float] | None = None
        self.patrol_radius = 80.0
        self.patrol_ready = False

        self._init_type_state()

    def _init_type_state(self):
        s = self.stats
        if self.tower_id == 7:
            self.magazine = s.get("magazine", 5)
        if self.tower_id == 6:
            self.pulse_timer = s.get("pulse_interval", 2.0) * 0.5
        if self.tower_id == 8:
            self.spawn_timer = s.get("spawn_interval", 4.0) * 0.5

    @property
    def name(self) -> str:
        return TOWER_TYPES[self.tower_id]["name"]

    @property
    def pos(self) -> tuple[float, float]:
        return cell_center(self.col, self.row)

    @property
    def stats(self) -> dict:
        return tier_stats(self.tower_id, self.tier)

    def upgrade_cost(self) -> int:
        if self.tier >= 3:
            return 0
        return upgrade_cost(self.tower_id, self.tier)

    def can_upgrade(self) -> bool:
        return self.tier < 3

    def upgrade(self) -> int:
        cost = self.upgrade_cost()
        self.tier += 1
        self.invested += cost
        self._init_type_state()
        return cost

    def sell_value(self) -> int:
        from game.config import SELL_REFUND

        return int(self.invested * SELL_REFUND)

    def effective_fire_interval(self, buff_mult: float) -> float:
        s = self.stats
        if self.tower_id in (5, 6, 8, 9):
            return 999.0
        if self.tower_id == 7:
            return s.get("reload_per", 2.0)
        interval = s.get("fire_interval", 1.0)
        if buff_mult > 0:
            interval /= 1.0 + buff_mult
        return max(0.05, interval)

    def display_range(self) -> float:
        s = self.stats
        if self.tower_id == 5:
            return s.get("aura", 100)
        if self.tower_id == 6:
            return s.get("max_radius", 95)
        if self.tower_id == 9 and self.patrol_center:
            return self.patrol_radius
        return s.get("range", 100)
