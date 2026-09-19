<script setup lang="ts">
import { ref } from 'vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

const { state, toggleTheme, toggleMotion } = useGameState();
const isMuted = ref(soundManager.getMuted());
const volume = ref(Math.round(soundManager.getVolume() * 100));

function toggleAudio() {
  isMuted.value = soundManager.toggleMute();
  soundManager.playClick();
}

function setVolume(event: Event) {
  volume.value = Number((event.target as HTMLInputElement).value);
  soundManager.setVolume(volume.value / 100);
}
</script>

<template>
  <div class="handheld-bezel" :data-theme="state.theme">
    <header class="frame-top-bar">
      <div class="app-title">
        <span class="brand-symbol" aria-hidden="true">▧</span>
        <span>SHADOW SPIRAL</span>
        <span class="edition-label">AN INTERACTIVE TRAGEDY</span>
      </div>
      <div class="frame-controls">
        <button class="frame-btn" @click="toggleTheme" aria-label="Switch retro color palette">
          {{ state.theme.toUpperCase() }}
        </button>
        <button class="frame-btn" @click="toggleMotion" :aria-pressed="state.reducedMotion" aria-label="Reduce animation">
          {{ state.reducedMotion ? 'MOTION: LOW' : 'MOTION: FULL' }}
        </button>
        <button class="frame-btn" @click="toggleAudio" :aria-pressed="isMuted" aria-label="Mute sound">
          {{ isMuted ? 'SOUND: OFF' : 'SOUND: ON' }}
        </button>
        <label class="volume-control" :class="{ 'volume-muted': isMuted }">
          <span aria-hidden="true">VOL</span>
          <input type="range" min="0" max="100" step="5" :value="volume"
            aria-label="Sound volume" :aria-valuetext="`${volume} percent${isMuted ? ', muted' : ''}`"
            @input="setVolume" />
        </label>
      </div>
    </header>
    <div class="crt-monitor">
      <div v-if="state.scanlinesEnabled" class="crt-overlay" aria-hidden="true"></div>
      <div class="crt-vignette" aria-hidden="true"></div>
      <div class="screen-content"><slot></slot></div>
    </div>
    <footer class="frame-footer"><span>A LIFE UNRAVELLING</span><span>FICTION / CHOICES / CONSEQUENCES</span></footer>
  </div>
</template>

<style scoped>
.handheld-bezel { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0 22px; background: var(--retro-bg-darkest); overflow: hidden; }
.frame-top-bar { display: flex; flex-shrink: 0; justify-content: space-between; align-items: center; gap: 14px; min-height: 64px; }
.app-title { display: flex; align-items: center; gap: 12px; color: var(--retro-text-light); font-size: 10px; letter-spacing: 1px; white-space: nowrap; }
.brand-symbol { color: var(--retro-accent); font: 32px var(--font-terminal); }
.edition-label { margin-left: 12px; padding-left: 22px; border-left: 1px solid var(--retro-accent); font: 10px 'Courier New', monospace; color: var(--retro-muted); letter-spacing: 1.5px; }
.frame-controls { display: flex; gap: 8px; }
.volume-control { display: flex; align-items: center; gap: 6px; min-height: 32px; color: var(--retro-accent); font: bold 8px 'Courier New', monospace; }
.volume-control input { width: 68px; height: 28px; cursor: pointer; accent-color: var(--retro-accent); }
.volume-control input:focus-visible { outline: 2px solid var(--retro-text-light); outline-offset: 3px; }
.volume-muted { opacity: .6; }
.frame-btn { background: transparent; border: 1px solid var(--retro-border); color: var(--retro-text-light); font: bold 9px 'Courier New', monospace; padding: 9px 10px; cursor: pointer; letter-spacing: .5px; }
.frame-btn:hover { background: var(--retro-bg-dark); border-color: var(--retro-accent); }
.crt-monitor { flex: 1; display: flex; flex-direction: column; position: relative; border: 1px solid var(--retro-border); border-radius: 0; box-shadow: none; overflow: hidden; min-height: 0; }
.screen-content { flex: 1; display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; position: relative; z-index: 10; }
.frame-footer { display: flex; flex-shrink: 0; justify-content: space-between; padding: 11px 0; color: var(--retro-muted); font: 9px 'Courier New', monospace; letter-spacing: 1.4px; }
@media (max-width: 1100px) { .edition-label { display: none; } }
@media (max-width: 800px) { .handheld-bezel { padding: 0 10px; } }
@media (max-width: 480px) { .handheld-bezel { padding: 0 6px; } .frame-top-bar { flex-wrap: wrap; gap: 5px; padding: 10px 4px; } .app-title { font-size: 9px; } .brand-symbol { font-size: 24px; } .frame-controls { margin-left: auto; gap: 4px; } .frame-btn { padding: 8px 6px; font-size: 8px; } .frame-footer { font-size: 7px; letter-spacing: .4px; } }
</style>
