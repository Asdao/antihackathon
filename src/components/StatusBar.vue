<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '../state/useGameState';

const { state } = useGameState();

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
    <div class="stats-row">
      <!-- Age -->
      <div class="stat-pill age-pill">
        {{ state.stats.age }}
      </div>

      <!-- Cash -->
      <div class="stat-pill">
        <span class="pill-label">CASH</span>
        <span class="pill-val text-green">${{ state.stats.cash }}</span>
      </div>

      <!-- Debt (Highlighted only when in debt) -->
      <div class="stat-pill" :class="{ 'has-debt': state.stats.debt > 0 }">
        <span class="pill-label">DEBT</span>
        <span class="pill-val" :class="state.stats.debt > 0 ? 'text-danger' : ''">
          ${{ state.stats.debt }}
        </span>
      </div>

      <!-- Health Bar -->
      <div class="stat-pill meter-pill" title="Health">
        <span class="pill-label">HP</span>
        <div class="mini-meter">
          <div 
            class="mini-meter-fill" 
            :class="healthColor"
            :style="{ width: `${state.stats.health}%` }"
          ></div>
        </div>
      </div>

      <!-- Stamina Bar -->
      <div class="stat-pill meter-pill" title="Stamina">
        <span class="pill-label">STA</span>
        <div class="mini-meter">
          <div 
            class="mini-meter-fill" 
            :class="staminaColor"
            :style="{ width: `${state.stats.stamina}%` }"
          ></div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.status-bar-container {
  background-color: var(--retro-bg-darkest);
  border-bottom: 1px solid var(--retro-accent);
  padding: 4px 10px;
  z-index: 10;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  letter-spacing: 0.5px;
}

.age-pill {
  background: var(--retro-bg-dark);
  border: 1px solid var(--retro-accent);
  color: var(--retro-warning);
  font-weight: bold;
  padding: 2px 6px;
  font-size: 8px;
}

.pill-label {
  opacity: 0.75;
  font-size: 8px;
}

.pill-val {
  font-weight: bold;
}

.text-green {
  color: #52b788;
}

.text-danger {
  color: var(--retro-danger);
}

.has-debt .pill-label {
  color: var(--retro-danger);
}

.meter-pill {
  flex: 1;
  min-width: 65px;
  max-width: 110px;
}

.mini-meter {
  flex: 1;
  height: 8px;
  background: #000;
  border: 1px solid var(--retro-accent);
  overflow: hidden;
}

.mini-meter-fill {
  height: 100%;
  background: var(--retro-accent);
  transition: width 0.2s ease;
}

.mini-meter-fill.warning {
  background: var(--retro-warning);
}

.mini-meter-fill.danger {
  background: var(--retro-danger);
}
</style>
