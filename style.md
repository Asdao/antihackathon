# Visual Style Guide & Design System

## Core Aesthetic: Vintage Handheld & CRT Arcade

The game uses an authentic late-80s / early-90s handheld arcade terminal aesthetic, combining pure CSS scanlines, pixel typography, and high-contrast silhouette canvas graphics.

---

## 1. Color Palettes

The game supports three dynamic retro palettes switchable via `data-theme` on the root container:

### Palette A: Game Boy DMG-01 (Default)
Emulates the original 1989 Nintendo Game Boy LCD display:
- **Darkest Background**: `#0f380f` (Deep olive black)
- **Dark Neutral**: `#306230` (Muted army green)
- **Accent & Borders**: `#8bac0f` (Bright retro green)
- **Primary Text**: `#9bbc0f` (High-contrast yellow-green)
- **Danger / Hit**: `#e63946`
- **Warning**: `#ffb703`

### Palette B: Cyberpunk Amber CRT (`data-theme="amber"`)
Emulates early VT100 / IBM monochrome amber phosphor monitors:
- **Darkest Background**: `#0c0800`
- **Dark Neutral**: `#2d1c00`
- **Accent & Borders**: `#9e6c00`
- **Primary Text**: `#ffba08`
- **Danger**: `#d00000`

### Palette C: Arcade Neon Noir (`data-theme="neon"`)
High-contrast 1-bit cyberpunk arcade:
- **Darkest Background**: `#0a0a12`
- **Dark Neutral**: `#1b1b2f`
- **Accent & Borders**: `#00f0ff` (Cyan)
- **Primary Text**: `#f7f7f7`
- **Danger**: `#ff0055` (Hot pink / crimson)

---

## 2. Typography

| Role | Font Family | Size | Notes |
| :--- | :--- | :--- | :--- |
| **System Headings / HUD** | `'Press Start 2P', monospace` | `9px - 12px` | All-caps, tracked, pixel-rendered |
| **Action Buttons** | `'Press Start 2P', monospace` | `10px - 11px` | 3px solid pixel borders with offset shadow |
| **Narrative Body Text** | `'VT323', monospace` | `19px - 22px` | High-readability terminal font for story cards |
| **Fallback** | `'Courier New', monospace` | System | Seamless offline fallback |

---

## 3. CRT Screen Effects

1. **Scanline Overlay (`.crt-overlay`)**:
   Pure CSS gradient (`linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.08) 50%)`) at `100% 3px` pitch. Low-opacity subtle texture without ocular strain or chromatic RGB fringing.
2. **Vignette (`.crt-vignette`)**:
   Soft `inset 0 0 40px rgba(0, 0, 0, 0.5)` softening screen boundaries without obscuring corner HUD data.
3. **Anti-Strain Standards (No Rapid Flicker)**:
   Rapid opacity flickering (`crt-flicker`) is disabled to prevent ocular fatigue while preserving authentic phosphor atmosphere.
4. **Screen Glitch (`.glitch-active`)**:
   Keyframe displacement `transform: translate(-2px, 2px)` combined with contrast boost, triggered momentarily during drug boosts and the final climax.
5. **CRT Power-Off Collapse (`.tv-power-off`)**:
   Vintage television shutdown animation collapsing the screen horizontally into a razor-thin line, shrinking to a dot, and fading into pitch black.

---

## 4. Canvas Silhouette Art Direction

Both minigames (**Shadow Fighter** and **Parkour Runner**) follow strict silhouette design rules:

- **Actors**: Drawn in solid silhouette (`#020502` to `#050a05`). No facial features or internal textures—expression is conveyed purely through stance, posture, accessories, and movement.
- **Transparent Limb Borders**:
  - Overlapping limbs (arms over torso, legs) use a $2\text{px}$ negative-space cutout border rendered in the background color.
  - This guarantees clear visual separation of arms, fists, and weapons against dark torsos without needing internal sprite textures.
- **Pixelated Block Rendering**:
  - Limbs, hair, and weapons are snapped to chunky integer pixel steps ($2\text{px} - 4\text{px}$) with squared-off edges rather than smoothed curves.
- **Consolidated Merged Blocks**:
  - Instead of rendering dozens of floating disjointed micro-pieces, silhouettes are merged into 2–3 cohesive solid blocks (Unified Core Body, Grounded Stance Base with cutout slit, and Consolidated Limb/Arm with transparent negative-space cutout border). Stepped retro frame cycles replace disjointed sine-wave float.
- **Telegraphing**: When an opponent prepares an attack, their silhouette flashes crimson (`#ff2222`) for $0.4\text{s}$, giving the player a clear visual window to block or dodge.
- **Drug High Effect**: When boosted, characters gain an electric cyan aura (`ctx.shadowColor = '#00ffff'`, `ctx.shadowBlur = 14`).
- **Hit Sparks**: Square pixel debris particles flying radially on impact (`3x3` pixel rectangles with gravity).

---

## 5. Character Evolution & Diverse Opponents

### Character Evolution Between Gameplay Instances
1. **Debt Collection (Age 18 - Enforcer Trainee)**:
   - Upright, athletic martial arts posture.
   - Hooded sweatshirt with pouch, denim jeans, sneakers, sturdy frame with clean limb separation.
2. **Thieves Stage (Age 19 - Strung-Out Getaway)**:
   - Visibly gaunt and emaciated (torso width reduced by ~30%).
   - Tattered ragged coat shreds fluttering behind the runner.
   - Wild, unkempt jagged pixel hair.
   - Desperate forward-hunched running gait, clutching chest in cardiovascular agony.

### Diverse Opponent Silhouettes (Shadow Fighter)
1. **Corner Store Owner**:
   - Stocky, rounded silhouette with apron (cutout straps).
   - Bald top with side hair tufts; holds a defensive cane/broom.
