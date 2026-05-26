# NOVA STRIKE — Space Combat
> 🚀 [**PLAY LIVE DEMO**](nova-strike-mu.vercel.app)

## Screenshots
<img width="1431" height="850" alt="image" src="https://github.com/user-attachments/assets/42a1ab07-18fd-4f58-9d0f-a78caef817fa" />

<img width="1337" height="874" alt="image" src="https://github.com/user-attachments/assets/5e282f7c-38e6-4918-a1fc-3a54e2b23007" />



## About
NOVA STRIKE is a visually stunning, high-fidelity 2D browser space combat game designed for professional realism and cinematic quality. Built entirely in Vanilla JS using HTML5 dual-canvas architectures and Web Audio synthesizer pipelines, it features realistic Verlet integration physics, advanced AI sweeps, O(1) spatial collision hashes, and dynamic hardware-accelerated post-process glowing blooms. 

## Features
* **Verlet Flight Dynamics**: Position, velocity, acceleration per entity with frame-rate independent drag bounds.
* **Dual-Canvas Post-Processing**: Dynamic hardware-accelerated bloom filter applying 8px CSS blurs onto offscreen channels with screen additive blending.
* **Triple Weapons Slots & Missiles**: Fast-switching Plasma Cannon (cyan), Spread Shot (orange), continuous overheating Laser Beam (cyan/white shimmer), and predictive homing intercept missiles.
* **Advanced Threat Matrix**: 5 specialized standard classes (zigzag Scouts, rolling Fighters, mine-deploying Bombers, pass-and-retreat Interceptors, armored Dreadnought sweepers) and a massive 3-phase Boss.
* **Strategic Formations**: Group-wide V-Formation, Pincers, Walls, Swarms, and Escorts with interactive leader scatter AI checking.
* **O(1) Spatial Hash Grid**: Ultra-performance broadphase cell mapping preventing Garbage Collection spikes.
* **Advanced HUD & minimap**: Animated Lerp HP lag gauges, radial Direct Shield arcs, weapon selection slots, overheating thermal cards, and active radars.
* **Generative Music & Synthesizer**: 15 distinct sound effects and ambient space pads synthesized procedurally via raw Web Audio nodes.
* **Persistent Configuration**: Saved difficulty settings, sliders, FPS toggles, and highscore records.

## Controls

### Keyboard Scheme
| Key | Action |
| --- | --- |
| **W / A / S / D** or **ARROWS** | Dynamic strafing flight |
| **SPACEBAR** | Hold to fire active weapon |
| **Q KEY** | Cycle primary weapons slots (PLASMA → SPREAD → LASER) |
| **M KEY** | Fire predictive homing intercept Missile |
| **P / ESC** | Pause action / Access Configuration subpanel |
| **N KEY** | Global audio mute toggle |

### Touch Controls Scheme (Mobile)
| Button | Screen Region | Action |
| --- | --- | --- |
| **Virtual D-Pad** | Bottom-Left Quadrant | Drag to steer ship position |
| **FIRE** | Bottom-Right Quadrant | Hold to fire active weapon |
| **MSL** | Bottom-Right Quadrant | Tap to fire predictive homing missile |
| **WPN** | Bottom-Right Quadrant | Tap to cycle active primary weapon slot |
| **Pause Area** | Top Center | Tap to suspend gameplay |

## Weapons Guide
1. **Plasma Cannon (Default)**: Cyan oval bolts firing high-speed projectiles (12 DMG, 8f CD). Rapid fire decreases CD to 2f.
2. **Spread Shot**: Fan pattern dispersing 3 orange projectiles at ±14° (9 DMG/bolt, 18f CD). Rapid fire CD reduces to 6f.
3. **Laser Beam**: Continuous ray casting ray emitting white-hot cores (2px) and cyan shrouds (8px). Delivers 2.5 DMG/frame with thermal cooling limits. Overheats after 120 frames of active use; requires 90 frames cool down.
4. **Homing Missiles**: Predictive intercept lead targeting (calculates future coordinates based on targets speed). Fires 55 DMG payloads leaving a 20-point cyan trail. Capacity max 8.

