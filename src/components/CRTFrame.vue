<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, toggleTheme } = useGameState();
const isMuted = computed(() => soundManager.getMuted());

function toggleAudio() {
  soundManager.toggleMute();
  soundManager.playClick();
}
</script>

<template>
  <div class="handheld-bezel" :data-theme="state.theme">
    <!-- Clean Minimalist Header Utility Bar -->
    <header class="frame-top-bar">
      <div class="app-title">
        <span class="pulse-dot">●</span>
        <span>SHADOW SPIRAL</span>
      </div>
      <div class="frame-controls">
        <button class="frame-btn" @click="toggleTheme" title="Switch Retro Palette">
          PAL: {{ state.theme.toUpperCase() }}
        </button>
        <button class="frame-btn" @click="toggleAudio" title="Toggle Sound">
          {{ isMuted ? '🔇 MUTED' : '🔊 SND' }}
        </button>
      </div>
    </header>

    <!-- Clean Screen Housing -->
    <div class="crt-monitor">
      <!-- CRT Scanline & Vignette Overlays -->
      <div v-if="state.scanlinesEnabled" class="crt-overlay"></div>
      <div class="crt-vignette"></div>

      <!-- Main Slot Content -->
      <div class="screen-content">
        <slot></slot>
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

.frame-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 10px;
  height: 24px;
  background: var(--retro-bg-darkest);
  border-bottom: 1px solid var(--retro-bg-dark);
}

.app-title {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--retro-text-light);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
}

.pulse-dot {
  color: var(--retro-danger);
  font-size: 8px;
}

.frame-controls {
  display: flex;
  gap: 6px;
}

.frame-btn {
  background: transparent;
  border: 1px solid var(--retro-accent);
  color: var(--retro-text-light);
  font-family: var(--font-pixel);
  font-size: 8px;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.frame-btn:hover {
  background: var(--retro-accent);
  color: var(--retro-bg-darkest);
}

.crt-monitor {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-accent);
  border-radius: 4px;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.7);
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
</style>
