<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, onRobComplete, triggerDrugBoost } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

// Level configurations
const robConfigs = [
  {
    level: 1,
    title: 'ROBBERY 1 // ALLEYWAY BAG SNATCH',
    targetDistance: 400,
    speed: 4.8,
    decayMultiplier: 1.0,
    subtitle: 'Escape the local patrol through back alleys.',
  },
  {
    level: 2,
    title: 'ROBBERY 2 // PENTHOUSE ROOFTOP RUN',
    targetDistance: 550,
    speed: 5.5,
    decayMultiplier: 1.8,
    subtitle: 'Stolen jewelry in hand. Severe chest tightness.',
  },
  {
    level: 3,
    title: 'ROBBERY 3 // HELICOPTER SPOTLIGHT CLIMAX',
    targetDistance: 700,
    speed: 6.2,
    decayMultiplier: 2.8,
    subtitle: 'Sirens everywhere! Running on fumes and pure adrenaline.',
  },
];

const currentConfig = computed(() => {
  const idx = Math.min(2, Math.max(0, state.currentRobLevel - 1));
  return robConfigs[idx];
});

// Distance traveled
const distanceTraveled = ref(0);
const progressPercent = computed(() => {
  return Math.min(100, Math.round((distanceTraveled.value / currentConfig.value.targetDistance) * 100));
});

// Runner physics & state
const playerY = ref(250);
const playerVY = ref(0);
const isGrounded = ref(true);
const isSliding = ref(false);
let slideTimer = 0;
const groundY = 250;
const gravity = 0.65;
const jumpStrength = -13.5;

// Hit points & stamina
const hitCount = ref(0);
const maxHits = 3;
const stamina = ref(100);

// Runner obstacles
interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'jump_bin' | 'jump_fence' | 'slide_pipe';
  hit: boolean;
}

let obstacles: Obstacle[] = [];
let nextObstacleDistance = 180;

// Parallax background buildings
interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number }[];
}
let bgBuildingsFar: Building[] = [];
let bgBuildingsMid: Building[] = [];

// Game state
const runOver = ref(false);
const runResult = ref<'win' | 'fail' | null>(null);
let runFrameCount = 0;

// Initialize parallax buildings
function initBuildings() {
  bgBuildingsFar = [];
  bgBuildingsMid = [];

  for (let i = 0; i < 15; i++) {
    const w = 50 + Math.random() * 60;
    const h = 100 + Math.random() * 120;
    bgBuildingsFar.push({
      x: i * 80,
      w,
      h,
      windows: generateWindows(w, h),
    });
  }

  for (let i = 0; i < 12; i++) {
    const w = 60 + Math.random() * 80;
    const h = 60 + Math.random() * 90;
    bgBuildingsMid.push({
      x: i * 110,
      w,
      h,
      windows: generateWindows(w, h),
    });
  }
}

function generateWindows(w: number, h: number) {
  const list = [];
  for (let y = 20; y < h - 20; y += 18) {
    for (let x = 10; x < w - 10; x += 16) {
      if (Math.random() > 0.45) {
        list.push({ x, y });
      }
    }
  }
  return list;
}

// Player controls
function handleJump() {
  if (runOver.value) return;
  if (isGrounded.value && !isSliding.value) {
    // Sluggish penalty makes jumps lower
    const boostMult = state.stats.boostActive ? 1.25 : state.stats.sluggishTimer > 0 ? 0.8 : 1.0;
    playerVY.value = jumpStrength * boostMult;
    isGrounded.value = false;
    soundManager.playJump();
    stamina.value = Math.max(0, stamina.value - 6 * currentConfig.value.decayMultiplier);
  }
}

function handleSlide() {
  if (runOver.value) return;
  if (isGrounded.value && !isSliding.value) {
    isSliding.value = true;
    slideTimer = 35; // frames of slide
    soundManager.playSlide();
    stamina.value = Math.max(0, stamina.value - 5 * currentConfig.value.decayMultiplier);
  }
}

function handleBoost() {
  if (triggerDrugBoost()) {
    // Instantly refresh 40% stamina from the chemical rush
    stamina.value = Math.min(100, stamina.value + 40);
  }
}

function surrenderRun() {
  soundManager.playClick();
  runOver.value = true;
  runResult.value = 'fail';
  setTimeout(() => onRobComplete(false), 800);
}

