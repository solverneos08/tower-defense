"""Target selection helpers."""

import math


def dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def nearest_enemy_in_range(
    pos: tuple[float, float], enemies: list, range_px: float
):
    best = None
    best_d = range_px + 1
    for e in enemies:
        if e.hp <= 0:
            continue
        d = dist(pos, e.pos)
        if d <= range_px and d < best_d:
            best_d = d
            best = e
    return best


def enemies_in_radius(pos: tuple[float, float], enemies: list, radius: float) -> list:
    out = []
    for e in enemies:
        if e.hp <= 0:
            continue
        if dist(pos, e.pos) <= radius:
            out.append(e)
    return out


def chain_targets(
    first, enemies: list, chain_radius: float, max_chains: int
) -> list:
    result = [first]
    used = {id(first)}
    current = first
    for _ in range(max_chains - 1):
        best = None
        best_d = chain_radius + 1
        for e in enemies:
            if e.hp <= 0 or id(e) in used:
                continue
            d = dist(current.pos, e.pos)
            if d <= chain_radius and d < best_d:
                best_d = d
                best = e
        if best is None:
            break
        result.append(best)
        used.add(id(best))
        current = best
    return result
