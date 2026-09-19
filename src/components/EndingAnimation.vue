<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { resetGame, openStatsModal } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let heartbeatInterval: number | null = null;
let memInterval: number | null = null;
let microStrobeInterval: number | null = null;

// Animation phases: 'heartbeat' -> 'flicker_flashbacks' -> 'flatline' -> 'epilogue'
const phase = ref<'heartbeat' | 'flicker_flashbacks' | 'flatline' | 'epilogue'>('heartbeat');

const bpm = ref(110);
const memoryFlash = ref('');
const showTvPowerOff = ref(false);
const heartbeatJolting = ref(false);
const whiteStrobe = ref(false);

const memories = [
  'AGE 16: "Just one pill to study... everybody does it."',
  'ALLOWANCE: "My weekly pocket money covers it easily."',
  'SHORTAGE: "Mom warned me that money doesn\'t grow on trees..."',
  'DEBT: "The loan shark smiled. He said he was helping me."',
  'ALLEY: "Running from police sirens on rooftop tiles..."',
  'CHEST: "My heart is bursting... I can\'t draw air..."',
];

// ECG Monitor points
let ecgX = 0;
const ecgPoints: { x: number; y: number }[] = [];

function triggerHeartbeatPulse() {
  const strength = 1.0 + (bpm.value - 110) / 100;
  soundManager.playHeartbeat(strength);
  soundManager.playGlitch();

  // Violent full-screen heartbeat shockwave jolt
  heartbeatJolting.value = true;
  window.setTimeout(() => {
    heartbeatJolting.value = false;
  }, 160);
}

function startCinematicSequence() {
  // Phase 1: Heartbeat pulse & severe tachycardia acceleration (0 to 4.5s)
  let count = 0;
  heartbeatInterval = window.setInterval(() => {
    count++;
    bpm.value = Math.min(210, bpm.value + 14);
    triggerHeartbeatPulse();

    if (count > 7 && phase.value === 'heartbeat') {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      phase.value = 'flicker_flashbacks';
      startFlickerPhase();
    }
  }, 500);
}

function startFlickerPhase() {
  // Trigger initial static burst & whiteout flash
  whiteStrobe.value = true;
  soundManager.playStaticBurst();
  window.setTimeout(() => {
    whiteStrobe.value = false;
  }, 120);

  // Micro-strobe flashes at irregular intervals for violent CRT jitter
  microStrobeInterval = window.setInterval(() => {
    if (Math.random() > 0.4) {
      whiteStrobe.value = true;
      soundManager.playGlitch();
      window.setTimeout(() => {
        whiteStrobe.value = false;
      }, 70);
    }
  }, 220);

  // Rapid flashback memory sequence
  let memIdx = 0;
  memoryFlash.value = memories[0];

  memInterval = window.setInterval(() => {
    memIdx++;
    if (memIdx < memories.length) {
      memoryFlash.value = memories[memIdx];
      soundManager.playStaticBurst();
      whiteStrobe.value = true;
      window.setTimeout(() => {
        whiteStrobe.value = false;
      }, 110);
    } else {
      if (memInterval) clearInterval(memInterval);
      if (microStrobeInterval) clearInterval(microStrobeInterval);
      triggerFlatlinePhase();
    }
  }, 850);
}

function triggerFlatlinePhase() {
  phase.value = 'flatline';
  memoryFlash.value = 'CRITICAL SYSTEM ARREST: FLATLINE';
  soundManager.startFlatline();

  // Red alert flash
  whiteStrobe.value = true;
  window.setTimeout(() => {
    whiteStrobe.value = false;
  }, 200);

  // After 2.6 seconds of flatline tone, trigger CRT TV power-off collapse
  window.setTimeout(() => {
    showTvPowerOff.value = true;
    window.setTimeout(() => {
      soundManager.stopFlatline();
      phase.value = 'epilogue';
      showTvPowerOff.value = false;
      window.setTimeout(() => {
        openStatsModal();
      }, 650);
    }, 1200);
  }, 2600);
}

