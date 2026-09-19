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
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  margin: 0;
  background: #101410;
  padding: 4px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

[data-theme="amber"] {
  background: #1a1005;
}

[data-theme="neon"] {
  background: #080812;
}

.bezel-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  padding: 2px 8px;
  height: 20px;
}

.vent-slots {
  display: flex;
  gap: 3px;
}

.vent-slots span {
  display: block;
  width: 14px;
  height: 3px;
  background: #0c0e0c;
  border-radius: 1px;
}

.brand-title {
  font-size: 9px;
  color: #6d846d;
  letter-spacing: 1px;
}

.power-led-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.power-led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #52b788;
  box-shadow: 0 0 6px #52b788;
}

.power-led.led-warning {
  background: #e63946;
  box-shadow: 0 0 8px #e63946;
  animation: crtFlicker 0.4s infinite;
}

.power-label {
  font-size: 7px;
  color: #6d846d;
}

.crt-monitor {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--retro-bg-darkest);
  border: 3px solid var(--retro-accent);
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  min-height: 0;
}

.screen-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.bezel-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
  padding: 2px 8px;
  height: 16px;
}

.speaker-grill {
  display: flex;
  gap: 4px;
}

.speaker-grill span {
  display: block;
  width: 4px;
  height: 4px;
  background: #0a0d0a;
  border-radius: 50%;
}

.model-info {
  font-size: 7px;
  color: #556b55;
  letter-spacing: 1px;
}
</style>