function finishRun() {
  onRobComplete(runResult.value === 'win');
}

// Key listeners
function handleKeyDown(e: KeyboardEvent) {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') handleJump();
  else if (k === 's' || k === 'arrowdown') handleSlide();
  else if (e.code === 'Space') handleBoost();
}

// Spawning obstacles
function spawnObstacle() {
  const types: Obstacle['type'][] = ['jump_bin', 'jump_fence', 'slide_pipe'];
  const chosenType = types[Math.floor(Math.random() * types.length)];

  let width = 28;
  let height = 38;

  if (chosenType === 'slide_pipe') {
    width = 36;
    height = 55; // hangs overhead
  } else if (chosenType === 'jump_fence') {
    width = 24;
    height = 48;
  }

  obstacles.push({
    x: 680,
    width,
    height,
    type: chosenType,
    hit: false,
  });
}

// Main Game Loop
function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  runFrameCount++;

  // Calculate speed with drug boost and sluggish crash
  let currentSpeed = currentConfig.value.speed;
  if (state.stats.boostActive) currentSpeed *= 1.4;
  if (state.stats.sluggishTimer > 0) currentSpeed *= 0.65;

  if (!runOver.value) {
    distanceTraveled.value += currentSpeed * 0.12;

    // Physical Decay over time (noticeable in later robbery stages!)
    const drainRate = 0.04 * currentConfig.value.decayMultiplier;
    stamina.value = Math.max(0, stamina.value - drainRate);

    // If stamina hits 0, health starts draining rapidly
    if (stamina.value <= 0) {
      state.stats.health = Math.max(0, state.stats.health - 0.08);
      if (state.stats.health <= 0) {
        runOver.value = true;
        runResult.value = 'fail';
      }
    }

    // Check level completion
    if (distanceTraveled.value >= currentConfig.value.targetDistance) {
      runOver.value = true;
      runResult.value = 'win';
      soundManager.playCoin();
    }
  }

  // --- DRAWING ---

  // Clear & Sky gradient
  ctx.fillStyle = state.currentRobLevel === 3 ? '#080511' : '#0a140d';
  ctx.fillRect(0, 0, width, height);

  // Spotlight effect for Robbery 3 (Helicopter chase)
  if (state.currentRobLevel === 3) {
    const sweepAngle = Math.sin(runFrameCount * 0.03) * 150;
    const spotX = 300 + sweepAngle;
    const spotGrad = ctx.createRadialGradient(spotX, 0, 10, spotX, 260, 200);
    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(spotX, 0);
    ctx.lineTo(spotX - 100, 320);
    ctx.lineTo(spotX + 100, 320);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Parallax Far Buildings
  ctx.fillStyle = '#122416';
  for (const b of bgBuildingsFar) {
    if (!runOver.value) b.x -= currentSpeed * 0.2;
    if (b.x + b.w < 0) b.x = width + Math.random() * 40;
    ctx.fillRect(b.x, groundY - b.h + 50, b.w, b.h);

    // Windows
    ctx.fillStyle = '#ffea75';
    for (const win of b.windows) {
      ctx.fillRect(b.x + win.x, groundY - b.h + 50 + win.y, 4, 6);
    }
    ctx.fillStyle = '#122416';
  }

  // Draw Parallax Mid Buildings
  ctx.fillStyle = '#1f3a24';
  for (const b of bgBuildingsMid) {
    if (!runOver.value) b.x -= currentSpeed * 0.5;
    if (b.x + b.w < 0) b.x = width + Math.random() * 50;
    ctx.fillRect(b.x, groundY - b.h + 40, b.w, b.h);
  }

  // Rooftop / Ground Platform
  ctx.fillStyle = '#060d07';
  ctx.fillRect(0, groundY + 40, width, 120);
  ctx.fillStyle = '#306230';
  ctx.fillRect(0, groundY + 40, width, 4); // Roof edge trim

  // Obstacle Spawner
  if (!runOver.value) {
    nextObstacleDistance -= currentSpeed;
    if (nextObstacleDistance <= 0) {
      spawnObstacle();
      nextObstacleDistance = 180 + Math.random() * 220;
    }
  }

  // Update & Draw Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (!runOver.value) obs.x -= currentSpeed;

    // Obstacle Y position
    let obsY = groundY + 40 - obs.height;
    if (obs.type === 'slide_pipe') {
      obsY = groundY - 8; // overhead pipe
    }

    // Draw Obstacle Silhouette
    ctx.fillStyle = obs.hit ? '#ff3333' : '#030603';
    ctx.fillRect(obs.x, obsY, obs.width, obs.height);

    // Danger markings on obstacles
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(obs.x + 4, obsY + 4, obs.width - 8, 4);

    // Collision Detection
    if (!obs.hit && !runOver.value) {
      const playerBoxX = 140;
      const playerBoxW = isSliding.value ? 45 : 24;
      const playerBoxY = playerY.value;
      const playerBoxH = isSliding.value ? 22 : 44;

      const collidesX = obs.x < playerBoxX + playerBoxW && obs.x + obs.width > playerBoxX;
      const collidesY = obsY < playerBoxY + playerBoxH && obsY + obs.height > playerBoxY;

      if (collidesX && collidesY) {
        obs.hit = true;
        soundManager.playKick();
        soundManager.playGlitch();
        hitCount.value++;
        stamina.value = Math.max(0, stamina.value - 20);
        state.stats.health = Math.max(0, state.stats.health - 12);

        if (hitCount.value >= maxHits) {
          runOver.value = true;
          runResult.value = 'fail';
        }
      }
    }

    if (obs.x + obs.width < -50) {
      obstacles.splice(i, 1);
    }
  }

  // Update Player Physics
  if (!isGrounded.value) {
    playerVY.value += gravity;
    playerY.value += playerVY.value;

    if (playerY.value >= groundY) {
      playerY.value = groundY;
      playerVY.value = 0;
      isGrounded.value = true;
    }
  }

  if (isSliding.value) {
    slideTimer--;
    if (slideTimer <= 0) {
      isSliding.value = false;
    }
  }

  // Draw Player Silhouette Runner
  drawSilhouetteRunner(ctx, 140, playerY.value + 40, isGrounded.value, isSliding.value, state.stats.boostActive);

  // If in Robbery 3 or critical stamina: draw edge vignette decay
  if (state.currentRobLevel === 3 || stamina.value < 20) {
    const decayGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 300);
    decayGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    decayGrad.addColorStop(1, 'rgba(180, 0, 0, 0.35)');
    ctx.fillStyle = decayGrad;
    ctx.fillRect(0, 0, width, height);
  }

  animationFrameId = requestAnimationFrame(render);
}