## Enemy Types

### Standard Hostiles
| Class | Hull HP | Speed | Fire Rate | Points | Behavior AI |
| --- | --- | --- | --- | --- | --- |
| **Scout** | 25 HP | 320 px/s | 75 frames | 10 pts | Horizontal sine-wave zigzag (amp 80px, freq 4.8 rad/s). |
| **Fighter** | 55 HP | 210 px/s | 50 frames | 25 pts | Direct chase steering; triggers a 90px horizontal roll on hit. |
| **Bomber** | 110 HP | 130 px/s | 35 frames | 55 pts | Slow descending arcs; deploys 3 homing mines on death. |
| **Interceptor** | 38 HP | 420 px/s | 90 frames | 35 pts | Rapid pass-and-retreat runs firing bursts of 2 shots. |
| **Dreadnought** | 180 HP | 75 px/s | 22 frames | 120 pts | Sweep horizontal patterns. Bottom armor absorbs lasers; top center R:8 is weak. |

### Boss Phases (400 HP, 300 Pts, R:44)
| HP Range | Phase Name | Attack & Movement AI | Visuals |
| --- | --- | --- | --- |
| **100% – 60%** | **Seeker** | Wide sine drift. Fires 3-spread aimed blasters (30f) + 1 homing missile (180f). | Slow outer ring spins. |
| **60% – 30%** | **Berserker** | erratic swoops and diagonal charges (4s). Fires 5-spread aimed (22f) + 2 homing (120f) + 8-radials (200f). | High spin speed, core flickers red. |
| **30% – 0%** | **Destroyer** | Unstoppable slow descent. Fires 7-spread (18f) + 3 homing (90f) + 12-spiral streams (60f). | White core pulsing, fragments drift. |

## Power-ups
* **HEALTH** ♥ (`#00ff88`): Heals +60 HP (Max 100). Green pulse overlay.
* **RAPIDFIRE** ⚡ (`#ff4400`): Primary blasters cooldowns ÷3 for 360 frames.
* **SHIELD** ◈ (`#0088ff`): Activates a 60 HP energy shield drawn as a direct radial arc around hull.
* **MISSILE** ◉ (`#bb00ff`): Replenishes +3 homing missiles (Max 8).
* **WEAPON_UP** ★ (`#ffff00`): Weapon damage scaling factor multiplied by 1.5× for 300 frames.
* **NUKE** ☢ (`#ff0000`): Tactical detonation vaporizing all non-boss screen entities, spawning flash rings.

## Scoring System
Defeating hostiles increases score, increments combos, and records kill streaks. Combo multiplier decays if no hits occur within 150 frames.

### Combo Multiplier Table
| Current Combo | Score Multiplier | Decay Time (Frames) |
| --- | --- | --- |
| **x1** | 1.00× | — |
| **x2** | 1.25× | 150f |
| **x3** | 1.50× | 150f |
| **x5** | 2.00× | 150f |
| **x10 (Max)** | 3.25× | 150f |

* **Level Up thresholds**: Sector increments every 350 score points, repairing +30 HP and launching Warp speedlines.
* **Kill Streaks**: 4s sliding window tracks streaking hits. Displays glowing alerts above streak 3.

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18+ required)

### Install & Run
1. Clone the repository and navigate into folder:
   ```bash
   git clone https://github.com/arupdas0825/nova-strike.git
   cd nova-strike
   ```
2. Install node modules:
   ```bash
   npm install
   ```
3. Boot local hot-reloaded development server:
   ```bash
   npm run dev
   ```
4. Access client in browser at `http://localhost:5173/nova-strike/`.

### Build for Production
Verify compilation bundles and gzipped footprints under 250KB:
```bash
npm run build
```

### Deploy to GitHub Pages
Directly publish production assets from `dist/` to your repository's hosting path:
```bash
npm run deploy
```
*Configure repository Settings → Pages → Build and deployment → Source: `gh-pages` branch.*

