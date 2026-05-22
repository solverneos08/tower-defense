import { HUD_H, MAP_PIXEL_H, MAP_PIXEL_W, SHOP_H, TOWER_TYPES } from './config.js';
import { isNobuild, isWall } from './map.js';
import { pathExistsWithTowerAt } from './pathfinder.js';
import { Tower } from './entities.js';
import { setupHeli } from './combat.js';
import { Phase } from './state.js';
import { posToCell } from './map.js';

/** Canvas coords → map surface coords (strip HUD strip above grid). */
export function canvasToMap(mx, my) {
  const mapY = my - HUD_H;
  if (mx < 0 || mx >= MAP_PIXEL_W || mapY < 0 || mapY >= MAP_PIXEL_H) return null;
  return [mx, mapY];
}

export function screenToGrid(mx, my) {
  const map = canvasToMap(mx, my);
  if (!map) return null;
  return posToCell(map[0], map[1]);
}

/** Tower id 1–9 if click is on the shop bar. */
export function shopTowerAt(mx, my) {
  const y0 = HUD_H + MAP_PIXEL_H;
  if (my < y0 || my >= y0 + SHOP_H || mx < 0 || mx >= MAP_PIXEL_W) return null;
  const slotW = MAP_PIXEL_W / 9;
  const id = Math.floor(mx / slotW) + 1;
  return id >= 1 && id <= 9 ? id : null;
}

export function towerAtScreen(state, mx, my) {
  const cell = screenToGrid(mx, my);
  return cell ? state.towerAt(cell[0], cell[1]) : null;
}

export function canPlace(state, col, row) {
  if (isWall(col, row) || isNobuild(col, row)) return false;
  if (state.towerAt(col, row)) return false;
  return pathExistsWithTowerAt(col, row, state.towerCells);
}

export function updateHover(state, mx, my) {
  state.hoverCell = screenToGrid(mx, my);
  state.hoverTower = state.hoverCell ? state.towerAt(state.hoverCell[0], state.hoverCell[1]) : null;
}

function repathAll(state) {
  state.recomputePath();
  for (const e of state.enemies) e.requestRepath(state.globalPath);
}

export function tryPlace(state, col, row) {
  const tid = state.shopSelection;
  if (!tid || !TOWER_TYPES[tid]) return;
  if (!canPlace(state, col, row)) return;
  const cost = TOWER_TYPES[tid].base_cost;
  if (state.gold < cost) return;
  state.gold -= cost;
  const tower = new Tower(tid, col, row, cost);
  state.towers.push(tower);
  state.towerCells.add(`${col},${row}`);
  repathAll(state);
  if (tid === 9) {
    state.phase = Phase.HELI_SETUP;
    state.heliSetupTower = tower;
  } else {
    state.shopSelection = null;
  }
}

export function tryUpgrade(state) {
  const t = state.placedSelection;
  if (!t || !t.canUpgrade()) return;
  const cost = t.getUpgradeCost();
  if (state.gold < cost) return;
  state.gold -= cost;
  t.upgrade();
}

export function trySell(state) {
  const t = state.placedSelection;
  if (!t) return;
  state.gold += t.sellValue();
  state.towers = state.towers.filter(x => x.id !== t.id);
  state.towerCells.delete(`${t.col},${t.row}`);
  state.placedSelection = null;
  repathAll(state);
}

export function handleKey(state, waveMgr, key) {
  if (state.phase === Phase.GAME_OVER) {
    if (key === 'Enter' || key === 'r') state.resetRun();
    return;
  }
  if (state.phase === Phase.PAUSED) {
    if (key === 'Escape') state.phase = Phase.PLAYING;
    return;
  }
  if (state.phase !== Phase.PLAYING && state.phase !== Phase.HELI_SETUP) return;

  if (key === 'Escape') {
    if (state.phase === Phase.HELI_SETUP) {
      state.phase = Phase.PLAYING;
      state.heliSetupTower = null;
    } else state.phase = Phase.PAUSED;
    return;
  }
  if (key === '0') {
    state.shopSelection = null;
    state.placedSelection = null;
    return;
  }
  if (key >= '1' && key <= '9') {
    state.shopSelection = parseInt(key, 10);
    state.placedSelection = null;
    return;
  }
  if (key === ' ' && state.waveReady && !state.waveActive) {
    state.waveIndex++;
    state.recomputePath();
    state.waveActive = true;
    state.waveReady = false;
    waveMgr.startWave(state.waveIndex);
    return;
  }
  if (key === 'u' || key === 'U') tryUpgrade(state);
  if (key === 's' || key === 'S') trySell(state);
}

export function handleClick(state, mx, my, button) {
  if (state.phase === Phase.GAME_OVER) {
    if (button === 0 && mx > 400 && mx < 700 && my > 300 && my < 360) state.resetRun();
    return;
  }
  if (state.phase === Phase.PAUSED) {
    if (button !== 0) return;
    if (my > 200 && my < 250) state.phase = Phase.PLAYING;
    else if (my > 270 && my < 320) state.resetRun();
    return;
  }
  if (state.phase === Phase.HELI_SETUP && button === 0 && state.heliSetupTower) {
    const map = canvasToMap(mx, my);
    if (!map) return;
    const cx = Math.max(40, Math.min(map[0], MAP_PIXEL_W - 40));
    const cy = Math.max(40, Math.min(map[1], MAP_PIXEL_H - 40));
    const pad = state.heliSetupTower;
    const radius = Math.hypot(cx - pad.pos[0], cy - pad.pos[1]);
    setupHeli(pad, [cx, cy], radius);
    state.phase = Phase.PLAYING;
    state.heliSetupTower = null;
    state.shopSelection = null;
    return;
  }
  if (state.phase !== Phase.PLAYING) return;

  if (button === 0) {
    const shopId = shopTowerAt(mx, my);
    if (shopId) {
      state.shopSelection = shopId;
      state.placedSelection = null;
      return;
    }
    if (state.shopSelection) {
      const cell = screenToGrid(mx, my);
      if (cell) tryPlace(state, cell[0], cell[1]);
    }
    return;
  }

  if (button === 2) {
    const t = towerAtScreen(state, mx, my);
    state.placedSelection = t;
  }
}
