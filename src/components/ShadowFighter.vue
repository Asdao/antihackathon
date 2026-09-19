<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, onFightComplete, triggerDrugBoost } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

// Target configurations for diverse opponents
const targetConfigs = [
  {
    name: 'CORNER STORE OWNER',
    title: 'CORNER GROCERY // OVERDUE DEBT',
    maxHp: 80,
    dmg: 8,
    speed: 0.015,
    bounty: 400,
    build: 'short',
  },
  {
    name: 'UNDERGROUND GAMBLER',
    title: 'GAMBLING DEN // COMPOUNDING LOAN',
    maxHp: 110,
    dmg: 14,
    speed: 0.022,
    bounty: 600,
    build: 'medium',
  },
  {
    name: 'ROGUE WAREHOUSE BOUNCER',
    title: 'WAREHOUSE // SYNDICATE ENFORCER',
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

// Procedural Silhouette Fighter Drawing (Diverse Opponents, Transparent Arm Borders, Pixelated Joints)
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
  ctx.translate(Math.round(x), Math.round(groundY));

  // Flip opponent to face left
  if (!isPlayer) {
    ctx.scale(-1, 1);
  }

  if (isBoosted) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
  }

  // Background cutout color used for transparent separation borders between limbs
  const cutoutColor = '#102210';
  let silColor = isPlayer ? '#050a05' : '#030603';

  if (isTelegraphing) {
    silColor = '#ff2222';
  } else if (action === 'hit') {
    silColor = '#ffffff';
  }

  // Helper to draw pixelated rect with transparent cutout border
  const drawPixelRect = (rx: number, ry: number, rw: number, rh: number, withBorder = false) => {
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

  const widthScale = build === 'heavy' ? 1.45 : build === 'short' ? 0.88 : 1.0;
  const heightScale = build === 'short' ? 0.88 : 1.0;

  if (action === 'knocked') {
    drawPixelRect(-32 * widthScale, -12, 64 * widthScale, 12);
    drawPixelRect(isPlayer ? -38 : 38, -14, 14, 14);
    ctx.restore();
    return;
  }

  // --- LEGS ---
  if (action === 'kicking') {
    // Front leg extended horizontally with transparent border
    drawPixelRect(0, -60 * heightScale, 64, 14, true);
    // Standing leg
    drawPixelRect(-16, -60 * heightScale, 16, 60 * heightScale);
    if (build === 'heavy') drawPixelRect(50, -62 * heightScale, 16, 18);
  } else {
    // Stance legs
    drawPixelRect(-20 * widthScale, -55 * heightScale, 14 * widthScale, 55 * heightScale);
    drawPixelRect(6 * widthScale, -55 * heightScale, 14 * widthScale, 55 * heightScale);
  }

  // --- TORSO & COSTUMES ---
  const torsoY = -110 * heightScale;
  drawPixelRect(-18 * widthScale, torsoY, 36 * widthScale, 55 * heightScale);

  // Diverse Opponent Features on Torso
  if (!isPlayer) {
    if (build === 'short') {
      // Storekeeper: Apron with transparent straps
      ctx.fillStyle = cutoutColor;
      ctx.fillRect(-12, torsoY + 8, 24, 2);
      drawPixelRect(-14, torsoY + 10, 28, 42, true);
    } else if (build === 'medium') {
      // Gambler: Trench Coat tails flapping behind
      drawPixelRect(-22, torsoY + 22, 10, 46);
      drawPixelRect(12, torsoY + 22, 10, 42);
    } else if (build === 'heavy') {
      // Bouncer: Spiked Shoulder Pads
      drawPixelRect(-28 * widthScale, torsoY - 6, 14, 12, true);
      drawPixelRect(16 * widthScale, torsoY - 6, 14, 12, true);
    }
  } else {
    // Player: Enforcer Hoodie pouch
    drawPixelRect(-10, torsoY + 30, 20, 14, true);
  }

  // --- HEAD & HEADWEAR ---
  const headY = -135 * heightScale;
  drawPixelRect(-12 * heightScale, headY - 12, 24 * heightScale, 24 * heightScale);

  if (isPlayer) {
    // Player: Hoodie contour
    drawPixelRect(-16, headY - 14, 32, 8, true);
  } else {
    if (build === 'short') {
      // Storekeeper: Bald top + side hair tufts
      drawPixelRect(-16, headY - 4, 6, 12);
      drawPixelRect(10, headY - 4, 6, 12);
    } else if (build === 'medium') {
      // Gambler: Fedora Hat
      drawPixelRect(-20, headY - 14, 40, 5, true); // Brim
      drawPixelRect(-12, headY - 24, 24, 10);      // Crown
      // Glowing cigarette ember spark
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(12, headY + 4, 3, 3);
    } else if (build === 'heavy') {
      // Bouncer: Mohawk Hair
      drawPixelRect(-3, headY - 28, 6, 16);
    }
  }

  // --- ARMS WITH TRANSPARENT BORDERS ---
  if (action === 'punching') {
    // Extended punch arm with transparent separation border
    drawPixelRect(5 * widthScale, torsoY + 8, 56, 13, true);
    // Back arm in guard
    drawPixelRect(-14 * widthScale, torsoY + 12, 16, 26, true);
  } else if (action === 'blocking') {
    // Both arms raised in high guard with transparent borders
    drawPixelRect(6 * widthScale, torsoY - 8, 12, 42, true);
    drawPixelRect(18 * widthScale, torsoY - 2, 12, 38, true);
  } else if (action === 'hit') {
    drawPixelRect(-22 * widthScale, torsoY + 10, 20, 14, true);
  } else {
    // Idle martial arts stance with transparent arm borders
    const breathingOffset = Math.sin(Date.now() * 0.006) * 3;
    drawPixelRect(8 * widthScale, torsoY + 10 + breathingOffset, 22, 12, true);
    drawPixelRect(-12 * widthScale, torsoY + 14 + breathingOffset, 16, 22, true);

    // Opponent handheld accessories
    if (!isPlayer) {
      if (build === 'short') {
        // Storekeeper holding cane/broom
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(24, torsoY + 14, 4, 60);
      } else if (build === 'medium') {
        // Gambler holding iron pipe
        ctx.fillStyle = '#888888';
        ctx.fillRect(26, torsoY + 4, 6, 28);
      }
    }
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
          <span class="hp-txt">HEALTH</span>
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
          <span class="hp-txt">TARGET HP</span>
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
          ⚡ DRUG BOOST
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
