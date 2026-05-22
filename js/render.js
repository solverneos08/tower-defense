import {
  CELL_SIZE, COLORS, GRID_H, GRID_W, HUD_H, MAP_PIXEL_H, MAP_PIXEL_W,
  SHOP_H, SIDEBAR_W, TOWER_TYPES, WINDOW_H, WINDOW_W, tierStats,
} from './config.js';
import { isNobuild, isWall } from './map.js';
import { canPlace, canvasToMap } from './input.js';
import { Phase } from './state.js';
import { cellCenter } from './map.js';
import {
  drawTowerSprite, drawTowerSpriteMini, drawHelicopter, drawDrone,
  drawProjectile, projectileKind, drawExplosion, drawLightningEffect, drawShockwaveEffect,
} from './sprites.js';

export function towerStatsLines(tower) {
  const s = tower.stats;
  const lines = [`${tower.name}`, `Tier ${tower.tier} / 3`, `Invested: ${tower.invested}g`];
  const tid = tower.towerId;
  if (tid === 1) lines.push(`DMG: ${s.damage}`, `Rate: ${(1 / s.fire_interval).toFixed(1)}/s`, `Range: ${s.range}`);
  else if (tid === 2) lines.push(`DMG: ${s.damage}`, `Splash: ${s.splash}`, `Range: ${s.range}`);
  else if (tid === 3) lines.push(`Slow: ${Math.floor((1 - s.slow) * 100)}%`, `Splash: ${s.splash}`, `Range: ${s.range}`);
  else if (tid === 4) lines.push(`DMG: ${s.damage}`, `Chains: ${s.chains}`, `Range: ${s.range}`);
  else if (tid === 5) lines.push(`Buff: +${Math.floor(s.buff_pct * 100)}%`, `Aura: ${s.aura}`);
  else if (tid === 6) lines.push(`DMG: ${s.damage}`, `Pulse: ${s.pulse_interval}s`, `Radius: ${s.max_radius}`);
  else if (tid === 7) lines.push(`DMG: ${s.damage}`, `Mag: ${tower.magazine}/${s.magazine}`, `Reload: ${s.reload_per}s/shot`);
  else if (tid === 8) lines.push(`Spawn: ${s.spawn_interval}s`, `Boom: ${s.drone_damage}`, `Radius: ${s.boom_radius}`);
  else if (tid === 9) {
    if (tower.heli) lines.push(`Heli: ${tower.heli.state}`, `Missiles: ${tower.heli.magazine}`);
    lines.push(`DMG: ${s.missile_damage}`, `Patrol R: ${Math.floor(tower.patrolRadius)}`);
  }
  return lines;
}

function rangePreview(towerId, tier = 1) {
  const s = tierStats(towerId, tier);
  if (towerId === 5) return s.aura ?? 100;
  if (towerId === 6) return s.max_radius ?? 95;
  return s.range ?? 100;
}

