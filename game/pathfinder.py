"""A* pathfinding from left spawn zone to right goal zone."""

from __future__ import annotations

import heapq

from game.map_data import is_wall, left_spawn_cells, right_goal_cells


def _neighbors(c: int, r: int):
    for dc, dr in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        yield c + dc, r + dr


def _walkable(col: int, row: int, blocked: set[tuple[int, int]]) -> bool:
    from game.config import GRID_H, GRID_W

    if not (0 <= col < GRID_W and 0 <= row < GRID_H):
        return False
    if is_wall(col, row):
        return False
    if (col, row) in blocked:
        return False
    return True


def find_path(blocked: set[tuple[int, int]]) -> list[tuple[int, int]]:
    """Shortest path from any left spawn cell to any right goal cell."""
    from game.config import GRID_H, GRID_W

    starts = [s for s in left_spawn_cells() if _walkable(s[0], s[1], blocked)]
    goals = {g for g in right_goal_cells() if _walkable(g[0], g[1], blocked)}
    if not starts or not goals:
        return []

    best_path: list[tuple[int, int]] = []
    for start in starts:
        path = _astar(start, goals, blocked, GRID_W, GRID_H)
        if path and (not best_path or len(path) < len(best_path)):
            best_path = path
    return best_path


def _astar(
    start: tuple[int, int],
    goals: set[tuple[int, int]],
    blocked: set[tuple[int, int]],
    gw: int,
    gh: int,
) -> list[tuple[int, int]]:
    def h(c, r):
        # distance to nearest goal column
        return min(abs(c - g[0]) + abs(r - g[1]) for g in goals)

    open_heap: list[tuple[int, int, tuple[int, int]]] = []
    heapq.heappush(open_heap, (h(*start), 0, start))
    came_from: dict[tuple[int, int], tuple[int, int] | None] = {start: None}
    g_score = {start: 0}

    while open_heap:
        _, g, current = heapq.heappop(open_heap)
        if current in goals:
            path = []
            node = current
            while node is not None:
                path.append(node)
                node = came_from[node]
            path.reverse()
            return path

        if g > g_score.get(current, float("inf")) + 200:
            continue

        for nc, nr in _neighbors(*current):
            if not _walkable(nc, nr, blocked):
                continue
            ng = g + 1
            if ng < g_score.get((nc, nr), float("inf")):
                g_score[(nc, nr)] = ng
                came_from[(nc, nr)] = current
                heapq.heappush(open_heap, (ng + h(nc, nr), ng, (nc, nr)))
    return []


def find_path_reverse(blocked: set[tuple[int, int]]) -> list[tuple[int, int]]:
    """Path from right goal zone to left spawn (for drones)."""
    from game.config import GRID_H, GRID_W

    starts = [s for s in right_goal_cells() if _walkable(s[0], s[1], blocked)]
    goals = {g for g in left_spawn_cells() if _walkable(g[0], g[1], blocked)}
    if not starts or not goals:
        return []

    best_path: list[tuple[int, int]] = []
    for start in starts:
        path = _astar(start, goals, blocked, GRID_W, GRID_H)
        if path and (not best_path or len(path) < len(best_path)):
            best_path = path
    return best_path


def path_exists_with_tower_at(
    col: int, row: int, tower_cells: set[tuple[int, int]]
) -> bool:
    blocked = set(tower_cells)
    blocked.add((col, row))
    return len(find_path(blocked)) > 0
