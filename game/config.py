"""Game constants and tower/enemy definitions."""

GRID_W = 26
GRID_H = 15
assert GRID_W % 2 == 0 and GRID_H % 2 == 1

CELL_SIZE = 36
MAP_PIXEL_W = GRID_W * CELL_SIZE
MAP_PIXEL_H = GRID_H * CELL_SIZE
SIDEBAR_W = 220
SHOP_H = 72
HUD_H = 32
WINDOW_W = MAP_PIXEL_W + SIDEBAR_W
WINDOW_H = MAP_PIXEL_H + SHOP_H + HUD_H

FPS = 60
START_GOLD = 450
START_LIVES = 20
SELL_REFUND = 0.7

# Colors
COLOR_BG = (28, 32, 40)
COLOR_GRASS = (45, 90, 55)
COLOR_PATH = (75, 65, 45)
COLOR_WALL = (35, 38, 48)
COLOR_NOBUILD = (90, 85, 95)
COLOR_GRID = (55, 70, 58)
COLOR_HUD = (20, 24, 30)
COLOR_TEXT = (230, 230, 235)
COLOR_INVALID = (200, 60, 60)
COLOR_SELECT = (255, 210, 60)
COLOR_HOVER = (180, 220, 255)

NOBUILD_ROWS = tuple(range((GRID_H - 3) // 2, (GRID_H - 3) // 2 + 3))
LEFT_NOBUILD_COLS = (0, 1)
RIGHT_NOBUILD_COLS = (GRID_W - 2, GRID_W - 1)

ENEMY_TYPES = {
    "grunt": {"hp": 80, "speed": 55, "reward": 12, "color": (180, 80, 80)},
    "runner": {"hp": 45, "speed": 95, "reward": 14, "color": (220, 160, 60)},
    "brute": {"hp": 220, "speed": 38, "reward": 28, "color": (120, 70, 160)},
}

# tower_id -> {name, base_cost, color, tiers: {1: stats, 2: ..., 3: ...}}
TOWER_TYPES = {
    1: {
        "name": "Machine Gun",
        "base_cost": 100,
        "color": (200, 200, 80),
        "tiers": {
            1: {"damage": 6, "range": 110, "fire_interval": 0.12},
            2: {"damage": 9, "range": 120, "fire_interval": 0.10},
            3: {"damage": 14, "range": 130, "fire_interval": 0.08},
        },
    },
    2: {
        "name": "Missile Launcher",
        "base_cost": 180,
        "color": (220, 100, 60),
        "tiers": {
            1: {"damage": 35, "range": 130, "fire_interval": 0.9, "splash": 55},
            2: {"damage": 52, "range": 140, "fire_interval": 0.8, "splash": 65},
            3: {"damage": 75, "range": 150, "fire_interval": 0.7, "splash": 75},
        },
    },
    3: {
        "name": "Slow Tower",
        "base_cost": 160,
        "color": (100, 180, 220),
        "tiers": {
            1: {"damage": 4, "range": 120, "fire_interval": 0.7, "splash": 50, "slow": 0.55, "slow_dur": 2.0},
            2: {"damage": 6, "range": 130, "fire_interval": 0.6, "splash": 58, "slow": 0.45, "slow_dur": 2.5},
            3: {"damage": 8, "range": 140, "fire_interval": 0.5, "splash": 65, "slow": 0.35, "slow_dur": 3.0},
        },
    },
    4: {
        "name": "Electric",
        "base_cost": 200,
        "color": (140, 200, 255),
        "tiers": {
            1: {"damage": 22, "range": 115, "fire_interval": 0.85, "chains": 3, "chain_radius": 70, "falloff": 0.7},
            2: {"damage": 32, "range": 125, "fire_interval": 0.75, "chains": 4, "chain_radius": 80, "falloff": 0.72},
            3: {"damage": 45, "range": 135, "fire_interval": 0.65, "chains": 5, "chain_radius": 90, "falloff": 0.75},
        },
    },
    5: {
        "name": "Support",
        "base_cost": 150,
        "color": (180, 220, 120),
        "tiers": {
            1: {"aura": 100, "buff_pct": 0.20},
            2: {"aura": 115, "buff_pct": 0.28},
            3: {"aura": 130, "buff_pct": 0.35},
        },
    },
    6: {
        "name": "Shockwave",
        "base_cost": 220,
        "color": (255, 140, 200),
        "tiers": {
            1: {"damage": 28, "pulse_interval": 2.2, "max_radius": 95},
            2: {"damage": 42, "pulse_interval": 2.0, "max_radius": 110},
            3: {"damage": 60, "pulse_interval": 1.8, "max_radius": 125},
        },
    },
    7: {
        "name": "Homing",
        "base_cost": 250,
        "color": (255, 180, 80),
        "tiers": {
            1: {"damage": 40, "range": 200, "magazine": 5, "reload_per": 2.0},
            2: {"damage": 58, "range": 220, "magazine": 5, "reload_per": 1.8},
            3: {"damage": 80, "range": 240, "magazine": 6, "reload_per": 1.6},
        },
    },
    8: {
        "name": "Drone Spawner",
        "base_cost": 240,
        "color": (160, 160, 200),
        "tiers": {
            1: {"spawn_interval": 4.0, "drone_hp": 30, "drone_damage": 45, "drone_speed": 70, "boom_radius": 45},
            2: {"spawn_interval": 3.2, "drone_hp": 45, "drone_damage": 65, "drone_speed": 80, "boom_radius": 52},
            3: {"spawn_interval": 2.6, "drone_hp": 65, "drone_damage": 90, "drone_speed": 90, "boom_radius": 60},
        },
    },
    9: {
        "name": "Heli Pad",
        "base_cost": 320,
        "color": (120, 200, 160),
        "tiers": {
            1: {"missile_damage": 50, "missile_splash": 60, "magazine": 5, "reload_time": 2.0, "patrol_speed": 1.8, "fire_interval": 0.5},
            2: {"missile_damage": 72, "missile_splash": 70, "magazine": 5, "reload_time": 1.8, "patrol_speed": 2.0, "fire_interval": 0.45},
            3: {"missile_damage": 100, "missile_splash": 80, "magazine": 5, "reload_time": 1.6, "patrol_speed": 2.2, "fire_interval": 0.4},
        },
    },
}

WAVES = [
    {"grunt": 8, "interval": 0.8},
    {"grunt": 12, "runner": 4, "interval": 0.7},
    {"grunt": 10, "runner": 8, "interval": 0.65},
    {"grunt": 8, "runner": 6, "brute": 2, "interval": 0.6},
    {"grunt": 12, "runner": 10, "brute": 3, "interval": 0.55},
    {"runner": 15, "brute": 5, "interval": 0.5},
    {"grunt": 15, "runner": 12, "brute": 6, "interval": 0.48},
    {"grunt": 10, "runner": 15, "brute": 8, "interval": 0.45},
    {"runner": 20, "brute": 10, "interval": 0.42},
    {"grunt": 15, "runner": 15, "brute": 12, "interval": 0.4},
]


def tier_stats(tower_id: int, tier: int) -> dict:
    return TOWER_TYPES[tower_id]["tiers"][tier]


def upgrade_cost(tower_id: int, tier: int) -> int:
    base = TOWER_TYPES[tower_id]["base_cost"]
    if tier == 1:
        return int(base * 0.6)
    if tier == 2:
        return base
    return 0
