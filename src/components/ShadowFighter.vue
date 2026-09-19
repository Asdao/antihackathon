<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';
import { createPixelFilter } from '../graphics/pixelFilter';
import { drawCombatEnvironment, drawCombatFighter, type CombatPose } from '../graphics/combatScene';

const { state, onFightComplete, triggerDrugBoost } = useGameState();
const targets = [
  { name: 'CORNER STORE OWNER', title: 'CORNER GROCERY', subtitle: 'Overdue protection fee', maxHp: 180, damage: 10 },
  { name: 'UNDERGROUND GAMBLER', title: 'GAMBLING DEN', subtitle: 'Compounding loan', maxHp: 250, damage: 15 },
  { name: 'ROGUE WAREHOUSE BOUNCER', title: 'WAREHOUSE', subtitle: 'Syndicate cash', maxHp: 340, damage: 20 },
] as const;
const level = Math.min(3, Math.max(1, state.currentFightLevel));
const target = targets[level - 1]!;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const resultButton = ref<HTMLButtonElement | null>(null);
const playerHp = ref(160);
const opponentHp = ref<number>(target.maxHp);
const playerPose = ref<CombatPose>('idle');
const opponentPose = ref<CombatPose>('idle');
const opponentKind = ref<'punch' | 'kick'>('punch');
const started = ref(false);
const battleOver = ref(false);
const battleResult = ref<'win' | 'lose' | null>(null);
const announcement = ref('Read the opponent. Time your guard.');
const applyPixelFilter = createPixelFilter(320, 190);
const poseLabels: Record<CombatPose, string> = {
  idle: 'READY', windup: 'WINDING UP', strike: 'CONTACT', recover: 'RECOVERING', block: 'GUARD UP', hit: 'STAGGERED', down: 'DOWN',
};
const enemyCue = computed(() => !started.value ? 'Your move · choose an action to begin'
  : battleOver.value ? (battleResult.value === 'win' ? 'The debt is collected.' : 'The fight is over.')
  : opponentPose.value === 'windup' ? `Incoming ${opponentKind.value} · hold block`
  : opponentPose.value === 'block' ? 'Guard raised · wait for an opening'
  : opponentPose.value === 'recover' || opponentPose.value === 'hit' ? 'An opening · strike now'
  : 'Watch the shoulders. Keep your guard ready.');
const canAttack = computed(() => playerPose.value === 'idle' && !battleOver.value);

type AttackKind = 'punch' | 'kick';
interface Attack { kind: AttackKind; elapsed: number; windup: number; active: number; recovery: number; damage: number; landed: boolean }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; blocked: boolean }
let playerAttack: Attack | null = null;
let opponentAttack: Attack | null = null;
let playerStun = 0;
let opponentStun = 0;
let opponentCooldown = 0;
let opponentGuard = 0;
let blockHeld = false;
let hitStop = 0;
let shake = 0;
let retreatCountdown = 0;
let completed = false;
let mounted = false;
let frameId = 0;
let lastTime = 0;
let lastPaint = 0;
let sceneTime = 0;
let sparks: Spark[] = [];

