<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, onRobComplete, triggerDrugBoost } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

// Level configurations (extended, tense escapes)
const robConfigs = [
  {
    level: 1,
    title: 'GETAWAY // RAIN-SLICKED ALLEYWAYS',
    targetDistance: 950,
    speed: 4.8,
    decayMultiplier: 0.8,
    subtitle: 'Escape local patrol through back alleys.',
  },
  {
    level: 2,
    title: 'GETAWAY // PENTHOUSE ROOFTOPS',
    targetDistance: 1400,
    speed: 5.4,
    decayMultiplier: 1.4,
    subtitle: 'Stolen cash in hand. Severe chest tightness.',
  },
  {
    level: 3,
    title: 'GETAWAY // CRANE ESCAPE CLIMAX',
    targetDistance: 1900,
    speed: 6.0,
    decayMultiplier: 2.0,
    subtitle: 'Sirens everywhere! Running on fumes and adrenaline.',
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

// Diverse Runner obstacles
interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'jump_bin' | 'jump_fence' | 'slide_pipe' | 'slide_beam' | 'jump_barrels' | 'jump_ac_vent';
  hit: boolean;
  shattered?: boolean;
}

let obstacles: Obstacle[] = [];
let nextObstacleDistance = 160;

// Particle system for boosted obstacle shattering
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
let sparks: Spark[] = [];

function spawnObstacleImmunitySparks(x: number, y: number) {
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 5;
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1,
      life: 16 + Math.random() * 8,
      color: '#00ffff',
    });
  }
}

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

