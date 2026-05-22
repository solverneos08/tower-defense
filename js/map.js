import { CELL_SIZE, GRID_H, GRID_W, LEFT_NOBUILD_COLS, NOBUILD_ROWS, RIGHT_NOBUILD_COLS } from './config.js';

export function isNobuild(col, row) {
  if (!NOBUILD_ROWS.includes(row)) return false;
  return LEFT_NOBUILD_COLS.includes(col) || RIGHT_NOBUILD_COLS.includes(col);
}

export function isWall(col, row) {
  if (isNobuild(col, row)) return false;
  return col === 0 || col === GRID_W - 1 || row === 0 || row === GRID_H - 1;
}

export function isLeftSpawn(col, row) {
  return NOBUILD_ROWS.includes(row) && LEFT_NOBUILD_COLS.includes(col);
}

export function isRightGoal(col, row) {
  return NOBUILD_ROWS.includes(row) && RIGHT_NOBUILD_COLS.includes(col);
}

export function leftSpawnCells() {
  const out = [];
  for (const r of NOBUILD_ROWS)
    for (const c of LEFT_NOBUILD_COLS) out.push([c, r]);
  return out;
}

/** Left no-build zone: centre row, leftmost column (col 0, row 7 on default grid). */
export function leftSpawnCenter() {
  const midRow = NOBUILD_ROWS[Math.floor(NOBUILD_ROWS.length / 2)];
  return [LEFT_NOBUILD_COLS[0], midRow];
}

export function rightGoalCells() {
  const out = [];
  for (const r of NOBUILD_ROWS)
    for (const c of RIGHT_NOBUILD_COLS) out.push([c, r]);
  return out;
}

export function cellCenter(col, row) {
  return [col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2];
}

export function posToCell(x, y) {
  if (x < 0 || y < 0) return null;
  const c = Math.floor(x / CELL_SIZE);
  const r = Math.floor(y / CELL_SIZE);
  if (c >= 0 && c < GRID_W && r >= 0 && r < GRID_H) return [c, r];
  return null;
}