function beginBout() {
  if (started.value) return;
  started.value = true;
  soundManager.startCombatAmbience(level);
}
function executePlayerAttack(kind: AttackKind) {
  if (!canAttack.value || state.showStatsModal) return;
  beginBout();
  const kick = kind === 'kick';
  const sluggish = state.stats.sluggishTimer > 0;
  playerAttack = {
    kind, elapsed: 0, landed: false,
    windup: sluggish ? (kick ? 340 : 250) : state.stats.boostActive ? 80 : kick ? 150 : 100,
    active: kick ? 95 : 75,
    recovery: sluggish ? (kick ? 600 : 400) : kick ? 230 : 165,
    damage: (kick ? 20 : 12) * (state.stats.boostActive ? 1.5 : 1) * (sluggish ? .6 : 1),
  };
  playerPose.value = 'windup';
  soundManager.playWhoosh(kind);
}
function startBlock() {
  if (battleOver.value || state.showStatsModal) return;
  beginBout();
  blockHeld = true;
  if (playerPose.value === 'idle') playerPose.value = 'block';
}
function stopBlock() {
  blockHeld = false;
  if (playerPose.value === 'block') playerPose.value = 'idle';
}
function blockPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  startBlock();
}
function accessibleBlockClick(event: MouseEvent) {
  if (event.detail === 0) playerPose.value === 'block' ? stopBlock() : startBlock();
}
function boost() {
  if (battleOver.value || state.stats.boostActive || state.stats.doses <= 0 || state.showStatsModal) return;
  beginBout();
  triggerDrugBoost();
}
function settleBattle(result: 'win' | 'lose') {
  if (battleOver.value) return;
  battleOver.value = true;
  battleResult.value = result;
  playerAttack = null;
  opponentAttack = null;
  stopBlock();
  if (result === 'win') opponentPose.value = 'down';
  else playerPose.value = 'down';
  announcement.value = result === 'win' ? 'Target subdued. Continue to collect the payment.' : 'Defeated. Continue to the thieves stage.';
  soundManager.stopCombatAmbience();
  void nextTick(() => resultButton.value?.focus());
}
function finishBattle() {
  if (completed || !battleResult.value) return;
  completed = true;
  onFightComplete(battleResult.value === 'win');
}
function retreatFight() {
  if (battleOver.value) return;
  soundManager.playClick();
  settleBattle('lose');
  retreatCountdown = 450;
}
function spawnImpact(playerIsAttacker: boolean, blocked: boolean, kick: boolean) {
  const x = playerIsAttacker ? 371 : 272;
  const y = kick ? 235 : 207;
  const count = state.reducedMotion ? 3 : blocked ? 7 : 10;
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2;
    sparks.push({ x, y, vx: Math.cos(angle) * (38 + i * 4), vy: Math.sin(angle) * 49 - 20, life: 190 + i * 6, blocked });
  }
  hitStop = state.reducedMotion ? 0 : blocked ? 32 : kick ? 65 : 48;
  shake = state.reducedMotion ? 0 : blocked ? .7 : kick ? 2.6 : 1.6;
}
function resolveHit(attack: Attack, playerIsAttacker: boolean) {
  if (battleOver.value) return;
  const blocked = (playerIsAttacker ? opponentPose.value : playerPose.value) === 'block';
  let damage = attack.damage;
  if (!playerIsAttacker && state.stats.sluggishTimer > 0) damage *= 1.25;
  if (blocked) damage *= playerIsAttacker ? .3 : .25;
  const hp = playerIsAttacker ? opponentHp : playerHp;
  hp.value = Math.max(0, hp.value - Math.round(damage));
  if (blocked) soundManager.playBlock();
  else {
    if (attack.kind === 'kick') soundManager.playKick();
    else soundManager.playPunch();
    if (playerIsAttacker) {
      opponentAttack = null;
      opponentPose.value = 'hit';
      opponentStun = attack.kind === 'kick' ? 235 : 170;
      opponentGuard = 0;
    } else {
      playerAttack = null;
      playerPose.value = 'hit';
      playerStun = 170;
    }
  }
  spawnImpact(playerIsAttacker, blocked, attack.kind === 'kick');
  announcement.value = `${playerIsAttacker ? 'Opponent' : 'You'} ${blocked ? 'blocked' : 'hit'} · ${Math.round(damage)} damage.`;
  if (hp.value === 0) settleBattle(playerIsAttacker ? 'win' : 'lose');
}
function advanceAttack(attack: Attack, player: boolean, dt: number) {
  attack.elapsed += dt;
  const pose = player ? playerPose : opponentPose;
  if (!attack.landed && attack.elapsed >= attack.windup) {
    attack.landed = true;
    pose.value = 'strike';
    resolveHit(attack, player);
  }
  if (battleOver.value) return;
  if (attack.elapsed >= attack.windup + attack.active) pose.value = 'recover';
  if (attack.elapsed >= attack.windup + attack.active + attack.recovery) {
    if (player) { playerAttack = null; pose.value = blockHeld ? 'block' : 'idle'; }
    else { opponentAttack = null; pose.value = 'idle'; }
  }
}
function update(dt: number) {
  if (battleOver.value) {
    if (retreatCountdown > 0) { retreatCountdown -= dt; if (retreatCountdown <= 0) finishBattle(); }
    return;
  }
  if (!started.value) return;
  if (hitStop > 0) { hitStop = Math.max(0, hitStop - dt); return; }
  sceneTime += dt / 1000;
  if (playerStun > 0) {
    playerStun -= dt;
    if (playerStun <= 0) playerPose.value = blockHeld ? 'block' : 'idle';
  }
  if (opponentStun > 0) {
    opponentStun -= dt;
    if (opponentStun <= 0) opponentPose.value = 'idle';
  }
  if (playerAttack) advanceAttack(playerAttack, true, dt);
  if (opponentAttack && !battleOver.value) advanceAttack(opponentAttack, false, dt);
  if (battleOver.value) return;
  if (opponentGuard > 0) {
    opponentGuard -= dt;
    if (opponentGuard <= 0) opponentPose.value = 'idle';
  }
  if (!opponentAttack && opponentStun <= 0 && opponentGuard <= 0) {
    opponentCooldown += dt;
    if (opponentCooldown >= Math.max(45, 80 - level * 10) * 1000 / 60) {
      opponentCooldown = 0;
      if (playerAttack && Math.random() < .45) {
        opponentPose.value = 'block';
        opponentGuard = 22 * 1000 / 60;
      } else {
        const kind = Math.random() < .4 ? 'kick' : 'punch';
        opponentKind.value = kind;
        opponentAttack = { kind, elapsed: 0, windup: 460, active: 90, recovery: 270, landed: false, damage: target.damage * (kind === 'kick' ? 1.5 : 1) };
        opponentPose.value = 'windup';
        soundManager.playWhoosh(kind);
      }
    }
  }
}
function extension(attack: Attack | null) {
  if (!attack) return 0;
  if (attack.elapsed < attack.windup) return 0;
  if (attack.elapsed < attack.windup + attack.active) return 1;
  return Math.max(0, 1 - (attack.elapsed - attack.windup - attack.active) / attack.recovery);
}
function draw(ctx: CanvasRenderingContext2D, dt: number) {
  ctx.fillStyle = '#101d27'; ctx.fillRect(0, 0, 640, 380);
  ctx.save();
  if (!state.reducedMotion && shake > .1) ctx.translate(Math.round(Math.sin(sceneTime * 97) * shake), Math.round(Math.cos(sceneTime * 71) * shake * .5));
  shake *= Math.exp(-dt / 90);
  drawCombatEnvironment(ctx, level);
  const pExtension = extension(playerAttack);
  const oExtension = extension(opponentAttack);
  // Hold the contact silhouette during hitstop, then let the defender recoil.
  drawCombatFighter(ctx, { x: 254 + pExtension * 35, player: true, level, pose: playerPose.value === 'hit' && hitStop > 0 ? 'idle' : playerPose.value, kick: playerAttack?.kind === 'kick', extension: pExtension, time: sceneTime, reducedMotion: state.reducedMotion, boosted: state.stats.boostActive, sluggish: state.stats.sluggishTimer > 0 });
  drawCombatFighter(ctx, { x: 388 - oExtension * 37, player: false, level, pose: opponentPose.value === 'hit' && hitStop > 0 ? 'idle' : opponentPose.value, kick: opponentAttack?.kind === 'kick', extension: oExtension, time: sceneTime + 1, reducedMotion: state.reducedMotion });
  for (const particle of sparks) {
    if (hitStop <= 0) {
      particle.x += particle.vx * dt / 1000; particle.y += particle.vy * dt / 1000;
      particle.vy += dt * .12; particle.life -= dt;
    }
    ctx.fillStyle = particle.blocked ? '#9bc3b8' : '#dcb891';
    ctx.fillRect(Math.round(particle.x), Math.round(particle.y), 3, 3);
  }
  sparks = sparks.filter(particle => particle.life > 0);
  if (state.stats.sluggishTimer > 0) { ctx.fillStyle = '#9c703617'; ctx.fillRect(0, 0, 640, 380); }
  ctx.restore();
  applyPixelFilter(ctx);
}
function render(now: number) {
  if (!mounted) return;
  const dt = lastTime ? Math.min(40, now - lastTime) : 0;
  lastTime = now;
  if (!document.hidden && !state.showStatsModal) {
    update(dt);
    if (now - lastPaint >= 1000 / 30) {
      const ctx = canvasRef.value?.getContext('2d');
      if (ctx) draw(ctx, Math.min(80, now - lastPaint));
      lastPaint = now;
    }
  }
  frameId = requestAnimationFrame(render);
}
function handleKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.matches('input, textarea, select, [contenteditable="true"]') || event.repeat || battleOver.value) return;
  const key = event.key.toLowerCase();
  if (key === 'a') { event.preventDefault(); executePlayerAttack('punch'); }
  else if (key === 'd') { event.preventDefault(); executePlayerAttack('kick'); }
  else if (key === 's') { event.preventDefault(); startBlock(); }
  else if (event.code === 'Space' && !target?.closest('button')) { event.preventDefault(); boost(); }
}
function handleKeyUp(event: KeyboardEvent) { if (event.key.toLowerCase() === 's') stopBlock(); }
function loseFocus() { stopBlock(); lastTime = 0; }
function visibilityChanged() { if (document.hidden) loseFocus(); }
onMounted(() => {
  mounted = true;
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', loseFocus);
  window.addEventListener('pointerup', stopBlock);
  window.addEventListener('pointercancel', stopBlock);
  document.addEventListener('visibilitychange', visibilityChanged);
  frameId = requestAnimationFrame(render);
});
onUnmounted(() => {
  mounted = false;
  cancelAnimationFrame(frameId);
  playerAttack = null; opponentAttack = null; sparks = [];
  soundManager.stopCombatAmbience();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', loseFocus);
  window.removeEventListener('pointerup', stopBlock);
  window.removeEventListener('pointercancel', stopBlock);
  document.removeEventListener('visibilitychange', visibilityChanged);
});
</script>

