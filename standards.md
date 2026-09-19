# Development Standards & Architecture

## Philosophy: "Less is More"

This project is built on the principle of **radical minimalism**: maximizing narrative impact and gameplay fluidity while minimizing code footprint, asset bloat, and runtime overhead.

---

## 1. Zero-Asset Dependency Rule

1. **No External Images / Spritesheets**:
   - All character models, obstacles, and environments must be drawn procedurally on HTML5 Canvas using vector primitives (`fillRect`, `arc`, `ellipse`, `beginPath`).
   - Visual aesthetics rely on high-contrast silhouettes (inspired by *Shadow Fight* and *Limbo*), eliminating the need for PNG/SVG sprite sheets or texture atlases.
2. **No External Audio Files (`.mp3`, `.wav`)**:
   - All sound effects (punches, kicks, jumps, slides, sirens, sub-bass heartbeats, and flatline monitors) are synthesized programmatically via the native **Web Audio API** in `src/audio/SoundManager.ts`.
   - Zero HTTP requests for audio assets; instant audio playback with zero loading latency.

---

## 2. Codebase & Language Standards

### TypeScript Standards
- **Strict Mode**: No `any` types. All domain entities, minigame actions, and story branches must have explicit interfaces or discriminated unions.
- **Discriminated Unions for Triggers**:
  ```typescript
  export type ActionTrigger = 
    | { type: 'FIGHT'; level: 1 | 2 | 3 }
    | { type: 'ROB'; level: 1 | 2 | 3 }
    | { type: 'CINEMATIC' };
  ```
- **Declarative Lookups Over Nested Conditionals**:
  Avoid deep `switch-case` or cascading `if-else` chains. Prefer typed dictionary mappings:
  ```typescript
  const FIGHT_OUTCOMES: Record<number, { next: string; log: string }> = { ... };
  ```

### Vue 3 Composition API
- **Single Source of Truth**: Centralize narrative state, player stats, and inventory in `src/state/useGameState.ts`.
- **Factory Defaults**: Always use a factory function (`defaultStats()`) for initial state so resets do not duplicate object literals.
- **Component Separation**:
  - `StoryLog.vue`: BitLife text decisions & life log.
  - `ShadowFighter.vue`: Debt collection silhouette combat.
  - `ParkourRunner.vue`: Thieves stage procedural platformer.
  - `EndingAnimation.vue`: CRT oscilloscope, heartbeat pulse, and educational epilogue.
  - `CRTFrame.vue` & `StatusBar.vue`: Persistent retro frame and HUD.

---

## 3. Canvas & Game Loop Standards

1. **Single RAF Loop Per Component**:
   Each active minigame component owns exactly one `requestAnimationFrame` loop.
2. **Mandatory Lifecycle Teardown**:
   All canvas loops, keyboard listeners (`window.addEventListener`), and timer intervals must be explicitly cancelled and disconnected in `onUnmounted()`.
3. **Responsive Scaling**:
   Canvas elements use fixed internal coordinate spaces (e.g. `640x380`) with CSS `object-fit: cover` and `width: 100%`, preserving pixel ratios on both mobile and desktop.

---

## 4. Audio Synthesis Standards

1. **Browser Autoplay Compliance**:
   `AudioContext` initialization and resumption are deferred until the first user click/interaction.
2. **Clean Tone & Noise Helpers**:
   All audio effects build upon reusable primitives (`playTone`, `playNoise`) with automatic exponential gain ramp-downs to prevent speaker popping or clicks.
3. **Continuous Audio Lifecycle**:
   Standing oscillators (such as the flatline tone or siren intervals) must provide idempotent stop handlers (`stopSirens()`, `stopFlatline()`).

---

## 5. UI Design Rule: No Numerical Counts

1. **Visual State Over Numbers**:
   Avoid raw numerical counters in HUDs and story choices (e.g. avoid `Tripped: 1/3`, `Doses: x2`, `Target 1`, `Robbery 2`, `85% HP`).
2. **Qualitative & Meter-Based Feedback**:
   Represent player condition using color-coded status badges (`NOMINAL`, `VULNERABLE`, `CRITICAL`), retro visual progress bars, and thematic stage names (`CORNER GROCERY`, `GAMBLING DEN`, `ALLEYWAY SPRINT`).

---

## 6. Narrative Economy & Escalation Mechanics

1. **Compounding Predatory Debt**:
   Any outstanding loan shark debt must automatically compound with interest on every player decision, simulating extortionate loan sharks.
2. **Dynamic Substance Inflation**:
   Drug acquisition cost is not static—it dynamically increases with the player's tolerance and addiction levels, driving the player deeper into financial desperation.

