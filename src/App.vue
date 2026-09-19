<script setup lang="ts">
import { useGameState } from './state/useGameState';
import CRTFrame from './components/CRTFrame.vue';
import StatusBar from './components/StatusBar.vue';
import StoryLog from './components/StoryLog.vue';
import ShadowFighter from './components/ShadowFighter.vue';
import ParkourRunner from './components/ParkourRunner.vue';
import EndingAnimation from './components/EndingAnimation.vue';

const { state } = useGameState();
</script>

<template>
  <main class="app-root" :data-theme="state.theme">
    <CRTFrame>
      <!-- Top Persistent Status HUD -->
      <StatusBar />

      <!-- Main Game View Switcher -->
      <div class="content-viewport">
        <transition name="fade" mode="out-in">
          <StoryLog v-if="state.mode === 'STORY'" />
          <ShadowFighter v-else-if="state.mode === 'SHADOW_FIGHTER'" />
          <ParkourRunner v-else-if="state.mode === 'PARKOUR_RUNNER'" />
          <EndingAnimation v-else-if="state.mode === 'ENDING_SEQUENCE'" />
        </transition>
      </div>
    </CRTFrame>
  </main>
</template>

<style>
@import './assets/styles/retro.css';

.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #050505;
}

.content-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 90px);
  overflow: hidden;
  position: relative;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
