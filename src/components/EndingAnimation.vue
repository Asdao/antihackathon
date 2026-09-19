<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { resetGame, openStatsModal } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let heartbeatInterval: number | null = null;

// Animation phases: 'heartbeat' -> 'flicker_flashbacks' -> 'flatline' -> 'epilogue'
const phase = ref<'heartbeat' | 'flicker_flashbacks' | 'flatline' | 'epilogue'>('heartbeat');

const bpm = ref(110);
const memoryFlash = ref('');
const showTvPowerOff = ref(false);

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
  soundManager.playHeartbeat(1.2);
  soundManager.playGlitch();
}

function startCinematicSequence() {
  // Phase 1: Heartbeat pulse & ramp up (0 to 4.5s)
  let count = 0;
  heartbeatInterval = window.setInterval(() => {
    count++;
    bpm.value = Math.min(190, bpm.value + 12);
    triggerHeartbeatPulse();

    if (count > 7 && phase.value === 'heartbeat') {
      phase.value = 'flicker_flashbacks';
      startFlickerPhase();
    }
  }, 550);
}

function startFlickerPhase() {
  // Rapid flashback sequence
  let memIdx = 0;
  const memInterval = window.setInterval(() => {
    if (memIdx < memories.length) {
      memoryFlash.value = memories[memIdx];
      soundManager.playGlitch();
      memIdx++;
    } else {
      clearInterval(memInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      triggerFlatlinePhase();
    }
  }, 750);
}

function triggerFlatlinePhase() {
  phase.value = 'flatline';
  memoryFlash.value = 'CRITICAL SYSTEM ARREST: FLATLINE';
  soundManager.startFlatline();

  // After 2.5 seconds of flatline tone, trigger CRT TV power-off collapse
  setTimeout(() => {
    showTvPowerOff.value = true;
    setTimeout(() => {
      soundManager.stopFlatline();
      phase.value = 'epilogue';
      showTvPowerOff.value = false;
      setTimeout(() => {
        openStatsModal();
      }, 650);
    }, 1200);
  }, 2200);
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
  ctx.fillStyle = 'rgba(5, 10, 5, 0.15)';
  ctx.fillRect(0, 0, w, h);

  // Background Grid
  ctx.strokeStyle = 'rgba(0, 80, 0, 0.25)';
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
  ecgX = (ecgX + 4) % w;
  let targetY = midY;

  if (phase.value === 'flatline') {
    // Flat line
    targetY = midY;
  } else {
    // Simulated irregular heartbeat spike
    const cycle = (Date.now() / (60000 / bpm.value)) % 1;
    if (cycle > 0.45 && cycle < 0.5) {
      targetY = midY - 65; // QRS peak
    } else if (cycle >= 0.5 && cycle < 0.55) {
      targetY = midY + 35; // S wave drop
    } else {
      targetY = midY + (Math.random() * 6 - 3); // noise baseline
    }
  }

  ecgPoints.push({ x: ecgX, y: targetY });
  if (ecgPoints.length > 140) ecgPoints.shift();

  ctx.strokeStyle = phase.value === 'flatline' ? '#ff0033' : '#00ff88';
  ctx.lineWidth = 3;
  ctx.shadowColor = phase.value === 'flatline' ? '#ff0033' : '#00ff88';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < ecgPoints.length; i++) {
    const pt = ecgPoints[i];
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  animationFrameId = requestAnimationFrame(renderECG);
}

onMounted(() => {
  renderECG();
  startCinematicSequence();
});

onUnmounted(() => {
  soundManager.stopFlatline();
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="ending-container" :class="{ 'tv-power-off': showTvPowerOff }">
    <!-- Active Heartbeat & Flashback Screen -->
    <div v-if="phase !== 'epilogue'" class="monitor-screen" :class="{ 'glitch-active': phase === 'flicker_flashbacks' }">
      <!-- Top Monitor Status -->
      <div class="monitor-header">
        <div class="vital-tag">
          <span class="heartbeat-pulse text-danger">♥</span>
          <span class="bpm-num">{{ phase === 'flatline' ? '00' : bpm }} BPM</span>
        </div>
        <div class="status-warning" :class="phase === 'flatline' ? 'text-danger' : 'text-warning'">
          {{ phase === 'flatline' ? 'ASYSTOLE // NO CARDIAC RHYTHM' : 'SEVERE TACHYCARDIA & ARRHYTHMIA' }}
        </div>
      </div>

      <!-- ECG Oscilloscope Canvas -->
      <div class="canvas-wrapper">
        <canvas ref="canvasRef" width="640" height="260" class="ecg-canvas"></canvas>
      </div>

      <!-- Flashback Memories Box -->
      <div class="memory-box">
        <div v-if="memoryFlash" class="memory-text">
          {{ memoryFlash }}
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
  height: 100%;
  padding: 12px;
  background: #020402;
  overflow: hidden;
  position: relative;
}

.monitor-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 3px solid var(--retro-danger);
  background: #000;
  padding: 14px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed var(--retro-danger);
  padding-bottom: 8px;
}

.vital-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.text-danger {
  color: var(--retro-danger);
}

.text-warning {
  color: var(--retro-warning);
}

.status-warning {
  font-size: 10px;
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
}

.ecg-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.memory-box {
  min-height: 70px;
  background: #0d0000;
  border: 2px solid var(--retro-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
}

.memory-text {
  font-family: var(--font-terminal);
  font-size: 22px;
  color: #ff9999;
  letter-spacing: 1px;
  animation: glitchShake 0.3s infinite;
}

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
