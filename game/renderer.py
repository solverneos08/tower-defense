"""Draw map, entities, hover overlays."""

import pygame

from game.config import (
    CELL_SIZE,
    COLOR_GRASS,
    COLOR_GRID,
    COLOR_HOVER,
    COLOR_INVALID,
    COLOR_NOBUILD,
    COLOR_PATH,
    COLOR_SELECT,
    COLOR_WALL,
    GRID_H,
    GRID_W,
    MAP_PIXEL_H,
    MAP_PIXEL_W,
    TOWER_TYPES,
    tier_stats,
)
from game.input import can_place
from game.map_data import is_nobuild, is_wall


def draw_map(surface, state):
    for row in range(GRID_H):
        for col in range(GRID_W):
            rect = pygame.Rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            if is_wall(col, row):
                pygame.draw.rect(surface, COLOR_WALL, rect)
            elif is_nobuild(col, row):
                pygame.draw.rect(surface, COLOR_NOBUILD, rect)
            else:
                pygame.draw.rect(surface, COLOR_GRASS, rect)
            pygame.draw.rect(surface, COLOR_GRID, rect, 1)

    for col, row in state.global_path:
        if not is_wall(col, row) and not is_nobuild(col, row):
            rect = pygame.Rect(col * CELL_SIZE + 4, row * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8)
            pygame.draw.rect(surface, COLOR_PATH, rect)


def draw_towers(surface, towers):
    for t in towers:
        cx = t.col * CELL_SIZE + CELL_SIZE // 2
        cy = t.row * CELL_SIZE + CELL_SIZE // 2
        pygame.draw.circle(surface, t.color, (cx, cy), 14)
        pygame.draw.circle(surface, (30, 30, 30), (cx, cy), 14, 2)
        font = pygame.font.SysFont(None, 18)
        label = font.render(str(t.tower_id), True, (20, 20, 20))
        surface.blit(label, (cx - 4, cy - 7))


def draw_enemies(surface, enemies):
    for e in enemies:
        if e.hp <= 0:
            continue
        pygame.draw.circle(surface, e.color, (int(e.pos[0]), int(e.pos[1])), int(e.radius))
        if e.hp < e.max_hp:
            w = 24
            ratio = max(0, e.hp / e.max_hp)
            pygame.draw.rect(surface, (40, 40, 40), (e.pos[0] - 12, e.pos[1] - 18, w, 4))
            pygame.draw.rect(surface, (80, 220, 80), (e.pos[0] - 12, e.pos[1] - 18, int(w * ratio), 4))


def draw_drones(surface, drones):
    for d in drones:
        pygame.draw.circle(surface, (160, 180, 220), (int(d.pos[0]), int(d.pos[1])), 8)


def draw_projectiles(surface, projectiles):
    for p in projectiles:
        pygame.draw.circle(surface, (255, 200, 80), (int(p.pos[0]), int(p.pos[1])), 4)


def draw_effects(surface, effects):
    for eff in effects:
        if hasattr(eff, "points"):
            if len(eff.points) >= 2:
                pygame.draw.lines(surface, (120, 200, 255), False, [(int(x), int(y)) for x, y in eff.points], 3)
        elif hasattr(eff, "radius"):
            pygame.draw.circle(surface, (255, 120, 180), (int(eff.x), int(eff.y)), int(eff.radius), 2)


def _range_for_preview(tower_id, tier=1):
    s = tier_stats(tower_id, tier)
    if tower_id == 5:
        return s.get("aura", 100)
    if tower_id == 6:
        return s.get("max_radius", 95)
    return s.get("range", 100)


def draw_overlays(surface, state):
    # grid hover
    if state.hover_cell:
        col, row = state.hover_cell
        rect = pygame.Rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(surface, COLOR_HOVER, rect, 2)

    # placement preview
    if state.shop_selection and state.hover_cell:
        col, row = state.hover_cell
        tid = state.shop_selection
        valid = can_place(state, col, row) and state.gold >= TOWER_TYPES[tid]["base_cost"]
        color = TOWER_TYPES[tid]["color"] if valid else COLOR_INVALID
        rect = pygame.Rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(surface, color, rect, 2)
        if valid:
            s = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
            s.fill((*color[:3], 50))
            surface.blit(s, rect.topleft)
            cx = col * CELL_SIZE + CELL_SIZE // 2
            cy = row * CELL_SIZE + CELL_SIZE // 2
            r = int(_range_for_preview(tid))
            pygame.draw.circle(surface, (*color[:3], 80), (cx, cy), r, 1)

    # hovered tower
    show = state.hover_tower
    if show and show is not state.placed_selection:
        _draw_tower_range(surface, show, COLOR_HOVER, 35)

    if state.placed_selection:
        _draw_tower_range(surface, state.placed_selection, COLOR_SELECT, 50)
        rect = pygame.Rect(
            state.placed_selection.col * CELL_SIZE,
            state.placed_selection.row * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE,
        )
        pygame.draw.rect(surface, COLOR_SELECT, rect, 3)

    # heli setup ghost
    from game.state import GamePhase

    if state.phase == GamePhase.HELI_SETUP and state.heli_setup_tower:
        import pygame as pg
        mx, my = pg.mouse.get_pos()
        if mx < MAP_PIXEL_W and my < MAP_PIXEL_H:
            pad = state.heli_setup_tower
            radius = int(((mx - pad.pos[0]) ** 2 + (my - pad.pos[1]) ** 2) ** 0.5)
            pygame.draw.circle(surface, (120, 200, 160), (int(mx), int(my)), max(40, min(radius, 160)), 1)
            pygame.draw.circle(surface, (120, 200, 160), (int(pad.pos[0]), int(pad.pos[1])), 6)


def _draw_tower_range(surface, tower, color, alpha_hint):
    cx = int(tower.pos[0])
    cy = int(tower.pos[1])
    r = int(tower.display_range())
    if tower.tower_id == 9 and tower.patrol_center:
        cx, cy = int(tower.patrol_center[0]), int(tower.patrol_center[1])
        r = int(tower.patrol_radius)
    pygame.draw.circle(surface, color, (cx, cy), r, 2)
    rect = pygame.Rect(tower.col * CELL_SIZE, tower.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    pygame.draw.rect(surface, color, rect, 2)
