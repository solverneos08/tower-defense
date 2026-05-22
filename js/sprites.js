/** Procedural tower sprites — cached offscreen canvases per tower type. */

import { TOWER_TYPES } from './config.js';

const SPRITE_SIZE = 32;
const cache = new Map();

function darken(hex, amt = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amt)) | 0;
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amt)) | 0;
  const b = Math.max(0, (n & 255) * (1 - amt)) | 0;
  return `rgb(${r},${g},${b})`;
}

function lighten(hex, amt = 0.2) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 255 * amt) | 0;
  const g = Math.min(255, ((n >> 8) & 255) + 255 * amt) | 0;
  const b = Math.min(255, (n & 255) + 255 * amt) | 0;
  return `rgb(${r},${g},${b})`;
}

/** @param {CanvasRenderingContext2D} c */
function drawBase(c, color) {
  c.fillStyle = darken(color, 0.35);
  c.fillRect(4, 20, 24, 8);
  c.fillStyle = darken(color, 0.15);
  c.beginPath();
  c.arc(16, 18, 10, 0, Math.PI, true);
  c.fill();
}

function painters() {
  return {
    1: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.2);
      c.fillRect(10, 10, 4, 10);
      c.fillRect(18, 10, 4, 10);
      c.fillStyle = lighten(color);
      c.fillRect(9, 8, 6, 3);
      c.fillRect(17, 8, 6, 3);
      c.fillStyle = '#333';
      c.fillRect(11, 11, 2, 6);
      c.fillRect(19, 11, 2, 6);
    },
    2: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.25);
      c.fillRect(8, 6, 16, 14);
      c.strokeStyle = '#2a1810';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(10, 18);
      c.lineTo(10, 6);
      c.moveTo(16, 18);
      c.lineTo(16, 4);
      c.moveTo(22, 18);
      c.lineTo(22, 6);
      c.stroke();
      c.fillStyle = lighten(color, 0.15);
      c.beginPath();
      c.arc(16, 5, 4, 0, Math.PI * 2);
      c.fill();
    },
    3: (c, color) => {
      drawBase(c, color);
      c.strokeStyle = lighten(color, 0.35);
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = 16 + Math.cos(a) * 10;
        const y = 12 + Math.sin(a) * 10;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
      c.fillStyle = 'rgba(200,240,255,0.5)';
      c.fill();
      c.fillStyle = lighten(color);
      c.beginPath();
      c.arc(16, 12, 3, 0, Math.PI * 2);
      c.fill();
    },
    4: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.2);
      c.fillRect(14, 4, 4, 16);
      c.fillStyle = lighten(color);
      c.beginPath();
      c.arc(16, 6, 6, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = '#fff';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(8, 10);
      c.lineTo(24, 14);
      c.moveTo(10, 16);
      c.lineTo(22, 8);
      c.stroke();
    },
    5: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.2);
      c.fillRect(14, 12, 4, 8);
      c.fillStyle = lighten(color);
      c.beginPath();
      c.ellipse(16, 10, 12, 5, 0, Math.PI, 0);
      c.fill();
      c.strokeStyle = darken(color, 0.3);
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = '#4a6a30';
      c.beginPath();
      c.arc(16, 10, 3, 0, Math.PI * 2);
      c.fill();
    },
    6: (c, color) => {
      drawBase(c, color);
      c.strokeStyle = color;
      c.lineWidth = 3;
      for (let r = 4; r <= 10; r += 3) {
        c.beginPath();
        c.arc(16, 14, r, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }
      c.fillStyle = lighten(color);
      c.beginPath();
      c.arc(16, 14, 4, 0, Math.PI * 2);
      c.fill();
    },
    7: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.25);
      c.fillRect(6, 8, 20, 12);
      c.fillStyle = lighten(color);
      for (let i = 0; i < 3; i++) {
        c.fillRect(8 + i * 6, 6, 4, 8);
      }
      c.fillStyle = '#ff4444';
      c.beginPath();
      c.moveTo(24, 10);
      c.lineTo(28, 12);
      c.lineTo(24, 14);
      c.fill();
    },
    8: (c, color) => {
      drawBase(c, color);
      c.fillStyle = darken(color, 0.3);
      c.fillRect(5, 8, 22, 12);
      c.fillStyle = '#1a1a28';
      c.fillRect(8, 11, 16, 8);
      c.fillStyle = lighten(color);
      c.beginPath();
      c.moveTo(16, 6);
      c.lineTo(20, 12);
      c.lineTo(12, 12);
      c.closePath();
      c.fill();
      c.fillStyle = '#888';
      c.fillRect(13, 13, 6, 2);
    },
    9: (c, color) => {
      c.fillStyle = darken(color, 0.35);
      c.fillRect(2, 18, 28, 10);
      c.fillStyle = '#fff';
      c.font = 'bold 11px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('H', 16, 24);
      c.fillStyle = lighten(color);
      c.beginPath();
      c.ellipse(16, 10, 12, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#3a5a48';
      c.fillRect(12, 8, 8, 3);
      c.strokeStyle = '#2a4038';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(8, 10);
      c.lineTo(4, 6);
      c.moveTo(24, 10);
      c.lineTo(28, 6);
      c.stroke();
    },
  };
}