// ECG Monitor Drawing
function renderECG() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const midY = h / 2;

  // Fade trail
  ctx.fillStyle = phase.value === 'flatline' ? 'rgba(20, 2, 2, 0.22)' : 'rgba(5, 10, 5, 0.18)';
  ctx.fillRect(0, 0, w, h);

  // Background Grid
  ctx.strokeStyle = phase.value === 'flatline' ? 'rgba(120, 0, 0, 0.3)' : 'rgba(0, 80, 0, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw ECG line
  ecgX = (ecgX + (phase.value === 'flicker_flashbacks' ? 6 : 4)) % w;
  let targetY = midY;

  if (phase.value === 'flatline') {
    // Endless dead flatline with subtle sensor noise
    targetY = midY + (Math.random() * 2 - 1);
  } else if (phase.value === 'flicker_flashbacks') {
    // Ventricular Fibrillation (V-Fib): chaotic, erratic dying cardiac rhythm
    targetY = midY + Math.sin(Date.now() / 30) * 70 + (Math.random() * 40 - 20);
  } else {
    // Severe Tachycardia: rapid rhythmic spikes
    const cycle = (Date.now() / (60000 / bpm.value)) % 1;
    if (cycle > 0.42 && cycle < 0.48) {
      targetY = midY - 85; // Massive QRS spike
    } else if (cycle >= 0.48 && cycle < 0.54) {
      targetY = midY + 45; // S wave dip
    } else {
      targetY = midY + (Math.random() * 8 - 4); // Jagged baseline tremor
    }
  }

  ecgPoints.push({ x: ecgX, y: targetY });
  if (ecgPoints.length > 150) ecgPoints.shift();

  // Render wave
  const strokeColor = phase.value === 'flatline' || phase.value === 'flicker_flashbacks' ? '#ff0033' : '#00ff88';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = phase.value === 'flicker_flashbacks' ? 4 : 3;
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = phase.value === 'flicker_flashbacks' ? 18 : 10;
  ctx.beginPath();
  for (let i = 0; i < ecgPoints.length; i++) {
    const pt = ecgPoints[i];
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // In flicker phase, render horizontal glitch scanlines across the canvas
  if (phase.value === 'flicker_flashbacks' && Math.random() > 0.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const randY = Math.random() * h;
    ctx.fillRect(0, randY, w, Math.random() * 6 + 2);
  }

  animationFrameId = requestAnimationFrame(renderECG);
}

onMounted(() => {
  renderECG();
  startCinematicSequence();
});

