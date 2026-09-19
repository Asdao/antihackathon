<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, triggerDrugBoost, toggleTheme } = useGameState();

const isMuted = computed(() => soundManager.getMuted());

function toggleAudio() {
  soundManager.toggleMute();
  soundManager.playClick();
}

function handleBoost() {
  triggerDrugBoost();
}

const healthColor = computed(() => {
  if (state.stats.health < 25) return 'danger';
  if (state.stats.health < 55) return 'warning';
  return '';
});

const staminaColor = computed(() => {
  if (state.stats.stamina < 30) return 'danger';
  return '';
});
</script>

<template>
  <header class="status-bar-container">
    <!-- Top System Row -->
    <div class="sys-row">
      <div class="sys-title">
        <span class="blinking-dot">●</span>
        <span>SHADOW SPIRAL</span>
        <span class="age-tag">[{{ state.stats.age }}]</span>
      </div>

      <div class="sys-controls">
        <button class="icon-btn" @click="toggleTheme" title="Switch Retro Palette">
          PAL: {{ state.theme.toUpperCase() }}
        </button>
        <button class="icon-btn" @click="toggleAudio" title="Toggle 8-bit Audio">
          {{ isMuted ? '🔇 MUTED' : '🔊 SND' }}
        </button>
      </div>
    </div>

    <!-- Financial & Chemical Stats -->
    <div class="stats-grid">
      <!-- Cash -->
      <div class="stat-box">
        <span class="stat-label">CASH:</span>
        <span class="stat-value text-green">${{ state.stats.cash }}</span>
      </div>

      <!-- Debt -->
      <div class="stat-box">
        <span class="stat-label">DEBT:</span>
        <span class="stat-value" :class="state.stats.debt > 0 ? 'text-danger' : ''">
          ${{ state.stats.debt }}
        </span>
      </div>

      <!-- Escalating Drug Cost -->
      <div class="stat-box">
        <span class="stat-label">DOSE COST:</span>
        <span class="stat-value text-warning">${{ state.stats.drugCost }}</span>
      </div>

      <!-- Health Meter -->
      <div class="stat-box meter-stat">
        <div class="meter-header">
          <span class="stat-label">HEALTH</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill" 
            :class="healthColor"
            :style="{ width: `${state.stats.health}%` }"
          ></div>
        </div>
      </div>

      <!-- Stamina Meter -->
      <div class="stat-box meter-stat">
        <div class="meter-header">
          <span class="stat-label">STAMINA</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill" 
            :class="staminaColor"
            :style="{ width: `${state.stats.stamina}%` }"
          ></div>
        </div>
      </div>

      <!-- Addiction Meter -->
      <div class="stat-box meter-stat">
        <div class="meter-header">
          <span class="stat-label">ADDICTION</span>
        </div>
        <div class="pixel-meter">
          <div 
            class="pixel-meter-fill danger" 
            :style="{ width: `${state.stats.addiction}%` }"
          ></div>
        </div>
      </div>

      <!-- Drug Inventory & Boost Action -->
      <div class="stat-box boost-stat">
        <div class="dose-count">
          <span class="stat-label">DOSE:</span>
          <span class="stat-value text-warning">{{ state.stats.doses > 0 ? '💊 READY' : 'EMPTY' }}</span>
        </div>

        <button 
          class="retro-btn boost-btn" 
          :class="{ 
            'active-boost': state.stats.boostActive,
            'sluggish-alert': state.stats.sluggishTimer > 0 
          }"
          :disabled="state.stats.doses <= 0 && !state.stats.boostActive"
          @click="handleBoost"
          title="Consumes dose for temporary surge (Cost: long-term health & crash)"
        >
          <template v-if="state.stats.boostActive">
            ⚡ SURGE ACTIVE
          </template>
          <template v-else-if="state.stats.sluggishTimer > 0">
            💤 CRASHED
          </template>
          <template v-else>
            BOOST [SPACE]
          </template>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.status-bar-container {
  background-color: var(--retro-bg-darkest);
  border-bottom: 3px solid var(--retro-accent);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed var(--retro-bg-dark);
  padding-bottom: 6px;
}

.sys-title {
  font-size: 11px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.blinking-dot {
  color: var(--retro-danger);
  animation: crtFlicker 0.8s infinite;
}

.age-tag {
  color: var(--retro-warning);
  font-size: 10px;
}

.sys-controls {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: var(--retro-bg-dark);
  border: 1px solid var(--retro-accent);
  color: var(--retro-text-light);
  font-family: var(--font-pixel);
  font-size: 9px;
  padding: 4px 8px;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--retro-accent);
  color: var(--retro-bg-darkest);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  align-items: center;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.meter-stat {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.meter-header {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
}

.stat-label {
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
}

.text-green {
  color: #a7f3d0;
}

.text-danger {
  color: var(--retro-danger);
}

.text-warning {
  color: var(--retro-warning);
}

.boost-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dose-count {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
}

.boost-btn {
  padding: 4px 8px;
  font-size: 8px;
  width: 100%;
}

.active-boost {
  background: var(--retro-warning) !important;
  color: #000 !important;
  animation: crtFlicker 0.2s infinite;
}

.sluggish-alert {
  background: var(--retro-danger) !important;
  color: #fff !important;
  animation: glitchShake 0.4s infinite;
}
</style>
