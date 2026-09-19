<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, onFightComplete, triggerDrugBoost } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

// Target configurations for the 3 stages
const targetConfigs = [
  {
    name: 'CORNER STORE OWNER',
    title: 'TARGET 1 // UNPAID PROTECTION FEE',
    maxHp: 80,
    dmg: 8,
    speed: 0.015,
    bounty: 400,
    build: 'short',
  },
  {
    name: 'UNDERGROUND GAMBLER',
    title: 'TARGET 2 // DEBT $1,500',
    maxHp: 110,
    dmg: 14,
    speed: 0.022,
    bounty: 600,
    build: 'medium',
  },
  {
    name: 'ROGUE WAREHOUSE BOUNCER',
    title: 'TARGET 3 // EMBEZZLED SYNDICATE STASH',
    maxHp: 150,
    dmg: 20,
    speed: 0.028,
    bounty: 1000,
    build: 'heavy',
  },
];

const currentTargetConfig = computed(() => {
  const index = Math.min(2, Math.max(0, state.currentFightLevel - 1));
  return targetConfigs[index];
});

// Combatant states
const playerHp = ref(100);
const playerMaxHp = 100;
const opponentHp = ref(targetConfigs[state.currentFightLevel - 1].maxHp);

type ActionState = 'idle' | 'punching' | 'kicking' | 'blocking' | 'hit' | 'knocked';

const playerState = ref<ActionState>('idle');
const opponentState = ref<ActionState>('idle');

let playerActionTimer = 0;
let opponentActionTimer = 0;
let opponentAttackTimer = 0;
let opponentTelegraphTimer = 0;

// Sparks particle system
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
let particles: Particle[] = [];

// Screen shake
let screenShake = 0;

const battleOver = ref(false);
const battleResult = ref<'win' | 'lose' | null>(null);

function spawnSparks(x: number, y: number, isCritical = false) {
  const count = isCritical ? 18 : 10;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 15 + Math.random() * 10,
      color: isCritical ? '#ff0055' : '#ffea00',
    });
  }
}

// Player attack actions
function executePlayerAttack(type: 'punch' | 'kick') {
  if (playerState.value !== 'idle' || battleOver.value) return;

  const isKick = type === 'kick';
  playerState.value = isKick ? 'kicking' : 'punching';
  playerActionTimer = state.stats.sluggishTimer > 0 ? (isKick ? 20 : 15) : (isKick ? 14 : 10);
  
  if (isKick) soundManager.playKick();
  else soundManager.playPunch();

  const isBoosted = state.stats.boostActive;
  const dmg = (isKick ? 24 : 14) * (isBoosted ? 1.7 : 1) * (state.stats.sluggishTimer > 0 ? 0.75 : 1);

  setTimeout(() => {
    if (battleOver.value) return;
    if (opponentState.value === 'blocking') {
      soundManager.playBlock();
      opponentHp.value = Math.max(0, opponentHp.value - Math.round(dmg * 0.3));
      spawnSparks(420, isKick ? 240 : 200, false);
    } else {
      if (isKick) soundManager.playKick();
      else soundManager.playPunch();
      opponentHp.value = Math.max(0, opponentHp.value - Math.round(dmg));
      opponentState.value = 'hit';
      opponentActionTimer = isKick ? 12 : 10;
      screenShake = isKick ? 10 : 6;
      spawnSparks(430, isKick ? 230 : 190, isBoosted);
    }

    if (opponentHp.value <= 0) {
      handleOpponentDefeated();
    }
  }, isKick ? 150 : 100);
}

function startBlock() {
  if (playerState.value === 'idle' && !battleOver.value) {
    playerState.value = 'blocking';
  }
}

function stopBlock() {
  if (playerState.value === 'blocking') {
    playerState.value = 'idle';
  }
}

function retreatFight() {
  soundManager.playClick();
  battleOver.value = true;
  battleResult.value = 'lose';
  setTimeout(() => onFightComplete(false), 1000);
}

function handleOpponentDefeated() {
  battleOver.value = true;
  battleResult.value = 'win';
  opponentState.value = 'knocked';
  soundManager.playKick();
  screenShake = 14;
}

