import { GRID_H, GRID_W } from './config.js';
import { isWall, leftSpawnCells, rightGoalCells } from './map.js';

function walkable(col, row, blocked) {
  if (col < 0 || row < 0 || col >= GRID_W || row >= GRID_H) return false;
  if (isWall(col, row)) return false;
  if (blocked.has(`${col},${row}`)) return false;
  return true;
}

function neighbors(c, r) {
  return [[c, r + 1], [c, r - 1], [c + 1, r], [c - 1, r]];
}

function astar(start, goals, blocked) {
  const goalSet = new Set(goals.map(([c, r]) => `${c},${r}`));
  const startKey = `${start[0]},${start[1]}`;
  const open = new Map([[startKey, { c: start[0], r: start[1], g: 0 }]]);
  const cameFrom = new Map([[startKey, null]]);
  const gScore = new Map([[startKey, 0]]);

  const h = (c, r) => {
    let best = 1e9;
    for (const [gc, gr] of goals) {
      const d = Math.abs(c - gc) + Math.abs(r - gr);
      if (d < best) best = d;
    }
    return best;
  };

  while (open.size) {
    let curKey = null;
    let cur = null;
    let bestF = 1e9;
    for (const [key, node] of open) {
      const f = node.g + h(node.c, node.r);
      if (f < bestF) {
        bestF = f;
        curKey = key;
        cur = node;
      }
    }
    open.delete(curKey);

    if (goalSet.has(curKey)) {
      const path = [];
      let node = curKey;
      while (node != null) {
        const [nc, nr] = node.split(',').map(Number);
        path.push([nc, nr]);
        node = cameFrom.get(node);
      }
      return path.reverse();
    }

    for (const [nc, nr] of neighbors(cur.c, cur.r)) {
      if (!walkable(nc, nr, blocked)) continue;
      const nk = `${nc},${nr}`;
      const ng = cur.g + 1;
      if (ng < (gScore.get(nk) ?? 1e9)) {
        gScore.set(nk, ng);
        cameFrom.set(nk, curKey);
        open.set(nk, { c: nc, r: nr, g: ng });
      }
    }
  }
  return [];
}

export function findPath(blocked) {
  const starts = leftSpawnCells().filter(([c, r]) => walkable(c, r, blocked));
  const goals = rightGoalCells().filter(([c, r]) => walkable(c, r, blocked));
  if (!starts.length || !goals.length) return [];

  let best = [];
  for (const start of starts) {
    const path = astar(start, goals, blocked);
    if (path.length && (!best.length || path.length < best.length)) best = path;
  }
  return best;
}

export function findPathReverse(blocked) {
  const starts = rightGoalCells().filter(([c, r]) => walkable(c, r, blocked));
  const goals = leftSpawnCells().filter(([c, r]) => walkable(c, r, blocked));
  if (!starts.length || !goals.length) return [];

  let best = [];
  for (const start of starts) {
    const path = astar(start, goals, blocked);
    if (path.length && (!best.length || path.length < best.length)) best = path;
  }
  return best;
}

export function pathExistsWithTowerAt(col, row, towerCells) {
  const blocked = new Set(towerCells);
  blocked.add(`${col},${row}`);
  return findPath(blocked).length > 0;
}
