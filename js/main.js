import { WINDOW_W, WINDOW_H } from './config.js';
import { GameState, Phase } from './state.js';
import { WaveManager } from './waves.js';
import { updateCombat } from './combat.js';
import { handleKey, handleClick, updateHover } from './input.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WINDOW_W;
canvas.height = WINDOW_H;

const state = new GameState();
state.resetRun();
const waveMgr = new WaveManager();
let gameTime = 0;
let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  gameTime += dt;

  if (state.phase === Phase.PLAYING) {
    waveMgr.update(dt, state);
    updateCombat(state, dt, gameTime);

    const leaked = [];
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (e.hp <= 0) {
        state.gold += e.reward;
        state.enemies.splice(i, 1);
        continue;
      }
      if (e.update(dt, state.globalPath, gameTime)) {
        leaked.push(e);
        state.lives--;
      }
      if (e.hp <= 0) {
        state.gold += e.reward;
        const idx = state.enemies.indexOf(e);
        if (idx >= 0) state.enemies.splice(idx, 1);
      }
    }
    for (const e of leaked) {
      const idx = state.enemies.indexOf(e);
      if (idx >= 0) state.enemies.splice(idx, 1);
    }
    if (state.lives <= 0) state.phase = Phase.GAME_OVER;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (mouseX - rect.left) * scaleX;
  const my = (mouseY - rect.top) * scaleY;
  updateHover(state, mx, my);
  draw(ctx, state, mx, my);

  requestAnimationFrame(loop);
}

let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX;
  mouseY = e.clientY;
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  handleClick(state, mx, my, e.button);
  e.preventDefault();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
  const key = e.key.length === 1 && e.key !== ' ' ? e.key.toLowerCase() : e.key;
  handleKey(state, waveMgr, key);
});

requestAnimationFrame(loop);