function handlePlayerDefeated() {
  battleOver.value = true;
  battleResult.value = 'lose';
  playerState.value = 'knocked';
  soundManager.playKick();
  screenShake = 14;
}

function finishBattle() {
  onFightComplete(battleResult.value === 'win');
}

// Opponent AI Loop
function updateOpponentAI() {
  if (battleOver.value) return;

  if (opponentActionTimer > 0) {
    opponentActionTimer--;
    if (opponentActionTimer === 0 && opponentState.value !== 'knocked') {
      opponentState.value = 'idle';
    }
    return;
  }

  if (opponentTelegraphTimer > 0) {
    opponentTelegraphTimer--;
    if (opponentTelegraphTimer === 0) executeOpponentAttack();
    return;
  }

  opponentAttackTimer++;
  const threshold = Math.max(35, 70 - state.currentFightLevel * 12);
  if (opponentAttackTimer >= threshold) {
    opponentAttackTimer = 0;
    if ((playerState.value === 'punching' || playerState.value === 'kicking') && Math.random() < 0.45) {
      opponentState.value = 'blocking';
      opponentActionTimer = 20;
      return;
    }
    opponentTelegraphTimer = 18;
  }
}

function executeOpponentAttack() {
  const isKick = Math.random() < 0.4;
  opponentState.value = isKick ? 'kicking' : 'punching';
  opponentActionTimer = 16;

  setTimeout(() => {
    if (battleOver.value) return;
    let dmg = isKick ? currentTargetConfig.value.dmg * 1.5 : currentTargetConfig.value.dmg;
    if (state.stats.sluggishTimer > 0) dmg *= 1.25;

    if (playerState.value === 'blocking') {
      soundManager.playBlock();
      playerHp.value = Math.max(0, playerHp.value - Math.round(dmg * 0.25));
      spawnSparks(240, 210, false);
      screenShake = 4;
    } else {
      soundManager.playPunch();
      playerHp.value = Math.max(0, playerHp.value - Math.round(dmg));
      playerState.value = 'hit';
      playerActionTimer = 10;
      spawnSparks(230, 200, true);
      screenShake = 10;
    }

    if (playerHp.value <= 0) handlePlayerDefeated();
  }, 120);
}

// Unified Key listeners
function handleKeyDown(e: KeyboardEvent) {
  if (battleOver.value) return;
  const key = e.key.toLowerCase();
  if (key === 'a') executePlayerAttack('punch');
  else if (key === 'd') executePlayerAttack('kick');
  else if (key === 's') startBlock();
  else if (e.code === 'Space') triggerDrugBoost();
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key.toLowerCase() === 's') stopBlock();
}

// Canvas Rendering Loop
function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Handle screen shake
  ctx.save();
  if (screenShake > 0) {
    const dx = (Math.random() * 2 - 1) * screenShake;
    const dy = (Math.random() * 2 - 1) * screenShake;
    ctx.translate(dx, dy);
    screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
  }

  // Background: Grungy retro alley
  ctx.fillStyle = '#102210';
  ctx.fillRect(0, 0, width, height);

  // Background brick wall silhouette
  ctx.fillStyle = '#1c381c';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 14; c++) {
      const offsetX = (r % 2) * 25;
      ctx.fillRect(c * 50 - offsetX, r * 28 + 40, 46, 24);
    }
  }

  // Alley Ground line
  ctx.fillStyle = '#051205';
  ctx.fillRect(0, 300, width, 100);

  // Alley streetlamp post silhouette
  ctx.fillStyle = '#0b1c0b';
  ctx.fillRect(50, 60, 10, 240);
  ctx.fillRect(40, 50, 40, 12);
  // Streetlamp glow cone
  const grad = ctx.createRadialGradient(60, 60, 5, 60, 150, 160);
  grad.addColorStop(0, 'rgba(255, 230, 150, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(60, 120, 140, 0, Math.PI * 2);
  ctx.fill();

  // Draw Silhouette Fighters
  drawSilhouetteFighter(ctx, 220, 300, playerState.value, true, state.stats.boostActive, false);
  
  const isTelegraphing = opponentTelegraphTimer > 0;
  drawSilhouetteFighter(
    ctx, 
    440, 
    300, 
    opponentState.value, 
    false, 
    false, 
    isTelegraphing, 
    currentTargetConfig.value.build
  );

  // Render hit particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25; // gravity
    p.life--;

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update Timers
  if (playerActionTimer > 0) {
    playerActionTimer--;
    if (playerActionTimer === 0 && playerState.value !== 'knocked') {
      playerState.value = 'idle';
    }
  }

  updateOpponentAI();

  ctx.restore();

  animationFrameId = requestAnimationFrame(render);
}