const PAINT = painters();

function buildSprite(towerId) {
  const color = TOWER_TYPES[towerId]?.color ?? '#888';
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  const paint = PAINT[towerId];
  if (paint) paint(c, color);
  return canvas;
}

export function getTowerSprite(towerId) {
  if (!cache.has(towerId)) cache.set(towerId, buildSprite(towerId));
  return cache.get(towerId);
}

/** Draw tower sprite centered at (cx, cy). */
export function drawTowerSprite(ctx, towerId, tier, cx, cy, scale = 1, alpha = 1) {
  const sprite = getTowerSprite(towerId);
  const w = SPRITE_SIZE * scale;
  const h = SPRITE_SIZE * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, cx - w / 2, cy - h / 2, w, h);
  if (tier > 1) {
    const dots = tier === 2 ? 1 : 2;
    ctx.fillStyle = tier === 3 ? '#ffd23c' : '#c0c8d0';
    for (let i = 0; i <= dots; i++) {
      ctx.beginPath();
      ctx.arc(cx - 10 + i * 10, cy + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Mini sprite for shop / sidebar. */
export function drawTowerSpriteMini(ctx, towerId, x, y, w, h) {
  const sprite = getTowerSprite(towerId);
  ctx.drawImage(sprite, x, y, w, h);
}

// --- Unit & FX sprites ---

const heliSprite = (() => {
  const s = 24;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#4a9a6e';
  g.beginPath();
  g.ellipse(12, 12, 10, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3a7858';
  g.fillRect(8, 10, 8, 4);
  g.strokeStyle = '#2a5040';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(2, 12);
  g.lineTo(8, 10);
  g.moveTo(22, 12);
  g.lineTo(16, 10);
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillRect(10, 8, 4, 2);
  return c;
})();

const droneSprite = (() => {
  const s = 20;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#8090c8';
  g.beginPath();
  g.moveTo(10, 2);
  g.lineTo(16, 14);
  g.lineTo(4, 14);
  g.closePath();
  g.fill();
  g.fillStyle = '#ff6644';
  g.beginPath();
  g.arc(10, 12, 3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#606880';
  g.fillRect(8, 14, 4, 3);
  return c;
})();

/** @param {CanvasRenderingContext2D} ctx */
export function drawHelicopter(ctx, x, y, angle = 0, scale = 1.2) {
  const s = heliSprite.width * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(heliSprite, -s / 2, -s / 2, s, s);
  ctx.restore();
}

export function drawDrone(ctx, x, y, angle = 0) {
  const s = droneSprite.width * 1.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.drawImage(droneSprite, -s / 2, -s / 2, s, s);
  ctx.restore();
}

/** @param {'bullet'|'missile'|'homing'|'slow'} kind */
export function drawProjectile(ctx, x, y, angle, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (kind === 'missile' || kind === 'homing') {
    ctx.fillStyle = kind === 'homing' ? '#ffb040' : '#e85a30';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcc66';
    ctx.fillRect(-2, -2, 6, 4);
    if (kind === 'homing') {
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(10, -3);
      ctx.lineTo(10, 3);
      ctx.fill();
    }
  } else if (kind === 'slow') {
    ctx.fillStyle = '#88d0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8f8ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(7, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffe040';
    ctx.fillRect(-5, -2, 10, 4);
    ctx.fillStyle = '#fff8c0';
    ctx.fillRect(2, -1, 4, 2);
  }
  ctx.restore();
}

export function projectileKind(p) {
  if (p.homing) return 'homing';
  if (p.slow) return 'slow';
  if (p.splash >= 40) return 'missile';
  return 'bullet';
}

/** Spawn a short-lived explosion effect. */
export function spawnExplosion(state, x, y, maxRadius, variant = 'fire') {
  state.effects.push({
    type: 'explosion',
    x,
    y,
    radius: 6,
    maxRadius: Math.min(Math.max(maxRadius * 0.55, 20), 90),
    timer: 0,
    duration: 0.38,
    variant,
    dead: false,
  });
}

export function drawExplosion(ctx, eff) {
  const t = Math.min(1, eff.timer / eff.duration);
  const r = eff.radius;
  const alpha = 1 - t;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (eff.variant === 'ice') {
    const g = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, r);
    g.addColorStop(0, 'rgba(220,245,255,0.9)');
    g.addColorStop(0.5, 'rgba(100,180,255,0.5)');
    g.addColorStop(1, 'rgba(60,120,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,240,255,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(eff.x, eff.y);
      ctx.lineTo(eff.x + Math.cos(a) * r * 0.8, eff.y + Math.sin(a) * r * 0.8);
      ctx.stroke();
    }
  } else if (eff.variant === 'electric') {
    ctx.strokeStyle = '#a8e0ff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(eff.x, eff.y);
      const a = (i / 5) * Math.PI * 2 + t * 3;
      ctx.lineTo(eff.x + Math.cos(a) * r, eff.y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(140,200,255,0.4)';
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (eff.variant === 'kamikaze') {
    const g = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, r);
    g.addColorStop(0, 'rgba(255,220,100,1)');
    g.addColorStop(0.35, 'rgba(255,100,40,0.8)');
    g.addColorStop(0.7, 'rgba(180,40,20,0.4)');
    g.addColorStop(1, 'rgba(80,20,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1810';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(eff.x, eff.y);
      ctx.lineTo(eff.x + Math.cos(a) * r * 1.1, eff.y + Math.sin(a) * r * 1.1);
      ctx.lineTo(eff.x + Math.cos(a + 0.2) * r * 0.5, eff.y + Math.sin(a + 0.2) * r * 0.5);
      ctx.fill();
    }
  } else {
    const g = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, r);
    g.addColorStop(0, 'rgba(255,255,200,1)');
    g.addColorStop(0.3, 'rgba(255,160,60,0.85)');
    g.addColorStop(0.65, 'rgba(220,60,20,0.5)');
    g.addColorStop(1, 'rgba(80,20,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,80,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLightningEffect(ctx, eff) {
  if (!eff.points || eff.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = '#78c8ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#b8f0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(eff.points[0][0], eff.points[0][1]);
  for (let i = 1; i < eff.points.length; i++) {
    const p = eff.points[i];
    const prev = eff.points[i - 1];
    const mx = (prev[0] + p[0]) / 2 + (Math.random() - 0.5) * 8;
    const my = (prev[1] + p[1]) / 2 + (Math.random() - 0.5) * 8;
    ctx.lineTo(mx, my);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(180,230,255,0.6)';
  for (const p of eff.points) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawShockwaveEffect(ctx, eff) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,140,200,0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,200,230,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(eff.x, eff.y, eff.radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,180,0.15)';
  ctx.beginPath();
  ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
