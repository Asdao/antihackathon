<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';
import { createPixelFilter } from '../graphics/pixelFilter';

const { state, onFightComplete, triggerDrugBoost } = useGameState();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
const applyPixelFilter = createPixelFilter(320, 190);

// Target configurations for diverse opponents (extended arcade durations)
const targetConfigs = [
  {
    name: 'CORNER STORE OWNER',
    title: 'CORNER GROCERY // OVERDUE DEBT',
    maxHp: 180,
    dmg: 10,
    speed: 0.015,
    bounty: 400,
    build: 'short',
  },
  {
    name: 'UNDERGROUND GAMBLER',
    title: 'GAMBLING DEN // COMPOUNDING LOAN',
    maxHp: 250,
    dmg: 15,
    speed: 0.022,
    bounty: 600,
    build: 'medium',
  },
  {
    name: 'ROGUE WAREHOUSE BOUNCER',
    title: 'WAREHOUSE // SYNDICATE ENFORCER',
    maxHp: 340,
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

// Combatant states (scaled for tactical 30-45s bouts)
const playerHp = ref(160);
const playerMaxHp = 160;
const opponentHp = ref(targetConfigs[state.currentFightLevel - 1].maxHp);

type ActionState = 'idle' | 'punching' | 'kicking' | 'blocking' | 'hit' | 'knocked';

const playerState = ref<ActionState>('idle');
const opponentState = ref<ActionState>('idle');

let playerActionTimer = 0;
let opponentActionTimer = 0;
let opponentAttackTimer = 0;
let opponentTelegraphTimer = 0;
let combatFrameCount = 0;

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

// Player attack actions with evident sluggish delay & recovery locks
function executePlayerAttack(type: 'punch' | 'kick') {
  if (playerState.value !== 'idle' || battleOver.value) return;

  const isKick = type === 'kick';
  const isSluggish = state.stats.sluggishTimer > 0;
  const isBoosted = state.stats.boostActive;

  playerState.value = isKick ? 'kicking' : 'punching';
  // Evident recovery lock: sluggish timer doubles recovery delay (36/24 vs 14/10)
  playerActionTimer = isSluggish ? (isKick ? 36 : 24) : (isKick ? 14 : 10);
  
  if (isKick) soundManager.playKick();
  else soundManager.playPunch();

  // Damage calculations: Punch 12, Kick 20; boosted +50%, sluggish -40%
  const baseDmg = isKick ? 20 : 12;
  const dmg = baseDmg * (isBoosted ? 1.5 : 1) * (isSluggish ? 0.6 : 1);

  // Evident windup delay: 250ms/340ms when sluggish (simulating delayed motor response)
  const windupDelay = isSluggish ? (isKick ? 340 : 250) : (isBoosted ? 80 : (isKick ? 150 : 100));

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
      opponentActionTimer = isKick ? 14 : 10;
      screenShake = isKick ? 10 : 6;
      spawnSparks(430, isKick ? 230 : 190, isBoosted);
    }

    if (opponentHp.value <= 0) {
      handleOpponentDefeated();
    }
  }, windupDelay);
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
  const threshold = Math.max(45, 80 - state.currentFightLevel * 10);
  if (opponentAttackTimer >= threshold) {
    opponentAttackTimer = 0;
    if ((playerState.value === 'punching' || playerState.value === 'kicking') && Math.random() < 0.45) {
      opponentState.value = 'blocking';
      opponentActionTimer = 22;
      return;
    }
    opponentTelegraphTimer = 20;
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
  combatFrameCount++;

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

  // Render sluggish ghost after-images behind the player (evident motor lag)
  if (state.stats.sluggishTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    drawSilhouetteFighter(ctx, 202, 300, playerState.value, true, false, false, 'sluggish');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18;
    drawSilhouetteFighter(ctx, 186, 300, playerState.value, true, false, false, 'sluggish');
    ctx.restore();
  }

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

  // Evident Sluggish Crash Amber Wash
  if (state.stats.sluggishTimer > 0) {
    const sluggishAlpha = 0.20 + Math.sin(combatFrameCount * 0.12) * 0.08;
    ctx.fillStyle = `rgba(180, 95, 10, ${sluggishAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Pixelate the game world before drawing readable status labels.
  applyPixelFilter(ctx);

  // Compact On-Canvas Status Banners
  if (state.stats.boostActive) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 25, 0.88)';
    ctx.fillRect(Math.floor(width / 2) - 120, 8, 240, 20);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(width / 2) - 120, 8, 240, 20);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SURGE // +50% ATK', Math.floor(width / 2), 22);
    ctx.restore();
  } else if (state.stats.sluggishTimer > 0) {
    ctx.save();
    const pulseColor = Math.sin(combatFrameCount * 0.15) > 0 ? '#ffb703' : '#e63946';
    ctx.fillStyle = 'rgba(30, 18, 5, 0.88)';
    ctx.fillRect(Math.floor(width / 2) - 130, 8, 260, 20);
    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(width / 2) - 130, 8, 260, 20);
    ctx.fillStyle = pulseColor;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💤 CRASHING // SPEED -50%', Math.floor(width / 2), 22);
    ctx.restore();
  }

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

  if (build === 'sluggish') {
    silColor = '#3a2710';
  } else if (isTelegraphing) {
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

  const widthScale = build === 'heavy' ? 1.4 : build === 'short' ? 0.9 : 1.0;
  const heightScale = build === 'short' ? 0.9 : 1.0;

  // Knocked out: unified fallen silhouette block
  if (action === 'knocked') {
    drawPixelRect(-34 * widthScale, -14, 68 * widthScale, 14);
    drawPixelRect(isPlayer ? -42 : 42, -18, 16, 16);
    ctx.restore();
    return;
  }

  // Unified body weight shift on action (whole body moves together)
  let bodyShiftX = 0;
  let bodyShiftY = 0;
  if (action === 'punching') bodyShiftX = 8;
  else if (action === 'kicking') bodyShiftX = 6;
  else if (action === 'hit') bodyShiftX = -10;
  else if (action === 'blocking') bodyShiftX = -4;

  const torsoY = Math.round(-112 * heightScale + bodyShiftY);

  // --- 1. CONSOLIDATED LOWER STANCE (LEGS) ---
  if (action === 'kicking') {
    // Standing support leg
    drawPixelRect(-16, -55 * heightScale, 16, 55 * heightScale);
    // Extended horizontal kicking leg with transparent cutout border
    drawPixelRect(bodyShiftX, torsoY + 44 * heightScale, 64, 16, true);
  } else {
    // Solid stance base with a clean negative-space cutout slit separating the legs
    const stanceW = Math.round(38 * widthScale);
    drawPixelRect(-18 * widthScale + bodyShiftX * 0.4, -54 * heightScale, stanceW, 54 * heightScale);
    // Cutout slit between legs
    ctx.fillStyle = cutoutColor;
    ctx.fillRect(Math.round(-2 * widthScale + bodyShiftX * 0.4), Math.round(-46 * heightScale), 5, Math.round(46 * heightScale));
  }

  // --- 2. CONSOLIDATED UPPER BODY (MERGED TORSO + HEAD + COSTUME SILHOUETTE) ---
  // A single unified silhouette mass from waist to head top, avoiding fragmented floating pieces
  const bodyW = Math.round(34 * widthScale);
  const bodyH = Math.round(76 * heightScale);
  const bodyX = Math.round(-17 * widthScale + bodyShiftX);
  const headTopY = torsoY - Math.round(24 * heightScale);

  // Draw main torso & neck/head base as unified silhouette
  drawPixelRect(bodyX, headTopY, bodyW, bodyH);

  // Distinct costume / archetype silhouette contours merged directly into the core body
  if (isPlayer) {
    // Player (Hooded Enforcer): Hood crown contour + front pouch outline
    drawPixelRect(bodyX - 2, headTopY - 4, bodyW + 4, 8);
    drawPixelRect(bodyX + 6, torsoY + 28, 18, 12, true); // Pouch cutout
  } else {
    if (build === 'short') {
      // Storekeeper: Rounded shoulders & apron contour
      drawPixelRect(bodyX - 3, headTopY + 12, bodyW + 6, bodyH - 12);
      ctx.fillStyle = cutoutColor;
      ctx.fillRect(bodyX + 4, torsoY + 6, bodyW - 8, 2); // Apron neck strap
    } else if (build === 'medium') {
      // Gambler: Fedora Hat merged on top + long coat flare
      drawPixelRect(bodyX - 5, headTopY - 6, bodyW + 10, 5, true); // Hat brim
      drawPixelRect(bodyX + 2, headTopY - 14, bodyW - 4, 9);       // Hat crown
      drawPixelRect(bodyX - 6, torsoY + 20, 8, 44);                // Flared coat tail
      // Glowing cigarette ember
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(bodyX + bodyW - 2, headTopY + 18, 3, 3);
    } else if (build === 'heavy') {
      // Bouncer: Spiked shoulder blocks & mohawk crown
      drawPixelRect(bodyX - 6, headTopY + 16, bodyW + 12, 14); // Broad spiked shoulders
      drawPixelRect(bodyX + Math.round(bodyW / 2) - 3, headTopY - 14, 6, 15); // Mohawk
    }
  }

  // --- 3. CONSOLIDATED ARMS WITH TRANSPARENT SEPARATION BORDER ---
  if (action === 'punching') {
    // Solid punch limb extending forward with 2px cutout border
    drawPixelRect(bodyX + bodyW - 4, torsoY + 6, 48, 14, true);
    // Guard hand tucked at hip
    drawPixelRect(bodyX - 4, torsoY + 14, 12, 20, true);
  } else if (action === 'blocking') {
    // Solid crossed guard shield block over chest
    drawPixelRect(bodyX + bodyW - 12, torsoY - 4, 14, 40, true);
  } else if (action === 'hit') {
    // Arms flung back in impact
    drawPixelRect(bodyX - 14, torsoY + 10, 16, 14, true);
  } else {
    // Idle stance: consolidated guard held at chest with transparent separation border
    drawPixelRect(bodyX + 12, torsoY + 8, 18, 16, true);

    // Opponent handheld accessories
    if (!isPlayer) {
      if (build === 'short') {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(bodyX + bodyW + 4, torsoY + 6, 4, 58); // Cane
      } else if (build === 'medium') {
        ctx.fillStyle = '#888888';
        ctx.fillRect(bodyX + bodyW + 2, torsoY + 2, 5, 26); // Pipe
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
          <span class="label">YOU</span>
          <span v-if="state.stats.boostActive" class="boost-tag">⚡ SURGE</span>
          <span v-else-if="state.stats.sluggishTimer > 0" class="sluggish-tag">💤 CRASH</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill" 
            :class="playerHp < 50 ? 'danger' : ''"
            :style="{ width: `${(playerHp / playerMaxHp) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="vs-badge">VS</div>

      <!-- Opponent HP -->
      <div class="fighter-card target-side">
        <div class="name-row">
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
          ⚡ BOOST
        </button>

        <button 
          class="retro-btn retro-btn-danger retreat-btn" 
          :disabled="battleOver"
          @click="retreatFight"
          title="Surrender / Give up"
        >
          SURRENDER
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

.boost-tag {
  color: #00ffff;
  font-weight: bold;
}

.sluggish-tag {
  color: #ffb703;
  font-weight: bold;
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