<template>
  <section class="combat-wrapper" aria-label="Debt collection fight">
    <header class="bout-heading">
      <div><span class="bout-kicker">DEBT COLLECTION / 0{{ level }}</span><h2>{{ target.title }}</h2></div>
      <span class="bout-location">{{ target.subtitle }}</span>
    </header>
    <div class="combat-hud">
      <div class="fighter-card player-side">
        <div class="name-row"><span>YOU</span><span class="health-number">{{ playerHp }} <span>/ 160</span></span></div>
        <div class="pixel-meter" role="meter" aria-label="Your health" :aria-valuenow="playerHp" :aria-valuemin="0" :aria-valuemax="160">
          <div class="pixel-meter-fill" :class="{ danger: playerHp < 50 }" :style="{ width: `${playerHp / 160 * 100}%` }"></div>
        </div>
        <span class="fighter-condition" :class="{ 'condition-warning': state.stats.sluggishTimer > 0 }">{{ state.stats.boostActive ? 'SURGE / +50% DAMAGE' : state.stats.sluggishTimer > 0 ? 'CRASH / SLOW RECOVERY' : poseLabels[playerPose] }}</span>
      </div>
      <div class="vs-badge" aria-hidden="true">VS</div>
      <div class="fighter-card target-side">
        <div class="name-row"><span>{{ target.name }}</span><span class="health-number">{{ opponentHp }} <span>/ {{ target.maxHp }}</span></span></div>
        <div class="pixel-meter" role="meter" :aria-label="`${target.name} health`" :aria-valuenow="opponentHp" :aria-valuemin="0" :aria-valuemax="target.maxHp">
          <div class="pixel-meter-fill enemy" :style="{ width: `${opponentHp / target.maxHp * 100}%` }"></div>
        </div>
        <span class="fighter-condition" :class="{ 'condition-warning': opponentPose === 'windup' }">{{ poseLabels[opponentPose] }}</span>
      </div>
    </div>
    <div class="arena-frame">
      <canvas ref="canvasRef" width="640" height="380" class="arena-canvas" role="img" :aria-label="`Pixel-art fight in the ${target.title.toLowerCase()}. You face the ${target.name.toLowerCase()}.`"></canvas>
      <div class="arena-caption" aria-hidden="true"><span>SECTOR 0{{ level }}</span><span>NO WINNERS HERE</span></div>
      <div v-if="battleOver" class="battle-overlay">
        <span class="result-eyebrow">COLLECTION / {{ battleResult === 'win' ? 'COMPLETE' : 'FAILED' }}</span>
        <h3 class="result-title">{{ battleResult === 'win' ? 'TARGET SUBDUED' : 'DEFEATED / KICKED OUT' }}</h3>
        <p class="result-desc">{{ battleResult === 'win' ? 'Debt payment secured for the syndicate.' : 'The syndicate casts you back onto the streets.' }}</p>
        <button ref="resultButton" class="retro-btn result-button" @click="finishBattle">{{ battleResult === 'win' ? 'COLLECT EARNINGS & CONTINUE ➔' : 'ENTER THIEVES STAGE ➔' }}</button>
      </div>
    </div>
    <div class="combat-cue" :class="{ incoming: opponentPose === 'windup' && !battleOver }"><span class="cue-mark" aria-hidden="true">{{ opponentPose === 'windup' ? '!' : '+' }}</span>{{ enemyCue }}</div>
    <div class="controls-panel">
      <div class="action-buttons-grid">
        <button class="fight-control" aria-label="Punch [A]" :disabled="!canAttack" @click="executePlayerAttack('punch')"><span class="control-top"><kbd>A</kbd><strong>PUNCH</strong></span><span>Quick / 12 damage</span></button>
        <button class="fight-control" aria-label="Kick [D]" :disabled="!canAttack" @click="executePlayerAttack('kick')"><span class="control-top"><kbd>D</kbd><strong>KICK</strong></span><span>Heavy / 20 damage</span></button>
        <button class="fight-control guard-control" aria-label="Block [S]" :aria-pressed="playerPose === 'block'" :disabled="battleOver" @pointerdown.prevent="blockPointerDown" @pointerup="stopBlock" @pointercancel="stopBlock" @lostpointercapture="stopBlock" @click="accessibleBlockClick"><span class="control-top"><kbd>S</kbd><strong>BLOCK</strong></span><span>Hold / reduce damage</span></button>
        <button class="fight-control boost-control" aria-label="Boost [Space]" :disabled="state.stats.doses <= 0 || state.stats.boostActive || battleOver" @click="boost"><span class="control-top"><kbd>SPC</kbd><strong>BOOST</strong></span><span>{{ state.stats.boostActive ? 'Surge active' : `${state.stats.doses} doses / then crash` }}</span></button>
        <button class="surrender-control" :disabled="battleOver" @click="retreatFight">SURRENDER <span>↗</span></button>
      </div>
    </div>
    <p class="combat-live" role="status" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.combat-wrapper { display: flex; flex-direction: column; height: 100%; min-height: 0; box-sizing: border-box; overflow-y: auto; gap: 13px; padding: 20px; background: #101c24; color: #d6d4bc; }
.bout-heading, .combat-hud, .combat-cue, .controls-panel { flex-shrink: 0; }
.bout-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.bout-kicker { font: 10px/1.4 var(--font-terminal); letter-spacing: 2px; color: #8eac9f; }
.bout-heading h2 { margin: 6px 0 0; font-size: clamp(13px, 2vw, 20px); color: #e4d9b7; letter-spacing: 1px; }
.bout-location { font: 14px var(--font-terminal); color: #879992; text-align: right; }
.combat-hud { display: grid; grid-template-columns: minmax(0, 1fr) 38px minmax(0, 1fr); align-items: center; gap: 10px; padding: 15px 15px 11px; border: 1px solid #40544e; background: #17272d; }
.fighter-card { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.name-row { min-height: 26px; display: flex; align-items: center; justify-content: space-between; gap: 9px; font: 11px/1.35 var(--font-terminal); letter-spacing: .5px; }
.health-number { white-space: nowrap; font-size: 15px; color: #e7dfc5; }
.health-number > span { color: #7e948d; font-size: 11px; }
.pixel-meter { position: relative; height: 10px; overflow: hidden; background: #0b1921; box-shadow: inset 0 0 0 1px #3b504c; }
.pixel-meter::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(to right, transparent 0 17px, #15282d 17px 19px); pointer-events: none; }
.pixel-meter-fill { height: 100%; background: #81b29c; transition: width 130ms linear; }
.pixel-meter-fill.enemy { background: #be8c71; }
.pixel-meter-fill.danger { background: #c47a63; }
.fighter-condition { color: #93a498; font: 9px var(--font-terminal); letter-spacing: 1px; }
.condition-warning { color: #e0b47c; }
.vs-badge { color: #8c9a88; text-align: center; font: italic 17px Georgia, serif; }
.arena-frame { position: relative; flex: 1 1 0; min-height: 180px; border: 1px solid #566456; background: #101c26; overflow: hidden; }
.arena-canvas { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; image-rendering: pixelated; }
.arena-caption { position: absolute; inset: 13px 14px auto; display: flex; justify-content: space-between; font: 9px var(--font-terminal); letter-spacing: 1.8px; color: #b9c1a9; opacity: .75; pointer-events: none; }
.combat-cue { min-height: 36px; display: flex; align-items: center; gap: 11px; padding: 9px 12px; background: #1a2a2f; border-left: 3px solid #6e9988; font: 15px/1.3 var(--font-terminal); color: #b7c5b2; }
.combat-cue.incoming { background: #342e26; color: #edc28e; border-left-color: #d3a76e; }
.cue-mark { width: 15px; font-weight: 700; font-size: 18px; text-align: center; }
.action-buttons-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.fight-control { cursor: pointer; min-height: 69px; padding: 11px 10px; border: 1px solid #5a7568; border-bottom: 3px solid #466456; background: #223a3c; color: #d5dcc3; text-align: left; touch-action: none; }
.control-top { display: flex; align-items: center; gap: 9px; }
.control-top strong { font-size: 10px; letter-spacing: .6px; }
.control-top kbd { display: inline-grid; place-items: center; min-width: 21px; height: 23px; padding: 0 3px; border: 1px solid #7d9480; color: #aec5ab; font: 12px monospace; }
.fight-control > span:last-child { display: block; margin-top: 8px; color: #acbcb0; font: 11px var(--font-terminal); }
.fight-control:not(:disabled):hover, .fight-control[aria-pressed='true'] { background: #36524d; border-color: #bac8a7; }
.fight-control:disabled { opacity: .42; cursor: not-allowed; }
.boost-control { background: #38382c; border-color: #807754; }
.boost-control .control-top kbd { border-color: #9c8d63; color: #d0bd82; }
.surrender-control { grid-column: 1/-1; min-height: 44px; border: 0; padding: 8px 2px; background: transparent; color: #a6917f; text-align: right; font: 10px var(--font-terminal); letter-spacing: 1.1px; cursor: pointer; }
.surrender-control span { padding-left: 7px; font-size: 14px; }
.surrender-control:disabled { opacity: .4; cursor: not-allowed; }
button:focus-visible { outline: 2px solid #e0cea0; outline-offset: 3px; }
.battle-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px; padding: 25px; background: #0a1729dd; text-align: center; }
.result-eyebrow { font: 10px var(--font-terminal); letter-spacing: 2px; color: #9dae95; }
.result-title { margin: 0; font-size: clamp(13px, 2.8vw, 21px); line-height: 1.7; color: #e7d8b5; }
.result-desc { margin: 0; max-width: 390px; font: 18px/1.4 var(--font-terminal); color: #b7bca6; }
.result-button { margin-top: 5px; font-size: 9px; line-height: 1.8; }
.combat-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 600px) { .combat-wrapper { padding: 11px; gap: 10px; } .bout-location { max-width: 110px; font-size: 12px; } .combat-hud { padding: 9px; gap: 6px; grid-template-columns: minmax(0, 1fr) 19px minmax(0, 1fr); } .name-row { align-items: flex-start; flex-direction: column; gap: 3px; min-height: 37px; font-size: 9px; } .target-side .name-row { align-items: flex-end; text-align: right; } .target-side .fighter-condition { text-align: right; } .health-number { font-size: 13px; } .action-buttons-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .arena-caption { font-size: 7px; inset: 9px 10px auto; } .combat-cue { font-size: 13px; } .battle-overlay { gap: 8px; padding: 15px; } .result-desc { font-size: 14px; } }
@media (prefers-reduced-motion: reduce) { .pixel-meter-fill { transition: none; } }
</style>