2. **Underground Gambler**:
   - Slick fedora hat and long trench coat with flared split tails.
   - Armed with an iron pipe; glowing cigarette ember spark (`#ff4400`) at lip.
3. **Rogue Warehouse Bouncer**:
   - Massive broad-shouldered frame ($1.45\times$ scale).
   - Spiked shoulder pads, combat boots, and a tall mohawk hairstyle.

---

## 6. Modal & Dossier Dialogs

- **Backdrop**: Semi-transparent dark wash (`rgba(0, 0, 0, 0.88)`) with slight backdrop blur, overlaying the full CRT screen viewport (`inset: 0`).
- **Dialog Border**: Heavy $3\text{px}$ warning or accent border with double drop shadows.
- **Statistic Callouts**:
  - High-visibility oversized digits (`20px - 24px`) in `'Press Start 2P'`.
  - Color-coded indicator tags (`danger-badge`, `warning-badge`, `alert-badge`, `accent-badge`).
  - Terminal body descriptions in `'VT323'` font with high contrast and readable line heights.
- **Micro-Interactions**:
  - Animated warning pulse badge.
  - Subtle synthesizer sound clicks on open and dismiss.

---

## 7. Obstacle Aesthetics, Boost Sparks & Sluggish Crash Effects

### 6 Procedural Urban Obstacle Archetypes
1. **Dumpster (`jump_bin`)**: Solid container silhouette with top lid lip (`#ffb703`), vertical stiffening ribs, and hazard center stripe.
2. **Security Fence (`jump_fence`)**: Tall chainlink perimeter with upright support posts, cross-mesh lattice (`#224422`), and barbed wire prongs.
3. **Overhead Pipe (`slide_pipe`)**: Industrial drainage conduit suspended overhead with pipe flanges and glowing toxic drip drops (`#00ff88`).
4. **Overhead Beam (`slide_beam`)**: Structural steel girder with alternating caution yellow/black diagonal warning stripes (`#ffd166`).
5. **Chemical Barrels (`jump_barrels`)**: Twin stacked steel barrels with biohazard warning bands and seam ribs.
6. **AC Ventilation Unit (`jump_ac_vent`)**: Rooftop air conditioning condenser with cooling fan intake louvers and side exhaust elbow tube.

### Drug Surge Obstacle Shattering
- When boosted, obstacles shattered on contact disperse into four exploding fragment blocks (`#00ffff`) coupled with 16 radial cyan spark particles.

### Sluggish Crash Visual Language
1. **Dual Ghost Trails**: Lagging silhouette after-images drawn behind the player at $18\text{px}$ ($\alpha = 0.35$) and $34\text{px}$ ($\alpha = 0.18$) offsets in fatigued brownish tone (`#3a2710`), visually communicating delayed neuromuscular response.
2. **Pulsating Amber CRT Overlay**: Dynamic canvas wash (`rgba(180, 95, 10, alpha)`) pulsating at $0.12\text{Hz}$ across the screen.
3. **On-Canvas Alert Banners**: Framed high-visibility HUD alert (`rgba(30, 18, 5, 0.88)` with blinking `#ffb703` border) warning `💤 CRASHING // SPEED -50% & REFLEXES COMPROMISED`.

---

## 8. UI Ergonomics & Screen Real Estate

- **Maximum Screen Allocation**:
  - The CRT bezel frame minimizes dead space with a slim 24px top header, eliminating faux-cabinet decorative noise (vents, speaker dots, flashing power LEDs).
- **Single-Line Status Ribbon**:
  - Global status meters are packed into a streamlined 28px horizontal ribbon (`.status-ribbon`) with micro-meters and badge pills.
- **Contextual HUD Mounting**:
  - `StatusBar` renders strictly during `STORY` mode. Minigames (`ShadowFighter` and `ParkourRunner`) render their own integrated HUDs, avoiding overlapping duplicate health bars or duplicate drug buttons.
- **Clean Canvas Badging**:
  - In-game alerts and warnings use compact top-centered canvas badges ($240\text{px} \times 24\text{px}$) rather than massive full-width blocking overlays.
- **Elimination of UI Clutter**:
  - Developer node IDs, redundant instructional banners, and nested box borders are removed to ensure a clean, comfortable retro gaming experience.

---

## 9. Bad Ending Climax: Full-Screen Catastrophic Flicker & Cinematic Visuals

- **Screen Heartbeat Shockwaves (`.screen-heartbeat-jolt`)**:
  - Full-screen scale expansion (`1.025`) and deep red emergency vignette flare (`rgba(255, 0, 0, 0.85)`) on each accelerated cardiac spike.
- **Catastrophic Phosphor Flicker (`.screen-catastrophic-flicker`)**:
  - High-intensity phosphor instability cycling through $0.22\text{s}$ step keyframes with severe contrast surges ($350\%$), color inversions, skewing, and blackouts.
- **Scanline Tearing & Whiteout Strobes (`.fullscreen-scanline-tear`, `.strobe-whiteout`)**:
  - Glowing cyan/crimson horizontal glitch bar ripping vertically across the viewport.
  - Blinding white flashouts triggering on neurological memory switches.
- **Cinematic Centered Flashback Overlay (`.cinematic-memory-overlay`)**:
  - Translucent dark card ($90\%$ screen width) framed by double hazard borders with glowing text ($28\text{px}$) and dual-color chromatic aberration (`text-shadow: -3px 0 #ff0055, 3px 0 #00ffff`).
- **High-Voltage CRT Implosion (`.tv-power-off`)**:
  - Extreme horizontal beam squash into a brilliant white laser line with phosphor halo bloom (`box-shadow: 0 0 60px #fff`), snapping to a glowing point before extinguishing into total blackout.
