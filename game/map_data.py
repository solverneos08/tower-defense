"""Grid layout: walls, no-build spawn/goal zones."""

from __future__ import annotations

from game.config import (
    GRID_H,
    GRID_W,
    LEFT_NOBUILD_COLS,
    NOBUILD_ROWS,
    RIGHT_NOBUILD_COLS,
)


def is_nobuild(col: int, row: int) -> bool:
    if row not in NOBUILD_ROWS:
        return False
    return col in LEFT_NOBUILD_COLS or col in RIGHT_NOBUILD_COLS


def is_wall(col: int, row: int) -> bool:
    if is_nobuild(col, row):
        return False
    return col == 0 or col == GRID_W - 1 or row == 0 or row == GRID_H - 1


def is_in_left_spawn(col: int, row: int) -> bool:
    return row in NOBUILD_ROWS and col in LEFT_NOBUILD_COLS


def is_in_right_goal(col: int, row: int) -> bool:
    return row in NOBUILD_ROWS and col in RIGHT_NOBUILD_COLS


def left_spawn_cells() -> list[tuple[int, int]]:
    return [(c, r) for r in NOBUILD_ROWS for c in LEFT_NOBUILD_COLS]


def left_spawn_center() -> tuple[int, int]:
    """Centre tile of left no-build zone (leftmost col, middle row)."""
    mid_row = NOBUILD_ROWS[len(NOBUILD_ROWS) // 2]
    return LEFT_NOBUILD_COLS[0], mid_row


def right_spawn_center() -> tuple[int, int]:
    """Centre tile of right no-build zone (rightmost col, middle row)."""
    mid_row = NOBUILD_ROWS[len(NOBUILD_ROWS) // 2]
    return RIGHT_NOBUILD_COLS[-1], mid_row


def right_goal_cells() -> list[tuple[int, int]]:
    return [(c, r) for r in NOBUILD_ROWS for c in RIGHT_NOBUILD_COLS]


def cell_center(col: int, row: int) -> tuple[float, float]:
    from game.config import CELL_SIZE

    return (col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2)


def pos_to_cell(x: float, y: float) -> tuple[int, int] | None:
    from game.config import CELL_SIZE, GRID_H, GRID_W

    if x < 0 or y < 0:
        return None
    c, r = int(x // CELL_SIZE), int(y // CELL_SIZE)
    if 0 <= c < GRID_W and 0 <= r < GRID_H:
        return c, r
    return None