// Silhouette Runner Rendering
function drawSilhouetteRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  footY: number,
  grounded: boolean,
  sliding: boolean,
  boosted: boolean
) {
  ctx.save();
  ctx.translate(x, footY);

  if (boosted) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
  }

  ctx.fillStyle = '#020502'; // Pitch black silhouette

  if (sliding) {
    // Sliding posture: stretched low horizontally
    ctx.fillRect(0, -18, 48, 16); // Body sliding
    ctx.beginPath();
    ctx.arc(42, -18, 9, 0, Math.PI * 2); // Head forward
    ctx.fill();
    // Smoke / friction dust
    ctx.fillStyle = '#666';
    ctx.fillRect(-10, -4, 8, 4);
  } else if (!grounded) {
    // Jump posture: legs tucked, arms angled back
    ctx.fillRect(0, -42, 20, 26); // Torso
    ctx.fillRect(-6, -20, 14, 16); // Tucked leg 1
    ctx.fillRect(10, -22, 14, 18); // Tucked leg 2
    ctx.beginPath();
    ctx.arc(10, -52, 10, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.fillRect(-8, -38, 12, 18); // Arms outstretched
  } else {
    // Running Animation: 4 frame gait
    const legPhase = Math.sin(runFrameCount * 0.35);
    const torsoBob = Math.abs(Math.sin(runFrameCount * 0.35)) * 4;

    // Torso
    const torsoY = -46 + torsoBob;
    ctx.fillRect(2, torsoY, 18, 28);

    // Head
    ctx.beginPath();
    ctx.arc(12, torsoY - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    // Legs swinging
    ctx.fillRect(4 + legPhase * 12, torsoY + 26, 8, 20 - torsoBob);
    ctx.fillRect(10 - legPhase * 12, torsoY + 26, 8, 20 - torsoBob);

    // Arms pumping
    ctx.fillRect(2 - legPhase * 10, torsoY + 6, 16, 8);
  }

  ctx.restore();
}

onMounted(() => {
  initBuildings();
  window.addEventListener('keydown', handleKeyDown);
  render();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="parkour-wrapper">
    <!-- Top Runner HUD -->
    <div class="runner-hud">
      <div class="stage-info">
        <span class="stage-title">{{ currentConfig.title }}</span>
        <span class="stage-sub">{{ currentConfig.subtitle }}</span>
      </div>

      <!-- Distance Progress -->
      <div class="distance-bar-wrapper">
        <div class="dist-header">
          <span>PROGRESS: {{ Math.round(distanceTraveled) }}m / {{ currentConfig.targetDistance }}m</span>
          <span class="hits-label">TRIPPED: {{ hitCount }} / {{ maxHits }}</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill" 
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Canvas Runner Canvas -->
    <div class="runner-canvas-box">
      <canvas 
        ref="canvasRef" 
        width="640" 
        height="320" 
        class="runner-canvas"
      ></canvas>

      <!-- Overlay Victory / Defeat Modal -->
      <div v-if="runOver" class="run-overlay">
        <template v-if="runResult === 'win'">
          <div class="result-title text-success">ROBBERY ESCAPED!</div>
          <p class="result-desc">You slipped past the pursuit with the cash into the next borough.</p>
          <button class="retro-btn" @click="finishRun">
            PROCEED TO NEXT STAGE ➔
          </button>
        </template>
        <template v-else>
          <div class="result-title text-danger">BODY COLLAPSE</div>
          <p class="result-desc">
            Your drug-weakened body and failing stamina gave out. You tripped and collapsed on the concrete.
          </p>
          <button class="retro-btn retro-btn-danger" @click="finishRun">
            VIEW THE ENDING ➔
          </button>
        </template>
      </div>
    </div>

    <!-- Runner Action Buttons & Guide -->
    <div class="runner-controls">
      <div class="controls-guide">
        <span>KEYS: [W / UP] JUMP | [S / DOWN] SLIDE | [SPACE] BOOST</span>
      </div>

      <div class="buttons-bar">
        <button 
          class="retro-btn run-btn" 
          :disabled="!isGrounded || runOver"
          @click="handleJump"
        >
          ⬆️ JUMP [W]
        </button>

        <button 
          class="retro-btn run-btn" 
          :disabled="!isGrounded || runOver"
          @click="handleSlide"
        >
          ⬇️ SLIDE [S]
        </button>

        <button 
          class="retro-btn retro-btn-warning run-btn" 
          :disabled="state.stats.doses <= 0 || state.stats.boostActive || runOver"
          @click="handleBoost"
        >
          ⚡ BOOST (x{{ state.stats.doses }})
        </button>

        <button 
          class="retro-btn retro-btn-danger surrender-btn" 
          :disabled="runOver"
          @click="surrenderRun"
          title="Stop running and collapse"
        >
          NO (COLLAPSE)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parkour-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 10px;
}

.runner-hud {
  background: var(--retro-bg-dark);
  border: 2px solid var(--retro-accent);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-title {
  color: var(--retro-warning);
  font-size: 11px;
  font-weight: bold;
}

.stage-sub {
  font-family: var(--font-terminal);
  font-size: 16px;
  opacity: 0.8;
}

.distance-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dist-header {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
}

.hits-label {
  color: var(--retro-danger);
}

.runner-canvas-box {
  position: relative;
  flex: 1;
  background: #000;
  border: 3px solid var(--retro-accent);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.runner-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.run-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  text-align: center;
  z-index: 20;
}

.result-title {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
}

.result-desc {
  font-family: var(--font-terminal);
  font-size: 18px;
  max-width: 440px;
}

.text-success {
  color: #52b788;
}

.text-danger {
  color: var(--retro-danger);
}

.runner-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.controls-guide {
  font-size: 8px;
  text-align: center;
  opacity: 0.7;
}

.buttons-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 1.2fr;
  gap: 8px;
}

.run-btn {
  padding: 12px 8px;
  font-size: 11px;
}

.surrender-btn {
  padding: 12px 8px;
  font-size: 9px;
}

@media (max-width: 600px) {
  .buttons-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
