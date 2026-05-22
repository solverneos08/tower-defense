# Tower Defense

Browser-based tower defense with 9 tower types, dynamic maze pathing (A*), and 3 upgrade tiers each.

## Play online

**https://solverneos08.github.io/tower-defense/**

(Source: [github.com/solverneos08/tower-defense](https://github.com/solverneos08/tower-defense))

## Run locally

You need a local HTTP server (ES modules won't load from `file://`).

```bash
cd ~/Projects/tower-defense
npm start
```

Then open **http://localhost:3000** in your browser.

Alternative without npm:

```bash
python3 -m http.server 3000
# open http://localhost:3000
```

## Controls

| Key | Action |
|-----|--------|
| **1–9** | Select tower type to place |
| **0** | Deselect all |
| **Left click** | Place selected tower (or set heli patrol) |
| **Right click** | Select placed tower (upgrade/sell) |
| **Hover** | Grid outline, range preview, sidebar stats |
| **U** | Upgrade selected tower |
| **S** | Sell selected tower |
| **Space** | Start next wave |
| **Esc** | Pause / cancel heli setup |

## Towers

1. Machine Gun — fast single-target  
2. Missile Launcher — AOE splash  
3. Slow Tower — AOE slow  
4. Electric — chain lightning  
5. Support — buffs nearby fire rate  
6. Shockwave — expanding pulse  
7. Homing — magazine + reload, ignores walls  
8. Drone Spawner — kamikaze drones (right → left)  
9. Heli Pad — click after place to set patrol  

## Map

- **26×15** grid, outer walls with spawn/goal portal gaps  
- Towers can block the path to force longer enemy routes  

## Legacy Python version

The original Pygame version is still in `main.py` and `game/`. Run with `pip install -r requirements.txt && python main.py` if you prefer desktop Python.
