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
   Pure CSS gradient (`linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)`) at `100% 3px` pitch.
2. **Vignette (`.crt-vignette`)**:
   Deep `inset 0 0 80px rgba(0, 0, 0, 0.8)` simulating phosphor tube curvature.
3. **Screen Glitch (`.glitch-active`)**:
   Keyframe displacement `transform: translate(-2px, 2px)` combined with contrast boost, triggered during drug boosts and the final climax.
4. **CRT Power-Off Collapse (`.tv-power-off`)**:
   Vintage television shutdown animation collapsing the screen horizontally into a razor-thin line, shrinking to a dot, and fading into pitch black.

---

## 4. Canvas Silhouette Art Direction

Both minigames (**Shadow Fighter** and **Parkour Runner**) follow strict silhouette design rules:

- **Actors**: Drawn in solid silhouette (`#020502` to `#050a05`). No facial features or internal textures—expression is conveyed purely through stance, posture, and movement.
- **Telegraphing**: When an opponent prepares an attack, their silhouette flashes crimson (`#ff2222`) for $0.4\text{s}$, giving the player a clear visual window to block or dodge.
- **Drug High Effect**: When boosted, characters gain an electric cyan aura (`ctx.shadowColor = '#00ffff'`, `ctx.shadowBlur = 12`).
- **Hit Sparks**: Square pixel debris particles flying radially on impact (`3x3` pixel rectangles with gravity).
- **Physical Decay Cues**:
  - Mild in Loan Shark stage: slight sluggishness after boost.
  - Noticeable in Thieves stage: screen edge red vignette, camera jitters, and heavy stamina depletion.
