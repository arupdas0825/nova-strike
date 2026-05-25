# NOVA STRIKE — Space Combat

**NOVA STRIKE** is a production-ready, ultra-optimized 2D space combat web game built from scratch using Vanilla JavaScript (ES2022+), HTML5 Canvas, and the Web Audio API synthesizer. Delivered with zero runtime dependencies and packaged in under 200 KB, it features 4 unique enemy classes, homing rockets, power-ups, screen shake camera effects, a multi-combo scoring matrix, and a retro CRT visual style.

---

## 🎮 Controller Interface

| Command Action | Keyboard Keybinds | Touch Virtual Layout |
| :--- | :--- | :--- |
| **Move Fighter** | `W`, `A`, `S`, `D` / `Arrow Keys` | Left Virtual Joystick (Drag) |
| **Twin Blaster Cannons** | `Spacebar` (Hold for continuous blasters) | Bottom-Right Action Circle (Hold) |
| **Release Homing Rocket** | `M` | Top-Right Action Circle (Tap) |
| **Pause Systems** | `P` | Dynamic Overlay Tap |
| **Deploy New Fighter** | `R` (Game Over screen only) | Tap Anywhere |

---

## 🚀 Local Launching & Building

### Pre-requisites
Ensure you have **Node.js (version 18+)** and **npm** installed on your operating system.

### 1. Installation
Change into the project directory and install the development packages:
```bash
cd nova-strike
npm install
```

### 2. Live Dev Sandbox
Run the local Vite dev server with hot module reloading (HMR) enabled:
```bash
npm run dev
```
Navigate to [http://localhost:5173](http://localhost:5173) inside your browser.

### 3. Production Compilation
Bundle the codebase into optimized single static assets under `dist/`:
```bash
npm run build
```

---

## 📦 GitHub Pages Automatic Deploy

To share the game with others live, follow these simple deployment steps:

1. Create a public repository on GitHub named `nova-strike` (`https://github.com/USERNAME/nova-strike`).
2. Run these commands inside your project folder:
   ```bash
   git init
   git add .
   git commit -m "feat: NOVA STRIKE v1.0"
   git remote add origin https://github.com/USERNAME/nova-strike.git
   git branch -M main
   git push -u origin main
   ```
3. Deploy the application to the `gh-pages` deployment branch:
   ```bash
   npm run deploy
   ```
4. Open `https://github.com/USERNAME/nova-strike/settings/pages`.
5. Under **Build and deployment**, verify that **Source** is set to **Deploy from a branch**, and the **Branch** is set to `gh-pages` (`/root`). Click **Save**.
6. Your live deployment URL will be:
   `https://USERNAME.github.io/nova-strike/`

---

## 🛸 Technical Architecture

```
nova-strike/
├── index.html              # Entry point containing the canvas, CRT grid and loader overlay
├── package.json            # Vite 5 dev server & package management scripts
├── vite.config.js          # Vite config with base path set to /nova-strike/
├── .gitignore
├── README.md               # Game information and user documentation
└── src/
    ├── main.js             # Entry module bootstraping the main Game instance
    ├── Game.js             # Game state machine (loops, game states, updates and canvas painter)
    ├── config/
    │   ├── constants.js    # Master configuration containing screen dimensions and colors
    │   └── enemyDefs.js    # Stat matrix defining health, speed, damage, and fire rates for all enemies
    ├── engine/
    │   ├── Canvas.js       # Dynamic resizing, rendering ratios and high-DPI (Retina) scaling
    │   ├── Input.js        # Event listener and keyboard state manager mapping custom actions
    │   ├── Audio.js        # Live synthesizer engine utilizing Web Audio API nodes (zero static files)
    │   ├── Camera.js       # Implements matrix translation and decaying screen shake triggers
    │   └── Pool.js         # Memory-efficient object pooling to prevent runtime garbage collection lag
    ├── entities/
    │   ├── Player.js       # Player ship object mapping physics-based friction, blasters, and shielding
    │   ├── Enemy.js        # Polymorphic enemy states mapping Scout, Fighter, Bomber and Boss behaviors
    │   ├── Bullet.js       # Forward projectiles released by the player and opposing ships
    │   ├── Missile.js      # Player homing missile which tracks targets and emits flame trails
    │   ├── PowerUp.js      # Spawned pickups representing Health, Rapid Fire, Shield, and Missiles
    │   └── Particle.js     # Light indicators representing thrust trails, score text, and explosions
    ├── systems/
    │   ├── Collision.js    # High-speed circle-circle and bounding-box intersection resolver
    │   ├── Spawner.js      # Spawning system dynamically calculating wave intervals and scaling difficulty
    │   ├── ScoreSystem.js  # Scoring system containing multi-combo multiplier and level progress
    │   └── SaveSystem.js   # Interfaces with localStorage to persist configurations and high scores
    ├── ui/
    │   ├── HUD.js          # In-game bars showing Health, Shield, active boss indicators, and text alerts
    │   ├── TitleScreen.js  # Visual splash screen with particle stars and menu prompts
    │   ├── GameOverScreen.js # Highscore validation interface and score cards
    │   ├── PauseScreen.js  # Glassmorphic overlay suspending entity update cycles
    │   └── TouchControls.js# Renders interactive virtual pads for mobile and tablet screens
    └── effects/
        ├── Stars.js        # Multi-layer background star field responding to player position
        └── Nebula.js       # Organic, slow-moving radial gradient overlays representing space gas
```

---

## 📊 Combat Scoring Matrix

Score is calculated dynamically based on destroyed enemy points multiplied by your active combo streak.

| Opponent Ship Class | Base Kill Points | Tactical Combat Behavior |
| :--- | :--- | :--- |
| **SCOUT** | `10 Pts` | Quick zigzag maneuvers with low-frequency single shots |
| **FIGHTER** | `25 Pts` | Direct tracker chasing player and accurately aiming blasters |
| **BOMBER** | `50 Pts` | Heavy armor, slow sweeping arcs, and high-damage laser cannons |
| **BOSS** | `200 Pts` | Massive battleship utilizing wobbling horizontal sweeps and 3-way spreads |

---

## ⚡ Tactical Combat Guides (5 Tips)

1. **Guard the Combo Counter**: Every consecutive kill increments your combo counter up to a maximum multiplier of **10x**! The combo decays after 130 idle frames—stay aggressive to secure massive scores.
2. **Blitz the Orange Energy (⚡)**: The Rapid Fire power-up shortens blaster release cooldown to a tiny **3 frames** (base is 14) for 320 frames. Collect it immediately to decimate target waves.
3. **Maneuver around Boss Waves**: The Command Boss Battle Cruiser appears every **500 points**. It wobbles horizontally and shoots a dense 3-way spread. Dodge between the blast seams rather than directly fleeing downscreen.
4. **Deploy Missiles with Steering**: Missiles auto-steer toward the closest active threat. Deploy them (`M` key) against heavy bombers and aggressive fighters.
5. **Exploit Shield Decay**: Active shields (◈ Blue) offer complete invulnerability, but decay continuously at **0.06 HP per frame**. Play aggressively while the cyan shields are active.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE details.
