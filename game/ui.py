"""HUD, shop, sidebar."""

import pygame

from game.config import (
    COLOR_HUD,
    COLOR_TEXT,
    MAP_PIXEL_H,
    MAP_PIXEL_W,
    SHOP_H,
    SIDEBAR_W,
    TOWER_TYPES,
    WINDOW_H,
    WINDOW_W,
    upgrade_cost,
)
from game.entities.tower_base import Tower


def tower_stats_lines(tower: Tower) -> list[str]:
    s = tower.stats
    lines = [
        f"{tower.name}",
        f"Tier {tower.tier} / 3",
        f"Invested: {tower.invested}g",
    ]
    tid = tower.tower_id
    if tid == 1:
        lines += [f"DMG: {s['damage']}", f"Rate: {1/s['fire_interval']:.1f}/s", f"Range: {s['range']}"]
    elif tid == 2:
        lines += [f"DMG: {s['damage']}", f"Splash: {s['splash']}", f"Range: {s['range']}"]
    elif tid == 3:
        lines += [f"Slow: {int((1-s['slow'])*100)}%", f"Splash: {s['splash']}", f"Range: {s['range']}"]
    elif tid == 4:
        lines += [f"DMG: {s['damage']}", f"Chains: {s['chains']}", f"Range: {s['range']}"]
    elif tid == 5:
        lines += [f"Buff: +{int(s['buff_pct']*100)}%", f"Aura: {s['aura']}"]
    elif tid == 6:
        lines += [f"DMG: {s['damage']}", f"Pulse: {s['pulse_interval']}s", f"Radius: {s['max_radius']}"]
    elif tid == 7:
        lines += [f"DMG: {s['damage']}", f"Mag: {tower.magazine}/{s['magazine']}", f"Reload: {s['reload_per']}s/shot"]
    elif tid == 8:
        lines += [f"Spawn: {s['spawn_interval']}s", f"Boom: {s['drone_damage']}", f"Radius: {s['boom_radius']}"]
    elif tid == 9:
        st = "Ready"
        if tower.heli:
            st = tower.heli.state
            lines += [f"Heli: {st}", f"Missiles: {tower.heli.magazine}"]
        lines += [f"DMG: {s['missile_damage']}", f"Patrol R: {int(tower.patrol_radius)}"]
    return lines


def draw_hud(surface, state, font):
    pygame.draw.rect(surface, COLOR_HUD, (0, 0, WINDOW_W, 32))
    wave_txt = f"Wave {state.wave_index}" + (" (active)" if state.wave_active else (" (ready)" if state.wave_ready else ""))
    txt = font.render(
        f"Gold: {state.gold}  Lives: {state.lives}  {wave_txt}  [Space] start",
        True,
        COLOR_TEXT,
    )
    surface.blit(txt, (8, 6))


def draw_shop(surface, state, font, offset_y):
    pygame.draw.rect(surface, (25, 30, 38), (0, offset_y, MAP_PIXEL_W, SHOP_H))
    slot_w = MAP_PIXEL_W // 9
    for i in range(1, 10):
        tid = i
        spec = TOWER_TYPES[tid]
        x = (i - 1) * slot_w
        rect = pygame.Rect(x + 2, offset_y + 4, slot_w - 4, SHOP_H - 8)
        sel = state.shop_selection == tid
        afford = state.gold >= spec["base_cost"]
        color = spec["color"] if afford else (80, 80, 80)
        pygame.draw.rect(surface, color, rect, border_radius=4)
        if sel:
            pygame.draw.rect(surface, (255, 255, 255), rect, 3, border_radius=4)
        label = font.render(f"{i}:{spec['name'][:8]}", True, (20, 20, 20))
        cost = font.render(f"{spec['base_cost']}g", True, (30, 30, 30))
        surface.blit(label, (x + 6, offset_y + 10))
        surface.blit(cost, (x + 6, offset_y + 36))


def draw_sidebar(surface, state, font):
    x0 = MAP_PIXEL_W
    pygame.draw.rect(surface, (30, 35, 45), (x0, 32, SIDEBAR_W, WINDOW_H - 32))
    y = 40
    title = font.render("Tower Info", True, COLOR_TEXT)
    surface.blit(title, (x0 + 10, y))
    y += 28

    inspect = state.hover_tower or state.placed_selection
    if state.hover_tower and state.placed_selection and state.hover_tower is not state.placed_selection:
        inspect = state.hover_tower

    if inspect:
        for line in tower_stats_lines(inspect):
            surface.blit(font.render(line, True, COLOR_TEXT), (x0 + 10, y))
            y += 22
        if state.hover_tower and not state.placed_selection:
            surface.blit(font.render("RMB to select", True, (150, 150, 160)), (x0 + 10, y))
            y += 24
    else:
        surface.blit(font.render("Hover a tower", True, (140, 140, 150)), (x0 + 10, y))
        y += 22

    if state.placed_selection:
        y += 8
        surface.blit(
            font.render(f"Selected: {state.placed_selection.name}", True, (255, 210, 80)),
            (x0 + 10, y),
        )
        y += 28
        t = state.placed_selection
        if t.can_upgrade():
            uc = t.upgrade_cost()
            surface.blit(font.render(f"[U] Upgrade {uc}g", True, COLOR_TEXT), (x0 + 10, y))
        else:
            surface.blit(font.render("Max tier", True, (140, 140, 150)), (x0 + 10, y))
        y += 22
        surface.blit(font.render(f"[S] Sell {t.sell_value()}g", True, COLOR_TEXT), (x0 + 10, y))


def draw_menu(surface, font, big_font):
    surface.fill((20, 25, 35))
    t = big_font.render("Tower Defense", True, (230, 230, 240))
    surface.blit(t, (WINDOW_W // 2 - t.get_width() // 2, 120))
    sub = font.render("Press Enter or click Play — 1-9 place towers, 0 deselect", True, (180, 180, 190))
    surface.blit(sub, (WINDOW_W // 2 - sub.get_width() // 2, 200))
    pygame.draw.rect(surface, (60, 120, 80), (400, 280, 300, 60), border_radius=8)
    play = font.render("Play", True, (255, 255, 255))
    surface.blit(play, (520, 298))


def draw_pause(surface, font):
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 140))
    surface.blit(overlay, (0, 0))
    t = font.render("PAUSED", True, (255, 255, 255))
    surface.blit(t, (WINDOW_W // 2 - 40, 150))
    for label, y in [("Resume", 200), ("Restart", 270), ("Quit to Menu", 340)]:
        pygame.draw.rect(surface, (70, 80, 100), (420, y, 200, 50), border_radius=6)
        surface.blit(font.render(label, True, COLOR_TEXT), (460, y + 14))


def draw_game_over(surface, font, wave):
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 160))
    surface.blit(overlay, (0, 0))
    t = font.render(f"Game Over — Wave {wave}", True, (255, 100, 100))
    surface.blit(t, (WINDOW_W // 2 - t.get_width() // 2, 200))
    pygame.draw.rect(surface, (60, 120, 80), (400, 300, 300, 60), border_radius=8)
    surface.blit(font.render("Restart", True, (255, 255, 255)), (510, 318))
