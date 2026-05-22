"""Input handling."""

from __future__ import annotations

import pygame

from game.config import MAP_PIXEL_H, MAP_PIXEL_W, TOWER_TYPES
from game.map_data import is_nobuild, is_wall, pos_to_cell
from game.pathfinder import path_exists_with_tower_at
from game.state import GamePhase


def screen_to_grid(mx, my) -> tuple[int, int] | None:
    if mx >= MAP_PIXEL_W or my >= MAP_PIXEL_H:
        return None
    return pos_to_cell(mx, my)


def tower_at_screen(state, mx, my):
    cell = screen_to_grid(mx, my)
    if cell:
        return state.tower_at(cell[0], cell[1])
    return None


def can_place(state, col, row) -> bool:
    if is_wall(col, row) or is_nobuild(col, row):
        return False
    if state.tower_at(col, row):
        return False
    if not path_exists_with_tower_at(col, row, state.tower_cells):
        return False
    return True


def handle_keydown(key, state, wave_mgr, audio) -> None:
    if state.phase == GamePhase.MENU:
        if key in (pygame.K_RETURN, pygame.K_SPACE):
            state.reset_run()
            if audio:
                audio.play("wave")
        return

    if state.phase == GamePhase.GAME_OVER:
        if key in (pygame.K_RETURN, pygame.K_r):
            state.reset_run()
        return

    if state.phase == GamePhase.PAUSED:
        if key == pygame.K_ESCAPE:
            state.phase = GamePhase.PLAYING
        return

    if state.phase not in (GamePhase.PLAYING, GamePhase.HELI_SETUP):
        return

    if key == pygame.K_ESCAPE:
        if state.phase == GamePhase.HELI_SETUP:
            state.phase = GamePhase.PLAYING
            state.heli_setup_tower = None
        else:
            state.phase = GamePhase.PAUSED
        return

    if key == pygame.K_0:
        state.shop_selection = None
        state.placed_selection = None
        return

    if pygame.K_1 <= key <= pygame.K_9:
        state.shop_selection = key - pygame.K_0
        state.placed_selection = None
        return

    if key == pygame.K_SPACE and state.wave_ready and not state.wave_active:
        state.wave_index += 1
        state.wave_active = True
        state.wave_ready = False
        wave_mgr.start_wave(state.wave_index)
        if audio:
            audio.play("wave")
        return

    if key == pygame.K_u and state.placed_selection:
        _try_upgrade(state, audio)
    if key == pygame.K_s and state.placed_selection:
        _try_sell(state)


def handle_mouse(state, event, audio) -> None:
    mx, my = event.pos

    if state.phase == GamePhase.MENU:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if 400 < mx < 700 and 280 < my < 340:
                state.reset_run()
        return

    if state.phase == GamePhase.GAME_OVER:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if 400 < mx < 700 and 300 < my < 360:
                state.reset_run()
        return

    if state.phase == GamePhase.PAUSED:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if 420 < mx < 620 and 200 < my < 250:
                state.phase = GamePhase.PLAYING
            elif 420 < mx < 620 and 270 < my < 320:
                state.reset_run()
            elif 420 < mx < 620 and 340 < my < 390:
                state.phase = GamePhase.MENU
        return

    if state.phase == GamePhase.HELI_SETUP and event.type == pygame.MOUSEBUTTONDOWN:
        if event.button == 1 and state.heli_setup_tower:
            from game.combat import setup_heli

            cx = max(40, min(mx, MAP_PIXEL_W - 40))
            cy = max(40, min(my, MAP_PIXEL_H - 40))
            pad = state.heli_setup_tower
            radius = ((cx - pad.pos[0]) ** 2 + (cy - pad.pos[1]) ** 2) ** 0.5
            setup_heli(pad, (cx, cy), radius)
            state.phase = GamePhase.PLAYING
            state.heli_setup_tower = None
            state.shop_selection = None
        return

    if state.phase != GamePhase.PLAYING:
        return

    if event.type == pygame.MOUSEBUTTONDOWN:
        if event.button == 3:
            t = tower_at_screen(state, mx, my)
            state.placed_selection = t
        elif event.button == 1:
            if state.shop_selection:
                cell = screen_to_grid(mx, my)
                if cell:
                    _try_place(state, cell[0], cell[1], audio)


def update_hover(state, mx, my):
    state.hover_cell = screen_to_grid(mx, my)
    state.hover_tower = tower_at_screen(state, mx, my) if state.hover_cell else None


def _try_place(state, col, row, audio):
    tid = state.shop_selection
    if not tid or tid not in TOWER_TYPES:
        return
    if not can_place(state, col, row):
        return
    cost = TOWER_TYPES[tid]["base_cost"]
    if state.gold < cost:
        return

    from game.entities.tower_base import Tower

    state.gold -= cost
    tower = Tower(tid, col, row, cost)
    state.towers.append(tower)
    state.tower_cells.add((col, row))
    state.recompute_path()
    for e in state.enemies:
        e.request_repath(state.global_path)
    if audio:
        audio.play("place")

    if tid == 9:
        state.phase = GamePhase.HELI_SETUP
        state.heli_setup_tower = tower
    else:
        state.shop_selection = None


def _try_upgrade(state, audio):
    t = state.placed_selection
    if not t or not t.can_upgrade():
        return
    cost = t.upgrade_cost()
    if state.gold < cost:
        return
    state.gold -= cost
    t.upgrade()
    if audio:
        audio.play("upgrade")


def _try_sell(state):
    t = state.placed_selection
    if not t:
        return
    state.gold += t.sell_value()
    state.towers.remove(t)
    state.tower_cells.discard((t.col, t.row))
    state.placed_selection = None
    state.recompute_path()
    for e in state.enemies:
        e.request_repath(state.global_path)