onUnmounted(() => {
  soundManager.stopFlatline();
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (memInterval) clearInterval(memInterval);
  if (microStrobeInterval) clearInterval(microStrobeInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div
    class="ending-container"
    :class="{
      'tv-power-off': showTvPowerOff,
      'screen-catastrophic-flicker': phase === 'flicker_flashbacks',
      'screen-heartbeat-jolt': heartbeatJolting,
      'screen-flatline-mode': phase === 'flatline',
    }"
  >
    <!-- Full-Screen Emergency Heartbeat Pulse Vignette -->
    <div v-if="heartbeatJolting" class="heartbeat-jolt-overlay"></div>

    <!-- Full-Screen Catastrophic CRT Phosphor Flicker & Tearing Layers -->
    <div v-if="phase === 'flicker_flashbacks'" class="fullscreen-flicker-overlay"></div>
    <div v-if="phase === 'flicker_flashbacks'" class="fullscreen-scanline-tear"></div>
    <div v-if="phase === 'flicker_flashbacks'" class="fullscreen-noise-burst"></div>

    <!-- Full-Screen Whiteout / Phosphor Flash on Memory Bursts -->
    <div v-if="whiteStrobe" class="strobe-whiteout"></div>

    <!-- Active Heartbeat & Flashback Screen -->
    <div v-if="phase !== 'epilogue'" class="monitor-screen">
      <!-- Top Monitor Status -->
      <div class="monitor-header">
        <div class="vital-tag">
          <span class="heartbeat-pulse text-danger">♥</span>
          <span class="bpm-num">{{ phase === 'flatline' ? '00' : bpm }} BPM</span>
        </div>
        <div class="status-warning" :class="phase === 'flatline' ? 'text-danger' : 'text-warning'">
          {{
            phase === 'flatline'
              ? 'ASYSTOLE // NO CARDIAC RHYTHM'
              : phase === 'flicker_flashbacks'
              ? 'VENTRICULAR FIBRILLATION // SYNAPSE SEIZURE'
              : 'SEVERE TACHYCARDIA & ARRHYTHMIA'
          }}
        </div>
      </div>

      <!-- ECG Oscilloscope Canvas -->
      <div class="canvas-wrapper">
        <canvas ref="canvasRef" width="640" height="260" class="ecg-canvas"></canvas>

        <!-- Big Centered Flashback Memories Overlay in Flicker Phase -->
        <div v-if="phase === 'flicker_flashbacks'" class="cinematic-memory-overlay">
          <div class="memory-card">
            <div class="memory-tag">
              <span class="hazard-blink">⚠</span>
              <span>NEUROLOGICAL TIMELINE FLASHBACK</span>
              <span class="hazard-blink">⚠</span>
            </div>
            <div class="memory-giant-text">{{ memoryFlash }}</div>
            <div class="memory-status-line">SYNAPSES DEPOLARIZING // PERFUSION CRITICAL</div>
          </div>
        </div>

        <!-- Big Emergency Asystole Flatline Alert Banner in Flatline Phase -->
        <div v-if="phase === 'flatline'" class="flatline-emergency-banner">
          <div class="flatline-pulse-title">⚠️ SYSTEM ASYSTOLE // 00 BPM ⚠️</div>
          <div class="flatline-sub">IRREVERSIBLE CARDIOVASCULAR COLLAPSE</div>
        </div>
      </div>

      <!-- Bottom Telemetry Status Bar -->
      <div class="telemetry-bar">
        <div class="telemetry-item">
          <span class="t-label">O2 SAT:</span>
          <span class="t-val text-danger">{{ phase === 'flatline' ? '0%' : phase === 'flicker_flashbacks' ? '41%' : '78%' }}</span>
        </div>
        <div class="telemetry-item">
          <span class="t-label">SYS/DIA:</span>
          <span class="t-val text-danger">{{ phase === 'flatline' ? '0/0' : phase === 'flicker_flashbacks' ? '240/150' : '195/125' }}</span>
        </div>
        <div class="telemetry-item">
          <span class="t-label">RHYTHM:</span>
          <span class="t-val text-danger">{{ phase === 'flatline' ? 'FLATLINE' : phase === 'flicker_flashbacks' ? 'V-FIB' : 'TACHY' }}</span>
        </div>
      </div>
    </div>

    <!-- Epilogue & Educational Message -->
    <div v-else class="epilogue-panel">
      <div class="epilogue-card">
        <div class="epilogue-badge">SYSTEM LIFE TERMINATION</div>
        <h2 class="epilogue-title">THE ILLUSION OF CONTROL</h2>

        <div class="epilogue-body">
          <p>
            Addiction begins with rationalizations: <em>"Just once."</em> <em>"Allowance covers it."</em> <em>"I can stop anytime."</em>
          </p>
          <p>
            As tolerance escalates, debt, syndicates, and crime follow. In the end, the chemical promise takes everything.
          </p>
        </div>

        <div class="resource-box">
          <div class="res-title">SINGAPORE ANTI-DRUG RESOURCES:</div>
          <div class="res-item">📞 CNB 24/7 Hotline: 1800-325-6666 (Toll-Free, Confidential)</div>
          <div class="res-item">🏥 NAMS Clinic (IMH): 6732-6837 (All-Addictions Helpline)</div>
          <div class="res-item">💬 Samaritans of Singapore (SOS): 1767 (24/7 Crisis Support)</div>
        </div>

        <div class="epilogue-actions">
          <button class="retro-btn stats-btn" @click="openStatsModal">
            📊 VIEW CRISIS STATISTICS
          </button>
          <button class="retro-btn restart-btn" @click="resetGame">
            ↺ RESTART LIFE SIMULATION
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ending-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #020402;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

/* Screen Mode Modifiers */
.screen-flatline-mode {
  background: #0d0003;
  box-shadow: inset 0 0 80px rgba(255, 0, 0, 0.4);
}

/* Full-Screen Overlays */
.heartbeat-jolt-overlay {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(255, 0, 0, 0.85);
  background: rgba(255, 0, 0, 0.15);
  pointer-events: none;
  z-index: 90;
  animation: joltFade 0.18s ease-out forwards;
}

@keyframes joltFade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.strobe-whiteout {
  position: absolute;
  inset: 0;
  background: #ffffff;
  pointer-events: none;
  z-index: 120;
  animation: strobeFade 0.15s ease-out forwards;
}

@keyframes strobeFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

.fullscreen-flicker-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.4) 0px,
    rgba(0, 0, 0, 0.4) 2px,
    rgba(255, 255, 255, 0.12) 2px,
    rgba(255, 255, 255, 0.12) 4px
  );
  mix-blend-mode: overlay;
}

.fullscreen-scanline-tear {
  position: absolute;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 85;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 0 20px #00ffff, 0 0 35px #ff0055;
  mix-blend-mode: screen;
  animation: scanlineTearMove 0.35s linear infinite;
}