export function draw(ctx, state, mx, my) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WINDOW_W, WINDOW_H);

  ctx.save();
  ctx.translate(0, HUD_H);

  for (let row = 0; row < GRID_H; row++) {
    for (let col = 0; col < GRID_W; col++) {
      const x = col * CELL_SIZE, y = row * CELL_SIZE;
      if (isWall(col, row)) ctx.fillStyle = COLORS.wall;
      else if (isNobuild(col, row)) ctx.fillStyle = COLORS.nobuild;
      else ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = COLORS.grid;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  for (const [col, row] of state.globalPath) {
    if (!isWall(col, row)) {
      ctx.fillStyle = COLORS.path;
      ctx.fillRect(col * CELL_SIZE + 4, row * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }
  }

  const mapPos = canvasToMap(mx, my);
  if (mapPos) drawOverlays(ctx, state, mapPos[0], mapPos[1]);

  for (const t of state.towers) {
    const cx = t.col * CELL_SIZE + CELL_SIZE / 2;
    const cy = t.row * CELL_SIZE + CELL_SIZE / 2;
    drawTowerSprite(ctx, t.towerId, t.tier, cx, cy, 1.1);
    if (t.heli && t.patrolReady) {
      ctx.strokeStyle = 'rgba(80,120,100,0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(t.heli.pos[0], t.heli.pos[1]);
      ctx.stroke();
      ctx.setLineDash([]);
      const hx = t.heli.pos[0];
      const hy = t.heli.pos[1];
      const flyAngle = t.heli.state === 'returning'
        ? Math.atan2(cy - hy, cx - hx)
        : t.heli.angle + Math.PI / 2;
      drawHelicopter(ctx, hx, hy, flyAngle, 1.3);
    }
  }

  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.pos[0], e.pos[1], e.radius, 0, Math.PI * 2);
    ctx.fill();
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#282828';
      ctx.fillRect(e.pos[0] - 12, e.pos[1] - 18, 24, 4);
      ctx.fillStyle = '#50dc50';
      ctx.fillRect(e.pos[0] - 12, e.pos[1] - 18, 24 * (e.hp / e.maxHp), 4);
    }
  }

  for (const d of state.drones) {
    let angle = -Math.PI / 2;
    if (d.pathIndex < d.path.length) {
      const tgt = cellCenter(d.path[d.pathIndex][0], d.path[d.pathIndex][1]);
      angle = Math.atan2(tgt[1] - d.pos[1], tgt[0] - d.pos[0]);
    }
    drawDrone(ctx, d.pos[0], d.pos[1], angle);
  }

  for (const p of state.projectiles) {
    if (!p.target || p.target.hp <= 0) continue;
    const dx = p.target.pos[0] - p.pos[0];
    const dy = p.target.pos[1] - p.pos[1];
    const angle = Math.atan2(dy, dx);
    const kind = p.kind ?? projectileKind(p);
    drawProjectile(ctx, p.pos[0], p.pos[1], angle, kind);
  }

  for (const eff of state.effects) {
    if (eff.type === 'explosion') drawExplosion(ctx, eff);
    else if (eff.type === 'lightning' && eff.points?.length >= 2) drawLightningEffect(ctx, eff);
    else if (eff.type === 'shock') drawShockwaveEffect(ctx, eff);
  }

  ctx.restore();

  drawHud(ctx, state);
  drawShop(ctx, state);
  drawSidebar(ctx, state);

  if (state.phase === Phase.PAUSED) drawPause(ctx);
  if (state.phase === Phase.GAME_OVER) drawGameOver(ctx, state.waveIndex);
  if (state.phase === Phase.HELI_SETUP) {
    ctx.fillStyle = '#c8ffc8';
    ctx.font = '16px system-ui';
    ctx.fillText('Click to set patrol center/radius — Esc cancel', 8, HUD_H + 20);
    const pad = state.heliSetupTower;
    const map = canvasToMap(mx, my);
    if (pad && map) {
      const r = Math.max(40, Math.min(Math.hypot(map[0] - pad.pos[0], map[1] - pad.pos[1]), 160));
      ctx.strokeStyle = '#78c8a0';
      ctx.beginPath();
      ctx.arc(map[0], HUD_H + map[1], r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawOverlays(ctx, state, mx, my) {
  if (state.hoverCell) {
    const [col, row] = state.hoverCell;
    ctx.strokeStyle = COLORS.hover;
    ctx.lineWidth = 2;
    ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  if (state.shopSelection && state.hoverCell) {
    const [col, row] = state.hoverCell;
    const tid = state.shopSelection;
    const valid = canPlace(state, col, row) && state.gold >= TOWER_TYPES[tid].base_cost;
    const color = valid ? TOWER_TYPES[tid].color : COLORS.invalid;
    ctx.strokeStyle = color;
    ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    if (valid) {
      const cx = col * CELL_SIZE + CELL_SIZE / 2;
      const cy = row * CELL_SIZE + CELL_SIZE / 2;
      drawTowerSprite(ctx, tid, 1, cx, cy, 1, 0.55);
      ctx.beginPath();
      ctx.arc(cx, cy, rangePreview(tid), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (state.hoverTower && state.hoverTower !== state.placedSelection) {
    drawTowerRange(ctx, state.hoverTower, COLORS.hover);
  }
  if (state.placedSelection) {
    drawTowerRange(ctx, state.placedSelection, COLORS.select);
    const t = state.placedSelection;
    ctx.strokeStyle = COLORS.select;
    ctx.lineWidth = 3;
    ctx.strokeRect(t.col * CELL_SIZE, t.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}

function drawTowerRange(ctx, tower, color) {
  let cx = tower.pos[0], cy = tower.pos[1], r = tower.displayRange();
  if (tower.towerId === 9 && tower.patrolCenter) {
    cx = tower.patrolCenter[0];
    cy = tower.patrolCenter[1];
    r = tower.patrolRadius;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(tower.col * CELL_SIZE, tower.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, WINDOW_W, HUD_H);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px system-ui';
  const wave = state.waveActive ? '(active)' : (state.waveReady ? '(ready)' : '');
  ctx.fillText(`Gold: ${state.gold}  Lives: ${state.lives}  Wave ${state.waveIndex} ${wave}  [Space] start`, 8, 22);
}

function drawShop(ctx, state) {
  const y = HUD_H + MAP_PIXEL_H;
  ctx.fillStyle = '#191e26';
  ctx.fillRect(0, y, MAP_PIXEL_W, SHOP_H);
  const slotW = MAP_PIXEL_W / 9;
  ctx.font = '12px system-ui';
  for (let i = 1; i <= 9; i++) {
    const spec = TOWER_TYPES[i];
    const x = (i - 1) * slotW;
    const sel = state.shopSelection === i;
    const afford = state.gold >= spec.base_cost;
    ctx.fillStyle = afford ? '#2a3340' : '#252830';
    ctx.fillRect(x + 2, y + 4, slotW - 4, SHOP_H - 8);
    drawTowerSpriteMini(ctx, i, x + slotW / 2 - 14, y + 6, 28, 28);
    if (sel) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 4, slotW - 4, SHOP_H - 8);
    }
    ctx.fillStyle = afford ? COLORS.text : '#707080';
    ctx.textAlign = 'center';
    ctx.fillText(`${spec.name.slice(0, 10)}`, x + slotW / 2, y + 48);
    ctx.fillText(`${spec.base_cost}g`, x + slotW / 2, y + 62);
    ctx.textAlign = 'left';
  }
}

function drawSidebar(ctx, state) {
  const x0 = MAP_PIXEL_W;
  ctx.fillStyle = '#1e232d';
  ctx.fillRect(x0, HUD_H, SIDEBAR_W, WINDOW_H - HUD_H);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px system-ui';
  let y = HUD_H + 16;
  ctx.fillText('Tower Info', x0 + 10, y);
  y += 28;

  let inspect = state.hoverTower || state.placedSelection;
  if (state.hoverTower && state.placedSelection && state.hoverTower !== state.placedSelection) {
    inspect = state.hoverTower;
  }
  if (inspect) {
    drawTowerSprite(ctx, inspect.towerId, inspect.tier, x0 + SIDEBAR_W / 2, y + 24, 1.4);
    y += 52;
    for (const line of towerStatsLines(inspect)) {
      ctx.fillText(line, x0 + 10, y);
      y += 22;
    }
    if (state.hoverTower && !state.placedSelection) {
      ctx.fillStyle = '#9696a0';
      ctx.fillText('RMB to select', x0 + 10, y);
      y += 24;
      ctx.fillStyle = COLORS.text;
    }
  } else {
    ctx.fillStyle = '#8c8c96';
    ctx.fillText('Hover a tower', x0 + 10, y);
    y += 22;
    ctx.fillStyle = COLORS.text;
  }

  if (state.placedSelection) {
    y += 8;
    ctx.fillStyle = COLORS.select;
    ctx.fillText(`Selected: ${state.placedSelection.name}`, x0 + 10, y);
    y += 28;
    ctx.fillStyle = COLORS.text;
    const t = state.placedSelection;
    if (t.canUpgrade()) ctx.fillText(`[U] Upgrade ${t.getUpgradeCost()}g`, x0 + 10, y);
    else { ctx.fillStyle = '#8c8c96'; ctx.fillText('Max tier', x0 + 10, y); }
    y += 22;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`[S] Sell ${t.sellValue()}g`, x0 + 10, y);
  }
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, WINDOW_W, WINDOW_H);
  ctx.fillStyle = '#fff';
  ctx.font = '24px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', WINDOW_W / 2, 160);
  for (const [label, y] of [['Resume', 210], ['Restart', 280]]) {
    ctx.fillStyle = '#465064';
    ctx.fillRect(420, y, 200, 50);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(label, WINDOW_W / 2, y + 32);
  }
  ctx.textAlign = 'left';
}

function drawGameOver(ctx, wave) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, WINDOW_W, WINDOW_H);
  ctx.fillStyle = '#ff6464';
  ctx.font = '22px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`Game Over — Wave ${wave}`, WINDOW_W / 2, 220);
  ctx.fillStyle = '#3c7850';
  ctx.fillRect(400, 300, 300, 60);
  ctx.fillStyle = '#fff';
  ctx.fillText('Restart', WINDOW_W / 2, 338);
  ctx.textAlign = 'left';
}
