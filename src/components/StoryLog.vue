<script setup lang="ts">
import { useGameState } from '../state/useGameState';
import type { StoryChoice } from '../types/game';

const { state, currentNode, selectChoice, resetGame, openStatsModal } = useGameState();

function handleChoice(choice: StoryChoice) {
  selectChoice(choice);
}
</script>

<template>
  <div class="story-layout">
    <!-- Main Active Decision Box (BitLife-style Event Window) -->
    <div class="active-card">
      <div class="card-header">
        <span class="stage-tag">{{ currentNode.stageTitle }}</span>
        <span class="node-id">{{ currentNode.id }}</span>
      </div>

      <div class="situation-box">
        <p class="situation-text">{{ currentNode.situation }}</p>
      </div>

      <!-- Ending Banner if this node is an Ending -->
      <div v-if="currentNode.isEnding" class="ending-banner">
        <div class="ending-skull">☠</div>
        <div class="ending-title">STORYLINE TERMINATED</div>
        <div class="ending-desc">{{ currentNode.endingReason }}</div>
        <div class="ending-actions">
          <button class="retro-btn stats-trigger-btn" @click="openStatsModal">
            📊 VIEW CRISIS STATISTICS
          </button>
          <button class="retro-btn restart-btn" @click="resetGame">
            ↻ REPLAY FROM SCHOOL
          </button>
        </div>
      </div>

      <!-- Choice Actions -->
      <div v-else class="choices-container">
        <button
          v-for="(choice, idx) in currentNode.choices"
          :key="idx"
          class="retro-btn choice-btn"
          :class="{
            'retro-btn-danger': choice.btnClass === 'danger',
            'retro-btn-warning': choice.btnClass === 'warning'
          }"
          @click="handleChoice(choice)"
        >
          <span class="choice-num">▶</span>
          <span class="choice-label">{{ choice.text }}</span>
        </button>
      </div>
    </div>

    <!-- Past Journal / Life Log (BitLife scroll history) -->
    <div class="history-panel">
      <div class="history-header">
        <span>LIFE TIMELINE / LOG ARCHIVE</span>
      </div>

      <div class="history-list retro-scroll">
        <div
          v-for="log in state.logs"
          :key="log.id"
          class="log-entry"
          :class="`log-${log.type}`"
        >
          <div class="log-meta">
            <span class="log-age">{{ log.age }}</span>
            <span class="log-time">{{ log.timestamp }}</span>
          </div>
          <div class="log-text">{{ log.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  overflow: hidden;
  padding: 12px;
}

.active-card {
  background: var(--retro-bg-dark);
  border: 3px solid var(--retro-accent);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed var(--retro-accent);
  padding-bottom: 8px;
}

.stage-tag {
  color: var(--retro-warning);
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: bold;
}

.node-id {
  font-size: 9px;
  opacity: 0.5;
}

.situation-box {
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-accent);
  padding: 14px;
}

.situation-text {
  font-family: var(--font-terminal);
  font-size: 20px;
  line-height: 1.4;
  color: var(--retro-text-light);
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-btn {
  justify-content: flex-start;
  text-align: left;
  line-height: 1.4;
  padding: 12px 14px;
  font-size: 11px;
}

.choice-num {
  color: var(--retro-warning);
  margin-right: 6px;
}

.ending-banner {
  background: #2a0808;
  border: 3px solid var(--retro-danger);
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ending-skull {
  font-size: 32px;
  color: var(--retro-danger);
  animation: glitchShake 0.6s infinite;
}

.ending-title {
  color: var(--retro-danger);
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 2px;
}

.ending-desc {
  font-family: var(--font-terminal);
  font-size: 18px;
  color: #ffb4b8;
}

.ending-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 320px;
  margin-top: 6px;
}

.stats-trigger-btn {
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-warning);
  color: var(--retro-warning);
  font-size: 11px;
  padding: 10px;
}

.stats-trigger-btn:hover {
  background: var(--retro-warning);
  color: #000;
}

.restart-btn {
  background: var(--retro-danger);
  color: #fff;
  padding: 10px;
  font-size: 11px;
}

.history-panel {
  flex: 1;
  min-height: 140px;
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-bg-dark);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  background: var(--retro-bg-dark);
  padding: 6px 10px;
  font-size: 9px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--retro-accent);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-entry {
  padding: 6px 8px;
  border-left: 3px solid var(--retro-accent);
  background: rgba(0, 0, 0, 0.3);
  font-size: 10px;
}

.log-meta {
  display: flex;
  gap: 8px;
  font-size: 8px;
  opacity: 0.6;
  margin-bottom: 2px;
}

.log-info {
  border-left-color: var(--retro-accent);
}

.log-warning {
  border-left-color: var(--retro-warning);
  color: var(--retro-warning);
}

.log-danger {
  border-left-color: var(--retro-danger);
  color: #ff858d;
}

.log-success {
  border-left-color: #52b788;
  color: #b7e4c7;
}
</style>
