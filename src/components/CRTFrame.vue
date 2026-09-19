<script setup lang="ts">
import { useGameState } from '../state/useGameState';

const { state } = useGameState();
</script>

<template>
  <div class="handheld-bezel" :data-theme="state.theme">
    <!-- Monitor Outer Cabinet Shell -->
    <div class="bezel-top-bar">
      <div class="vent-slots">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="brand-title">RETRO ARCADE // ANTI-DRUG SIMULATOR</div>
      <div class="power-led-group">
        <div class="power-led" :class="{ 'led-warning': state.stats.health < 30 }"></div>
        <span class="power-label">POWER</span>
      </div>
    </div>

    <!-- Screen Housing -->
    <div class="crt-monitor crt-flicker">
      <!-- CRT Scanline & Vignette Overlays -->
      <div v-if="state.scanlinesEnabled" class="crt-overlay"></div>
      <div class="crt-vignette"></div>

      <!-- Main Slot Content -->
      <div class="screen-content">
        <slot></slot>
      </div>
    </div>

    <!-- Handheld Bottom Controls Bar (Volume / Mode / Credits) -->
    <div class="bezel-bottom-bar">
      <div class="speaker-grill">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="model-info">MODEL DMG-08 / AGY ENGINE</div>
      <div class="speaker-grill">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.handheld-bezel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  height: 96vh;
  margin: 2vh auto;
  background: #181c18;
  border: 6px solid #283028;
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.95), 
    inset 0 2px 6px rgba(255, 255, 255, 0.1),
    inset 0 -4px 10px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
}

[data-theme="amber"] {
  background: #20160a;
  border-color: #3b2810;
}

[data-theme="neon"] {
  background: #0d0e1c;
  border-color: #1a1c38;
}

.bezel-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 8px;
}

.vent-slots {
  display: flex;
  gap: 4px;
}

.vent-slots span {
  display: block;
  width: 18px;
  height: 4px;
  background: #0c0e0c;
  border-radius: 2px;
}

.brand-title {
  font-size: 10px;
  color: #6d846d;
  letter-spacing: 1px;
}

.power-led-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.power-led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52b788;
  box-shadow: 0 0 8px #52b788;
}

.power-led.led-warning {
  background: #e63946;
  box-shadow: 0 0 10px #e63946;
  animation: crtFlicker 0.4s infinite;
}

.power-label {
  font-size: 8px;
  color: #6d846d;
}

.crt-monitor {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--retro-bg-darkest);
  border: 4px solid var(--retro-accent);
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.85);
  overflow: hidden;
}

.screen-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.bezel-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 0 12px;
}

.speaker-grill {
  display: flex;
  gap: 6px;
}

.speaker-grill span {
  display: block;
  width: 6px;
  height: 6px;
  background: #0a0d0a;
  border-radius: 50%;
}

.model-info {
  font-size: 8px;
  color: #556b55;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .handheld-bezel {
    height: 100vh;
    margin: 0;
    border-radius: 0;
    padding: 8px;
    border: none;
  }
}
</style>
