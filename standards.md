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
4. **Merged Silhouette Blocks & Reduced Moving Parts**:
   Characters must not be composed of dozens of independently oscillating micro-blocks. Silhouettes are consolidated into 2–3 cohesive structural masses (Consolidated Upper Body, Consolidated Stance/Legs Base, and Consolidated Limb/Arm with transparent negative-space cutout borders). Motion uses authentic retro stepped keyframes rather than fractional floating sine drifts.

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

---

## 7. Educational Post-Ending Pop-Up & Singapore Real-World Statistics

1. **Reality Check Layer**:
   Following the narrative climax or storyline terminations, a dedicated modal (`CrisisStatsModal.vue`) displays official Singapore Central Narcotics Bureau (CNB) statistics highlighting the local youth substance abuse crisis.
2. **Key Singapore Impact Metrics (Concise & Punchy)**:
   - **Youth Infiltration**: **>50%** of all newly arrested drug abusers in Singapore are youths under 30 (CNB Annual Statistics).
   - **Early Onset**: Arrests recorded as young as **Age 13**, frequently lured via social media channels and peer pressure.
   - **Primary Substance**: **#1 Methamphetamine ("Ice")** remains Singapore's most abused narcotic, causing psychosis and cardiovascular collapse.
   - **Strict Legal Accountability**: **Misuse of Drugs Act (MDA)** enforces zero-tolerance with mandatory caning, DRC detention, and permanent criminal records.
3. **Confidential Singapore Helplines**:
   - **CNB Anti-Drug Hotline (24/7)**: `1800-325-6666`
   - **National Addictions Management Service (NAMS / IMH)**: `6732-6837`
   - **Samaritans of Singapore (SOS)**: `1767`
4. **Accessible & Non-Intrusive**:
   - Auto-triggers following the cinematic flatline and CRT TV reboot into the epilogue.
   - Can be reviewed anytime via persistent `[ 📊 VIEW CRISIS STATISTICS ]` action buttons in both the epilogue card and story game-over banners.

---

## 8. Narrative Progression & Automated Test Suite

1. **Robbery Stages Branching (Arrest vs. Death)**:
   - Failures and surrender choices in Robberies 1 and 2 result in apprehension and arrest by police (`ENDING_ARRESTED_STREET`).
   - Physical collapse and death are strictly reserved for the 3rd robbery stage climax (`CLIMAX_ESCAPE`), leading to the cinematic flatline sequence.
2. **Zero-Dependency Native Automated Testing**:
   - Automated tests are executed via Node.js native test runner (`npm test` / `node --test`).
   - Tests comprehensively verify story graph continuity, choice validity, robbery arrest/death routing, count prohibitions, compounding debt, and substance cost escalation.

---

## 9. Minigame Pacing, Obstacle Diversity, Boost Immunity & Evident Crash Feedback

1. **Extended Pacing & Duration**:
   - Both minigames are balanced for sustained engagement rather than instantaneous resolution:
     - **Shadow Fighter**: Opponent HP scaled to 180 (Storekeeper), 250 (Gambler), and 340 (Enforcer) with 160 Player HP, creating 30–45s bouts with rhythmic attack telegraphing and tactical blocking.
     - **Parkour Runner**: Target distances scaled to 950 (Alleyways), 1400 (Rooftops), and 1900 (Cranes), delivering 35–65s of continuous urban parkour.
2. **6 Diverse Obstacle Archetypes**:
   - Both vertical clearance (jumping) and low clearance (sliding) are mandatory:
     - `jump_bin`: Metal dumpster with reinforced lid lip and vertical ribs.
     - `jump_fence`: Security chainlink fence with barbed-wire prongs.
     - `slide_pipe`: Overhead industrial toxic pipe with flanges and dripping chemical drops.
     - `slide_beam`: Overhead structural I-beam with caution diagonal hazard stripes.
     - `jump_barrels`: Double stacked chemical drums with warning stripes.
     - `jump_ac_vent`: Rooftop ventilation condenser with cooling fan slats and exhaust elbow.
3. **100% Obstacle Immunity When Drug Boosted**:
   - When `state.stats.boostActive` is true, the player is completely impervious to obstacles:
     - 0 damage, 0 stamina penalty, 0 trip count penalties.
     - Collided obstacles shatter instantly with cyan particle spark bursts (`#00ffff`) and metallic crunch sound effects.
4. **Highly Evident Sluggish Crash Feedback**:
   - When the drug boost crashes (`state.stats.sluggishTimer > 0`), the physical degradation is unmistakable across gameplay, visuals, and UI:
     - **Parkour Runner**: Severe 50% speed cut, 30% jump height reduction (leaden/heavy jump physics), extended slide recovery (48 frames), dual lagging ghost after-images, pulsating amber CRT canvas overlay, on-canvas warning banner (`💤 CRASHING // SPEED -50% & REFLEXES COMPROMISED`), and HUD crash badge.
     - **Shadow Fighter**: 250ms–340ms windup delay before punches/kicks land, recovery lock doubled to 24–36 frames (leaving the player vulnerable), 40% damage penalty, dual lagging ghost after-images, amber CRT overlay, on-canvas warning banner, and HUD crash badge.