// Procedural Silhouette Fighter Drawing (Shadow Style)
function drawSilhouetteFighter(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  action: ActionState,
  isPlayer: boolean,
  isBoosted: boolean,
  isTelegraphing: boolean,
  build: string = 'medium'
) {
  ctx.save();
  ctx.translate(x, groundY);

  // Flip opponent to face left
  if (!isPlayer) {
    ctx.scale(-1, 1);
  }

  // Color selection: Pitch black silhouette, flashing red if hit/telegraphing, cyan aura if boosted
  if (isBoosted) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;
  }

  if (isTelegraphing) {
    ctx.fillStyle = '#ff2222'; // Visual warning!
  } else if (action === 'hit') {
    ctx.fillStyle = '#ffffff'; // White hit flash
  } else {
    ctx.fillStyle = isPlayer ? '#050a05' : '#030603';
  }

  const widthScale = build === 'heavy' ? 1.35 : build === 'short' ? 0.85 : 1.0;
  const heightScale = build === 'short' ? 0.9 : 1.0;

  if (action === 'knocked') {
    // Fallen on ground
    ctx.beginPath();
    ctx.ellipse(0, -10, 40 * widthScale, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(isPlayer ? -35 : 35, -12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Feet / Legs
  if (action === 'kicking') {
    // Front leg extended horizontally
    ctx.fillRect(0, -60 * heightScale, 60, 14); // Extended kick
    ctx.fillRect(-15, -60 * heightScale, 16, 60 * heightScale); // Standing leg
  } else {
    // Normal stance legs
    ctx.fillRect(-20 * widthScale, -55 * heightScale, 14 * widthScale, 55 * heightScale);
    ctx.fillRect(6 * widthScale, -55 * heightScale, 14 * widthScale, 55 * heightScale);
  }

  // Torso
  const torsoY = -110 * heightScale;
  ctx.fillRect(-18 * widthScale, torsoY, 36 * widthScale, 55 * heightScale);

  // Head
  const headY = -135 * heightScale;
  ctx.beginPath();
  ctx.arc(0, headY, 14 * heightScale, 0, Math.PI * 2);
  ctx.fill();

  // Arms / Hands
  if (action === 'punching') {
    // Extended punch arm
    ctx.fillRect(5 * widthScale, torsoY + 8, 55, 12);
    // Back arm in guard
    ctx.fillRect(-12 * widthScale, torsoY + 12, 16, 26);
  } else if (action === 'blocking') {
    // Both arms raised in high guard
    ctx.fillRect(8 * widthScale, torsoY - 8, 12, 40);
    ctx.fillRect(18 * widthScale, torsoY - 2, 12, 38);
  } else if (action === 'hit') {
    // Knocked back posture
    ctx.fillRect(-22 * widthScale, torsoY + 10, 20, 14);
  } else {
    // Idle martial arts stance
    const breathingOffset = Math.sin(Date.now() * 0.006) * 3;
    ctx.fillRect(8 * widthScale, torsoY + 10 + breathingOffset, 22, 12);
    ctx.fillRect(-10 * widthScale, torsoY + 14 + breathingOffset, 16, 22);
  }

  ctx.restore();
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  render();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="combat-wrapper">
    <!-- Top Combat Info Header -->
    <div class="combat-hud">
      <!-- Player HP -->
      <div class="fighter-card player-side">
        <div class="name-row">
          <span class="label">YOU (ENFORCER)</span>
          <span class="hp-txt">{{ Math.round(playerHp) }} / {{ playerMaxHp }}</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill" 
            :class="playerHp < 30 ? 'danger' : ''"
            :style="{ width: `${(playerHp / playerMaxHp) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="vs-badge">VS</div>

      <!-- Opponent HP -->
      <div class="fighter-card target-side">
        <div class="name-row">
          <span class="hp-txt">{{ Math.round(opponentHp) }} / {{ currentTargetConfig.maxHp }}</span>
          <span class="label text-danger">{{ currentTargetConfig.name }}</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill danger" 
            :style="{ width: `${(opponentHp / currentTargetConfig.maxHp) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Canvas Arena -->
    <div class="arena-frame">
      <canvas 
        ref="canvasRef" 
        width="640" 
        height="380" 
        class="arena-canvas"
      ></canvas>

      <!-- Overlay Victory / Defeat Modal -->
      <div v-if="battleOver" class="battle-overlay">
        <template v-if="battleResult === 'win'">
          <div class="result-title text-success">TARGET SUBDUED</div>
          <p class="result-desc">Debt payment secured for the syndicate.</p>
          <button class="retro-btn" @click="finishBattle">
            COLLECT EARNINGS & CONTINUE ➔
          </button>
        </template>
        <template v-else>
          <div class="result-title text-danger">DEFEATED / KICKED OUT</div>
          <p class="result-desc">You proved useless to the loan sharks. Cast onto the streets.</p>
          <button class="retro-btn retro-btn-danger" @click="finishBattle">
            ENTER THIEVES STAGE ➔
          </button>
        </template>
      </div>
    </div>

    <!-- Combat Controls / Action Pad -->
    <div class="controls-panel">
      <div class="keys-guide">
        <span>KEYBOARD: [A] PUNCH | [D] KICK | [S] BLOCK | [SPACE] BOOST</span>
      </div>

      <div class="action-buttons-grid">
        <button 
          class="retro-btn action-btn" 
          :disabled="playerState !== 'idle' || battleOver"
          @click="executePlayerAttack('punch')"
        >
          👊 PUNCH [A]
        </button>

        <button 
          class="retro-btn action-btn" 
          :disabled="playerState !== 'idle' || battleOver"
          @click="executePlayerAttack('kick')"
        >
          🦶 KICK [D]
        </button>

        <button 
          class="retro-btn action-btn"
          :disabled="battleOver"
          @mousedown="startBlock"
          @mouseup="stopBlock"
          @mouseleave="stopBlock"
          @touchstart.prevent="startBlock"
          @touchend.prevent="stopBlock"
        >
          🛡️ BLOCK [S]
        </button>

        <button 
          class="retro-btn retro-btn-warning action-btn" 
          :disabled="state.stats.doses <= 0 || state.stats.boostActive || battleOver"
          @click="triggerDrugBoost"
        >
          ⚡ BOOST (x{{ state.stats.doses }})
        </button>

        <button 
          class="retro-btn retro-btn-danger retreat-btn" 
          :disabled="battleOver"
          @click="retreatFight"
          title="Refuse to beat the target / Give up"
        >
          NO (SURRENDER)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 10px;
}

.combat-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--retro-bg-dark);
  padding: 8px 12px;
  border: 2px solid var(--retro-accent);
}

.fighter-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-side .name-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.target-side .name-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.vs-badge {
  font-size: 14px;
  font-weight: bold;
  color: var(--retro-warning);
  padding: 0 8px;
}

.arena-frame {
  position: relative;
  flex: 1;
  background: #000;
  border: 3px solid var(--retro-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.arena-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.battle-overlay {
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
  max-width: 400px;
}

.text-success {
  color: #52b788;
}

.text-danger {
  color: var(--retro-danger);
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.keys-guide {
  font-size: 8px;
  text-align: center;
  opacity: 0.7;
}

.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 1.2fr;
  gap: 6px;
}

.action-btn {
  padding: 12px 6px;
  font-size: 10px;
}

.retreat-btn {
  font-size: 9px;
  padding: 12px 6px;
}

@media (max-width: 600px) {
  .action-buttons-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