// Player controls with evident sluggish responsiveness
function handleJump() {
  if (runOver.value) return;
  if (isGrounded.value && !isSliding.value) {
    // Evident sluggish penalty: 30% jump power cut makes leaps heavy and strained
    const boostMult = state.stats.boostActive ? 1.25 : state.stats.sluggishTimer > 0 ? 0.70 : 1.0;
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
    // Sluggish crash locks player in slide recovery longer (48 frames vs 35)
    slideTimer = state.stats.sluggishTimer > 0 ? 48 : 35;
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

// Spawning obstacles with 6 diverse urban hazard archetypes
function spawnObstacle() {
  const types: Obstacle['type'][] = [
    'jump_bin',
    'jump_fence',
    'slide_pipe',
    'slide_beam',
    'jump_barrels',
    'jump_ac_vent',
  ];
  const chosenType = types[Math.floor(Math.random() * types.length)];

  let width = 32;
  let height = 38;

  if (chosenType === 'jump_fence') {
    width = 22;
    height = 50;
  } else if (chosenType === 'slide_pipe') {
    width = 40;
    height = 58;
  } else if (chosenType === 'slide_beam') {
    width = 54;
    height = 64;
  } else if (chosenType === 'jump_barrels') {
    width = 46;
    height = 36;
  } else if (chosenType === 'jump_ac_vent') {
    width = 36;
    height = 42;
  }

  obstacles.push({
    x: 680,
    width,
    height,
    type: chosenType,
    hit: false,
  });
}

function drawObstacleGraphic(ctx: CanvasRenderingContext2D, obs: Obstacle, obsY: number) {
  const x = obs.x;
  const y = obsY;
  const w = obs.width;
  const h = obs.height;

  if (obs.shattered) {
    // Boosted immunity: Shattered debris fragments expanding outward
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(x - 8, y + 6, 8, 6);
    ctx.fillRect(x + w + 2, y + 14, 10, 6);
    ctx.fillRect(x + Math.floor(w / 2) - 4, y - 8, 8, 8);
    ctx.fillRect(x + 4, y + h - 6, 8, 6);
    return;
  }

  // Base obstacle silhouette
  ctx.fillStyle = obs.hit ? '#ff3333' : '#030603';
  ctx.fillRect(x, y, w, h);

  // Type-specific distinct visual details
  if (obs.type === 'jump_bin') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x - 2, y, w + 4, 4); // Lid lip
    ctx.fillStyle = '#1c2e1c';
    ctx.fillRect(x + 6, y + 8, 4, h - 12); // Rib 1
    ctx.fillRect(x + w - 10, y + 8, 4, h - 12); // Rib 2
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x + Math.floor(w / 2) - 4, y + 14, 8, 4); // Hazard marking
  } else if (obs.type === 'jump_fence') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x + 2, y, 4, h); // Left post
    ctx.fillRect(x + w - 6, y, 4, h); // Right post
    // Top barbed wire prongs
    ctx.fillRect(x - 2, y - 4, 6, 4);
    ctx.fillRect(x + w - 4, y - 4, 6, 4);
    // Wire grid
    ctx.fillStyle = '#224422';
    ctx.fillRect(x + 4, y + 14, w - 8, 2);
    ctx.fillRect(x + 4, y + 28, w - 8, 2);
    ctx.fillRect(x + 4, y + 40, w - 8, 2);
  } else if (obs.type === 'slide_pipe') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x - 3, y + h - 6, w + 6, 6); // Bottom pipe flange
    ctx.fillStyle = '#1b381b';
    ctx.fillRect(x + 6, y, w - 12, h); // Pipe body
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(x + Math.floor(w / 2) - 2, y + h + 2, 4, 6); // Dripping chemical
  } else if (obs.type === 'slide_beam') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x - 4, y + h - 8, w + 8, 8); // Flange
    for (let bx = x; bx < x + w; bx += 12) {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(bx, y + h - 6, 6, 4); // Alternating caution stripes
    }
    ctx.fillStyle = '#081408';
    ctx.fillRect(x + Math.floor(w / 2) - 4, y, 8, h - 8); // Vertical girder
  } else if (obs.type === 'jump_barrels') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x + 2, y, Math.floor(w / 2) - 4, 4); // Left drum rim
    ctx.fillRect(x + Math.floor(w / 2) + 2, y + 4, Math.floor(w / 2) - 4, 4); // Right drum rim
    ctx.fillRect(x + 4, y + 14, Math.floor(w / 2) - 8, 4); // Left biohazard stripe
    ctx.fillRect(x + Math.floor(w / 2) + 4, y + 18, Math.floor(w / 2) - 8, 4); // Right biohazard stripe
    ctx.fillStyle = '#1c301c';
    ctx.fillRect(x + 2, y + 26, w - 4, 3); // Metal barrel seam
  } else if (obs.type === 'jump_ac_vent') {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x + 4, y + 4, w - 8, 3); // AC rim
    ctx.fillStyle = '#152b15';
    for (let vy = y + 12; vy < y + h - 6; vy += 6) {
      ctx.fillRect(x + 6, vy, w - 12, 3); // Fan slats
    }
    ctx.fillStyle = '#061006';
    ctx.fillRect(x + w - 6, y - 4, 6, 12); // Exhaust pipe
  }
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

  // Calculate speed with drug boost and evident sluggish crash
  let currentSpeed = currentConfig.value.speed;
  if (state.stats.boostActive) currentSpeed *= 1.35;
  // Very evident sluggish slowdown: 50% severe speed reduction
  if (state.stats.sluggishTimer > 0) currentSpeed *= 0.50;

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

  // Obstacle Spawner (dense, continuous rhythm for longer escapes)
  if (!runOver.value) {
    nextObstacleDistance -= currentSpeed;
    if (nextObstacleDistance <= 0) {
      spawnObstacle();
      nextObstacleDistance = 170 + Math.random() * 190;
    }
  }

  // Update & Draw Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (!runOver.value) obs.x -= currentSpeed;

    // Obstacle Y position
    let obsY = groundY + 40 - obs.height;
    if (obs.type === 'slide_pipe') {
      obsY = groundY - 10; // overhead pipe
    } else if (obs.type === 'slide_beam') {
      obsY = groundY - 14; // overhead beam
    }

    // Draw stylized obstacle
    drawObstacleGraphic(ctx, obs, obsY);

    // Collision Detection
    if (!obs.hit && !runOver.value) {
      const playerBoxX = 140;
      const playerBoxW = isSliding.value ? 45 : 24;
      const playerBoxY = playerY.value;
      const playerBoxH = isSliding.value ? 22 : 44;

      const collidesX = obs.x < playerBoxX + playerBoxW && obs.x + obs.width > playerBoxX;
      const collidesY = obsY < playerBoxY + playerBoxH && obsY + obs.height > playerBoxY;

      if (collidesX && collidesY) {
        if (state.stats.boostActive) {
          // DRUG BOOST OBSTACLE IMMUNITY: Shatter through obstacle with 0 damage/stamina penalty
          obs.hit = true;
          obs.shattered = true;
          soundManager.playBlock();
          spawnObstacleImmunitySparks(obs.x + Math.floor(obs.width / 2), obsY + Math.floor(obs.height / 2));
        } else {
          // Normal obstacle hit
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
    }

    if (obs.x + obs.width < -50) {
      obstacles.splice(i, 1);
    }
  }

  // Render Boost Sparks Particle System
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.25;
    s.life--;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, 3, 3);
    if (s.life <= 0) sparks.splice(i, 1);
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

  // Render Sluggish Ghost After-Images (evident visual brain-fog / lag)
  if (state.stats.sluggishTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    drawSilhouetteRunner(ctx, 122, playerY.value + 40, isGrounded.value, isSliding.value, false, true);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18;
    drawSilhouetteRunner(ctx, 106, playerY.value + 40, isGrounded.value, isSliding.value, false, true);
    ctx.restore();
  }

  // Draw Player Silhouette Runner
  drawSilhouetteRunner(
    ctx, 
    140, 
    playerY.value + 40, 
    isGrounded.value, 
    isSliding.value, 
    state.stats.boostActive,
    state.stats.sluggishTimer > 0
  );

  // Evident Sluggish Crash Amber Wash
  if (state.stats.sluggishTimer > 0) {
    const sluggishAlpha = 0.22 + Math.sin(runFrameCount * 0.12) * 0.08;
    ctx.fillStyle = `rgba(180, 95, 10, ${sluggishAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Evident On-Canvas Status Banners
  if (state.stats.boostActive) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 25, 0.88)';
    ctx.fillRect(Math.floor(width / 2) - 180, 10, 360, 26);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.floor(width / 2) - 180, 10, 360, 26);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ CHEMICAL SURGE ACTIVE // 100% OBSTACLE IMMUNITY', Math.floor(width / 2), 27);
    ctx.restore();
  } else if (state.stats.sluggishTimer > 0) {
    ctx.save();
    const pulseColor = Math.sin(runFrameCount * 0.15) > 0 ? '#ffb703' : '#e63946';
    ctx.fillStyle = 'rgba(30, 18, 5, 0.88)';
    ctx.fillRect(Math.floor(width / 2) - 195, 10, 390, 26);
    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.floor(width / 2) - 195, 10, 390, 26);
    ctx.fillStyle = pulseColor;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💤 CRASHING // SPEED -50% & REFLEXES COMPROMISED', Math.floor(width / 2), 27);
    ctx.restore();
  }

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

// Stylized Gaunt Silhouette Runner (Age 19, addicted, ragged clothes, transparent limb borders & pixel blocks)
function drawSilhouetteRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  footY: number,
  grounded: boolean,
  sliding: boolean,
  boosted: boolean,
  isSluggish: boolean = false
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));

  if (boosted) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
  }

  // Background cutout color used for transparent separation borders between overlapping limbs
  const cutoutColor = state.currentRobLevel === 3 ? '#080511' : '#0a140d';
  const silColor = isSluggish ? '#3a2710' : '#020502';

  // Helper to draw pixelated rect with transparent cutout border
  const drawPixelBlock = (rx: number, ry: number, rw: number, rh: number, withBorder = false) => {
    const px = Math.round(rx);
    const py = Math.round(ry);
    const pw = Math.round(rw);
    const ph = Math.round(rh);

    if (withBorder) {
      ctx.fillStyle = cutoutColor;
      ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    }
    ctx.fillStyle = silColor;
    ctx.fillRect(px, py, pw, ph);
  };

  if (sliding) {
    // Merged low-profile slide block: unified torso + head + arm
    drawPixelBlock(0, -18, 48, 14);
    drawPixelBlock(40, -22, 10, 8); // Head forward
    drawPixelBlock(8, -14, 18, 6, true); // Trailing arm cutout
    ctx.fillStyle = '#445544';
    ctx.fillRect(-10, -4, 6, 4); // Friction dust
  } else if (!grounded) {
    // Merged airborne leap silhouette: unified tucked body mass + single reaching arm
    // Unified body mass (head + gaunt torso + tucked knees)
    drawPixelBlock(0, -56, 18, 46);
    drawPixelBlock(6, -62, 10, 8); // Jagged head contour
    drawPixelBlock(-6, -42, 8, 12); // Tattered coat flare
    // Consolidated reaching arm with transparent border
    drawPixelBlock(10, -44, 16, 9, true);
  } else {
    // Merged running silhouette: 2-step retro stride (reduced moving parts)
    const step = Math.floor((runFrameCount / 6) % 2);
    const torsoBob = step === 0 ? 0 : 3;

    // Hunched forward angle (physical agony)
    ctx.rotate(0.08);

    const torsoY = -48 + torsoBob;

    // 1. CONSOLIDATED LEGS: Stepped retro stride (attached solidly to hip)
    if (step === 0) {
      // Scissor stride pose (grounded stance base with clean separation)
      drawPixelBlock(-8, torsoY + 26, 26, 20);
      ctx.fillStyle = cutoutColor;
      ctx.fillRect(2, torsoY + 28, 4, 18); // Leg separation slit
    } else {
      // Passing stride pose (compact single leg pillar)
      drawPixelBlock(-2, torsoY + 26, 16, 20);
    }

    // 2. CONSOLIDATED UPPER BODY: Merged head + gaunt torso + ragged coat tail
    drawPixelBlock(0, torsoY - 8, 16, 36);   // Unified gaunt torso
    drawPixelBlock(4, torsoY - 18, 12, 12);  // Head contour
    drawPixelBlock(0, torsoY - 22, 8, 6);    // Wild jagged hair crest
    drawPixelBlock(-8, torsoY + 12, 10, 14); // Ragged coat tail

    // 3. CONSOLIDATED ARM: Single solid arm clutching chest with transparent cutout border
    drawPixelBlock(4, torsoY + 4, 14, 10, true);
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
          <span>GETAWAY ROUTE</span>
          <span 
            class="hits-label"
            :class="{
              'boost-label': state.stats.boostActive,
              'sluggish-label': state.stats.sluggishTimer > 0 && !state.stats.boostActive
            }"
          >
            <template v-if="state.stats.boostActive">⚡ SURGE ACTIVE // 100% IMMUNITY</template>
            <template v-else-if="state.stats.sluggishTimer > 0">💤 CRASH ACTIVE // SLUGGISH SLOWDOWN</template>
            <template v-else>STATUS: {{ hitCount === 0 ? 'STEADY' : hitCount === 1 ? 'VULNERABLE' : 'CRITICAL' }}</template>
          </span>
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
          <div class="result-title text-success">ESCAPE SUCCESSFUL</div>
          <p class="result-desc">You slipped past the pursuit with the cash into the next borough.</p>
          <button class="retro-btn" @click="finishRun">
            PROCEED TO NEXT STAGE ➔
          </button>
        </template>
        <template v-else>
          <div class="result-title text-danger">BODY COLLAPSE</div>
          <p class="result-desc">
            Your drug-weakened body and failing stamina gave out. You collapsed on the concrete.
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
          ⚡ DRUG BOOST
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
  font-weight: bold;
}

.boost-label {
  color: #00ffff !important;
}

.sluggish-label {
  color: #ffb703 !important;
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
