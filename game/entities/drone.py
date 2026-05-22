"""Kamikaze drone — paths right goal to left spawn."""

from game.map_data import cell_center, is_in_left_spawn, pos_to_cell


class Drone:
    _id = 0

    def __init__(self, path: list, speed: float, hp: float, damage: float, boom_radius: float):
        Drone._id += 1
        self.uid = Drone._id
        self.path = path
        self.path_index = 0
        self.speed = speed
        self.hp = hp
        self.damage = damage
        self.boom_radius = boom_radius
        self.pos = (0.0, 0.0)
        if path:
            self.pos = cell_center(path[0][0], path[0][1])
        self.radius = 10
        self.dead = False

    def update(self, dt: float, enemies: list) -> tuple[bool, float, float, float]:
        """Returns (exploded, x, y, radius)."""
        if self.dead or not self.path:
            return False, 0, 0, 0

        while self.path_index < len(self.path):
            target = cell_center(self.path[self.path_index][0], self.path[self.path_index][1])
            dx = target[0] - self.pos[0]
            dy = target[1] - self.pos[1]
            d = (dx * dx + dy * dy) ** 0.5
            if d < 4:
                self.path_index += 1
                continue
            step = self.speed * dt
            if step >= d:
                self.pos = target
                self.path_index += 1
            else:
                self.pos = (self.pos[0] + dx / d * step, self.pos[1] + dy / d * step)
            break

        cell = pos_to_cell(self.pos[0], self.pos[1])
        if cell and is_in_left_spawn(cell[0], cell[1]):
            self.dead = True
            return True, self.pos[0], self.pos[1], self.boom_radius

        for e in enemies:
            if e.hp <= 0:
                continue
            d = ((e.pos[0] - self.pos[0]) ** 2 + (e.pos[1] - self.pos[1]) ** 2) ** 0.5
            if d < self.radius + e.radius:
                self.dead = True
                return True, self.pos[0], self.pos[1], self.boom_radius

        if self.path_index >= len(self.path):
            self.dead = True
            return True, self.pos[0], self.pos[1], self.boom_radius
        return False, 0, 0, 0