@keyframes scanlineTearMove {
  0% {
    top: -10%;
    height: 14px;
    opacity: 0.9;
  }
  40% {
    height: 38px;
    opacity: 1;
    transform: scaleY(1.4);
  }
  100% {
    top: 110%;
    height: 8px;
    opacity: 0.3;
  }
}

.fullscreen-noise-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 75;
  background: radial-gradient(circle, rgba(255, 0, 80, 0.35) 0%, rgba(0, 0, 0, 0.7) 100%);
  animation: noiseBurstPulse 0.18s infinite alternate;
}

@keyframes noiseBurstPulse {
  0% { opacity: 0.3; transform: scale(1); }
  100% { opacity: 0.85; transform: scale(1.02); }
}

/* Monitor Screen */
.monitor-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 3px solid var(--retro-danger);
  background: #000;
  padding: 10px;
  min-height: 0;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed var(--retro-danger);
  padding-bottom: 6px;
}

.vital-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
}

.text-danger {
  color: var(--retro-danger);
}

.text-warning {
  color: var(--retro-warning);
}

.status-warning {
  font-size: 9px;
  letter-spacing: 1px;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #030803;
  border: 2px solid #003311;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.ecg-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Cinematic Flashback Memory Overlay (Bigger, Centered, Dramatic) */
.cinematic-memory-overlay {
  position: absolute;
  inset: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.memory-card {
  background: rgba(10, 0, 0, 0.92);
  border: 3px solid var(--retro-danger);
  box-shadow: 0 0 30px rgba(255, 0, 50, 0.8), inset 0 0 20px rgba(255, 0, 0, 0.4);
  padding: 20px 24px;
  max-width: 580px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: memoryCardPop 0.15s ease-out;
}

@keyframes memoryCardPop {
  0% { transform: scale(0.92); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.memory-tag {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--retro-warning);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
}

.hazard-blink {
  animation: heartPulse 0.4s infinite;
  color: var(--retro-danger);
}

.memory-giant-text {
  font-family: var(--font-terminal);
  font-size: 28px;
  line-height: 1.3;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: -3px 0 #ff0055, 3px 0 #00ffff, 0 0 15px rgba(255, 255, 255, 0.8);
  padding: 4px 0;
}

.memory-status-line {
  font-size: 8px;
  letter-spacing: 1.5px;
  color: #ff858d;
}

/* Flatline Emergency Banner */
.flatline-emergency-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 0, 0, 0.94);
  border: 2px solid var(--retro-danger);
  box-shadow: 0 0 25px rgba(255, 0, 0, 0.9);
  padding: 10px 20px;
  text-align: center;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: flatlineBannerPulse 0.4s infinite alternate;
}

@keyframes flatlineBannerPulse {
  0% { border-color: var(--retro-danger); box-shadow: 0 0 15px rgba(255, 0, 0, 0.5); }
  100% { border-color: #ffffff; box-shadow: 0 0 35px rgba(255, 255, 255, 0.8); }
}

.flatline-pulse-title {
  font-size: 11px;
  color: var(--retro-danger);
  letter-spacing: 1px;
  font-weight: bold;
}

.flatline-sub {
  font-size: 8px;
  color: var(--retro-warning);
  letter-spacing: 1px;
}

/* Telemetry Bar */
.telemetry-bar {
  display: flex;
  justify-content: space-around;
  background: #080202;
  border: 1px solid var(--retro-danger);
  padding: 6px;
  font-size: 9px;
  letter-spacing: 1px;
}

.telemetry-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.t-label {
  color: #888;
}

.t-val {
  font-weight: bold;
}

/* Epilogue Panel */
.epilogue-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  padding: 16px;
  overflow-y: auto;
}

.epilogue-card {
  background: var(--retro-bg-dark);
  border: 3px solid var(--retro-accent);
  padding: 24px;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
}

.epilogue-badge {
  font-size: 10px;
  color: var(--retro-danger);
  letter-spacing: 2px;
}

.epilogue-title {
  font-size: 18px;
  color: var(--retro-warning);
}

.epilogue-body {
  font-family: var(--font-terminal);
  font-size: 19px;
  line-height: 1.5;
  color: var(--retro-text-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.resource-box {
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-accent);
  padding: 12px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 10px;
}

.res-title {
  color: var(--retro-warning);
  font-weight: bold;
}

.epilogue-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.stats-btn {
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-warning);
  color: var(--retro-warning);
  padding: 12px;
  font-size: 11px;
}

.stats-btn:hover {
  background: var(--retro-warning);
  color: #000;
}

.restart-btn {
  padding: 12px;
  font-size: 11px;
}
</style>