## Architecture
```
nova-strike/
├── index.html                   # HTML Entry containing D-pad layers and CRT scanlines
├── package.json                 # Project dependencies (Vite 5, gh-pages)
├── vite.config.js               # Compiler configuration establishing path base routing
├── .gitignore                   # Ignores compiler dist and local modules
├── README.md                    # Core operational spec sheet
└── src/
    ├── main.js                  # Bootstrapper removing loader overlays
    ├── Game.js                  # Master state machine driving variable dt loop ticks
    ├── engine/
    │   ├── Canvas.js            # Scales high-DPI backstore buffers
    │   ├── Input.js             # Polls gamepad axes, keys, and coarse touches
    │   ├── Audio.js             # procedural synthesizer generating 15 sound effects
    │   ├── Camera.js            # decay-based non-linear screen shake
    │   └── Pool.js              # Zero-allocation recycled instance manager
    ├── entities/
    │   ├── Player.js            # Flight physics and active shield arc rings
    │   ├── Enemy.js             # Sweeps, dodge rolls, and Boss phased routines
    │   ├── Bullet.js            # Cyan plasmas, orange spreads, and homing enemy projectiles
    │   ├── Missile.js           # Lead targeting homing steering vectors
    │   ├── Laser.js             # Raycasting laser weapon, heat pools, and shimmer sparks
    │   ├── PowerUp.js           # Hexagons with pulsing labels
    │   └── Particle.js          # Spark debris tumbling particles
    ├── systems/
    │   ├── Collision.js         # O(1) Spatial Hashing Grid broadphase
    │   ├── Spawner.js           # Formation loaders, Dreadnought launches, and Boss phases
    │   ├── WeaponSystem.js      # Player slots cycling and duration buffs
    │   ├── ScoreSystem.js       # Sliding 4s kill-streaks and level scales
    │   └── SaveSystem.js        # settings localstorage serialization
    ├── ui/
    │   ├── HUD.js               # Lerped HP damage delay bars, weapons, and radar minimaps
    │   ├── TitleScreen.js       # Logo eased fly-ins and patrolling fleets
    │   ├── GameOverScreen.js    # Chromatic aberration text divisions
    │   ├── PauseScreen.js       # Translucent sus-ticks cover overlay
    │   ├── SettingsScreen.js    # Volume sliders, difficulties, and tech bindings
    │   └── TouchControls.js     # Adaptive joysticks and WPN switches
    └── effects/
        ├── Stars.js             # 5-layer parallax scrolling starfield streaks
        ├── Nebula.js            # Throttled 600f pre-rendered gas buffer
        ├── Bloom.js             # Offscreen canvas blurring overlay blends
        ├── Warp.js              # Level-up hyperspace line expansion
        └── Explosion.js         # concentric ring shockwaves and shards
```

## Settings
* **Master Volume**: Regulates overall procedurally generated decibels (0-100%).
* **SFX Volume**: Alters individual blaster shoots, hits, and explosion gains (0-100%).
* **Glow Bloom**: Post-process blur filter toggles. Auto-disabled on mobile default, or if FPS drops.
* **Difficulty Scaling**:
  * **Easy**: Hull HP multiplier (0.7×), fire CD delay (0.6×), spawn cooldowns (0.7×).
  * **Normal**: Standard parameters.
  * **Hard**: Hull HP multiplier (1.3×), fire CD delay (1.3×), spawn cooldowns (1.2×).
  * **Insane**: Massive HP (1.8×), fast rates (1.7×), spawns (1.5×), and activates **predictive lead aiming** for enemy projectiles.
* **Show FPS**: Activates real-time refresh rates counter.

## Performance Tips
* **Toggle Bloom OFF** in Settings if rendering latency spikes. Hardware-accelerated CSS blurring is resource heavy on older graphics chips.
* Dual-canvas blits automatically downgrade if frame rate is detected below 40 FPS for 3+ consecutive seconds.

## License
MIT License. Copyright (c) 2026.

## Author
Arup Das (@arupdas0825)
