export function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function nearestEnemyInRange(pos, enemies, rangePx) {
  let best = null;
  let bestD = rangePx + 1;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = dist(pos, e.pos);
    if (d <= rangePx && d < bestD) { bestD = d; best = e; }
  }
  return best;
}

export function enemiesInRadius(pos, enemies, radius) {
  return enemies.filter(e => e.hp > 0 && dist(pos, e.pos) <= radius);
}

export function chainTargets(first, enemies, chainRadius, maxChains) {
  const result = [first];
  const used = new Set([first.id]);
  let current = first;
  for (let i = 0; i < maxChains - 1; i++) {
    let best = null;
    let bestD = chainRadius + 1;
    for (const e of enemies) {
      if (e.hp <= 0 || used.has(e.id)) continue;
      const d = dist(current.pos, e.pos);
      if (d <= chainRadius && d < bestD) { bestD = d; best = e; }
    }
    if (!best) break;
    result.push(best);
    used.add(best.id);
    current = best;
  }
  return result;
}
