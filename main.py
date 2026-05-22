#!/usr/bin/env python3
"""Tower Defense — entry point."""

import sys

import pygame

from game.audio import AudioManager
from game.combat import update_combat
from game.config import FPS, HUD_H, MAP_PIXEL_H, SHOP_H, WINDOW_H, WINDOW_W
from game.input import handle_keydown, handle_mouse, update_hover
from game.renderer import (
    draw_drones,
    draw_effects,
    draw_enemies,
    draw_map,
    draw_overlays,
    draw_projectiles,
    draw_towers,
)
from game.state import GamePhase, GameState
from game.ui import (
    draw_game_over,
    draw_hud,
    draw_menu,
    draw_pause,
    draw_shop,
    draw_sidebar,
)
from game.wave_manager import WaveManager


def main():
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
    pygame.display.set_caption("Tower Defense")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("arial", 20)
    big_font = pygame.font.SysFont("arial", 48)

    state = GameState()
    wave_mgr = WaveManager()
    audio = AudioManager()
    game_time = 0.0
    from game.config import MAP_PIXEL_W

    map_surf = pygame.Surface((MAP_PIXEL_W, MAP_PIXEL_H))

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0
        game_time += dt

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if not audio.muted:
                    handle_keydown(event.key, state, wave_mgr, audio)
                else:
                    handle_keydown(event.key, state, wave_mgr, None)
                if event.key == pygame.K_m:
                    audio.muted = not audio.muted
            elif event.type in (pygame.MOUSEBUTTONDOWN, pygame.MOUSEBUTTONUP):
                handle_mouse(state, event, audio if not audio.muted else None)
            elif event.type == pygame.MOUSEMOTION:
                update_hover(state, *event.pos)

        mx, my = pygame.mouse.get_pos()
        update_hover(state, mx, my)

        if state.phase == GamePhase.PLAYING:
            wave_mgr.update(dt, state, game_time)
            update_combat(state, dt, game_time, audio if not audio.muted else None)

            leaked = []
            for e in state.enemies[:]:
                if e.hp <= 0:
                    state.gold += e.reward
                    state.enemies.remove(e)
                    continue
                if e.update(dt, state.global_path, game_time):
                    leaked.append(e)
                    state.lives -= 1
                if e.hp <= 0:
                    state.gold += e.reward
                    state.enemies.remove(e)
            for e in leaked:
                if e in state.enemies:
                    state.enemies.remove(e)

            if state.lives <= 0:
                state.phase = GamePhase.GAME_OVER

        screen.fill((20, 24, 30))

        if state.phase == GamePhase.MENU:
            draw_menu(screen, font, big_font)
        else:
            map_surf.fill((0, 0, 0))
            draw_map(map_surf, state)
            draw_towers(map_surf, state.towers)
            draw_enemies(map_surf, state.enemies)
            draw_drones(map_surf, state.drones)
            draw_projectiles(map_surf, state.projectiles)
            draw_effects(map_surf, state.effects)
            draw_overlays(map_surf, state)

            for t in state.towers:
                if t.heli and t.patrol_ready:
                    hx, hy = int(t.heli.pos[0]), int(t.heli.pos[1])
                    pygame.draw.circle(map_surf, (100, 180, 140), (hx, hy), 10)
                    pygame.draw.line(map_surf, (80, 120, 100), (int(t.pos[0]), int(t.pos[1])), (hx, hy), 1)

            screen.blit(map_surf, (0, HUD_H))
            draw_hud(screen, state, font)
            draw_shop(screen, state, font, HUD_H + MAP_PIXEL_H)
            draw_sidebar(screen, state, font)

            if state.phase == GamePhase.PAUSED:
                draw_pause(screen, font)
            elif state.phase == GamePhase.GAME_OVER:
                draw_game_over(screen, font, state.wave_index)
            elif state.phase == GamePhase.HELI_SETUP:
                hint = font.render("Click to set patrol center/radius — Esc cancel", True, (200, 255, 200))
                screen.blit(hint, (8, HUD_H + 8))

        pygame.display.flip()

    pygame.quit()
    return 0


if __name__ == "__main__":
    sys.exit(main())
