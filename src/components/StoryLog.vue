<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useGameState } from '../state/useGameState';
import type { StoryChoice } from '../types/game';
import DownfallScene from './DownfallScene.vue';

const { state, currentNode, selectChoice, resetGame, openStatsModal } = useGameState();
const sceneHeading = ref<HTMLElement | null>(null);
type Scene = 'school' | 'dose' | 'mirror' | 'debt' | 'enforcer' | 'escape' | 'loss' | 'collapse' | 'flatline';
const sceneByNode: Record<string, Scene> = {
  START_SCHOOL: 'school', ALLOWANCE_COVER_1: 'dose', ALLOWANCE_COVER_2: 'mirror',
  SHORTAGE_ASK_PARENT: 'mirror', PARENT_GIVES_LESS: 'mirror',
  FRIEND_ASK: 'school', FRIEND_GIVES_LESS: 'school',
  LOAN_SHARK_APPEARS: 'debt', LOAN_COVER_1: 'dose', LOAN_COVER_2: 'debt', LOAN_SHARK_CUTOFF: 'debt',
  STAGE_FIGHT_1_INTRO: 'enforcer', STAGE_FIGHT_2_INTRO: 'enforcer', STAGE_FIGHT_3_INTRO: 'enforcer',
  POLICE_RAID: 'escape', KICKED_OUT_TO_THIEVES: 'loss', THIEVES_STAGE_INTRO: 'escape',
  STAGE_ROB_2_INTRO: 'escape', STAGE_ROB_3_INTRO: 'escape', CLIMAX_ESCAPE: 'collapse',
  ENDING_COLLAPSE_EARLY: 'collapse',
};
const scene = computed<Scene>(() => sceneByNode[state.currentNodeId] ?? 'loss');
const chapter = computed(() => currentNode.value.stageTitle.split(' // '));
const isBeginning = computed(() => state.currentNodeId === 'START_SCHOOL');
const memories = computed(() => [
  { name: 'ALLOWANCE', value: state.stats.cash > 0 ? 'RUNNING LOW' : 'EMPTY POCKETS' },
  { name: 'TRUST', value: state.visitedNodeIds.includes('FRIEND_GIVES_LESS') ? 'BRIDGES BURNING' : state.visitedNodeIds.includes('PARENT_GIVES_LESS') ? 'FAMILY SUSPICIONS' : 'STILL THERE' },
  { name: 'DEBT', value: state.stats.debt > 0 ? 'INTEREST KEEPS GROWING' : 'NOTHING OWED' },
]);

function handleChoice(choice: StoryChoice) { selectChoice(choice); }
function playFinalChapter() {
  selectChoice({ text: 'Play the final chapter', targetNodeId: 'CLIMAX_ESCAPE' });
  selectChoice({ text: 'Gasp for breath...', action: { type: 'CINEMATIC' } });
}
watch(() => state.currentNodeId, async () => {
  await nextTick();
  sceneHeading.value?.focus({ preventScroll: true });
});
</script>

<template>
  <div class="story-layout retro-scroll">
    <section class="story-main" aria-label="Your story">
      <header class="chapter-heading">
        <div><p class="eyebrow">YOUR STORY <span>/</span> {{ chapter[0] }}</p>
          <h1 ref="sceneHeading" tabindex="-1">{{ isBeginning ? 'JUST ONCE.' : chapter[1] || chapter[0] }}</h1>
        </div>
        <span class="story-label">{{ isBeginning ? 'THE BEGINNING' : currentNode.age.toUpperCase() }}</span>
      </header>
      <div class="scene-container">
        <DownfallScene :key="state.currentNodeId" :scene="scene" :reduced-motion="state.reducedMotion" />
        <span class="scene-caption">{{ isBeginning ? 'WEST RIVER / AFTER SCHOOL' : currentNode.stageTitle }}</span>
      </div>
      <div class="active-card">
        <div class="dialogue-label"><span class="small-square"></span>{{ isBeginning ? 'IT STARTED WITH “JUST ONCE.”' : 'THE STORY CONTINUES' }}</div>
        <p class="situation-text">{{ currentNode.situation }}</p>
        <div v-if="currentNode.isEnding" class="ending-banner">
          <h2>THE ROAD ENDS HERE.</h2>
          <p>{{ currentNode.endingReason }}</p>
          <div class="ending-actions">
            <button class="retro-btn" @click="openStatsModal">View crisis statistics</button>
            <button class="retro-btn" @click="resetGame">Replay from school</button>
          </div>
        </div>
        <div v-else class="choices-container">
          <button v-for="choice in currentNode.choices" :key="choice.text" class="retro-btn choice-btn"
            :class="{ 'retro-btn-danger': choice.btnClass === 'danger', 'retro-btn-warning': choice.btnClass === 'warning' }"
            @click="handleChoice(choice)"><span class="choice-label">{{ choice.text }}</span><span aria-hidden="true">↗</span></button>
        </div>
        <p class="story-note">A fictional life. A choice that stays with you.</p>
      </div>
    </section>
    <aside class="history-panel">
      <div class="archive-heading"><span class="eyebrow">PERSONAL ARCHIVE</span><span aria-hidden="true">▤</span></div>
      <h2>What remains.</h2>
      <div class="connection-list">
        <div v-for="memory in memories" :key="memory.name" class="connection"><span>{{ memory.name }}</span><strong>{{ memory.value }}</strong></div>
      </div>
      <div class="history-header"><span>THE PAPER TRAIL</span><span aria-hidden="true">↓</span></div>
      <div class="history-list retro-scroll" aria-label="Story history">
        <article v-for="log in state.logs" :key="log.id" class="log-entry" :class="`log-${log.type}`">
          <div class="log-meta">{{ log.age }} <span>· {{ log.timestamp }}</span></div>
          <p>{{ log.text }}</p>
        </article>
      </div>
      <div v-if="isBeginning" class="chapter-shortcut">
        <p class="eyebrow">THE LAST NIGHT</p>
        <p>Some memories refuse to fade.</p>
        <button @click="playFinalChapter">Play the final chapter <span aria-hidden="true">→</span></button>
      </div>
      <p class="archive-footer">DRUG USE · VIOLENCE · LOSS<br>Take this story at your own pace.</p>
    </aside>
  </div>
</template>

<style scoped>
.story-layout { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 32px; padding: 30px; height: 100%; overflow-y: auto; }
.story-main { min-width: 0; }
.chapter-heading { display: flex; justify-content: space-between; gap: 14px; align-items: end; margin-bottom: 24px; }
.eyebrow { color: var(--retro-accent); font: bold 10px 'Courier New', monospace; letter-spacing: 1.8px; line-height: 1.6; }
.eyebrow span { opacity: .45; margin: 0 7px; }
h1 { color: var(--retro-text-light); font: bold clamp(19px, 2.2vw, 34px)/1.5 var(--font-pixel); letter-spacing: -1px; margin-top: 11px; overflow-wrap: anywhere; }
h1:focus { outline: none; }
.story-label { flex-shrink: 0; font: 9px 'Courier New', monospace; letter-spacing: 1px; color: var(--retro-muted); border: 1px solid var(--retro-border); padding: 6px 8px; margin-bottom: 5px; }
.scene-container { position: relative; border: 1px solid var(--retro-border); background: #151b1b; overflow: hidden; }
.scene-container :deep(canvas) { display: block; width: 100%; }
@media (min-width: 761px) {
  .scene-container { height: clamp(200px, 34vh, 360px); }
  .scene-container :deep(.downfall-scene) { height: 100%; aspect-ratio: auto; }
  .scene-container :deep(canvas) { height: 100%; object-fit: cover; object-position: center 72%; }
}
.scene-caption { position: absolute; bottom: 12px; left: 14px; color: #ece1bd; font: 9px 'Courier New', monospace; letter-spacing: 1.4px; background: #101412de; padding: 5px 8px; max-width: calc(100% - 28px); }
.active-card { padding: 23px 0 4px; }
.dialogue-label { display: flex; align-items: center; gap: 9px; font: bold 10px 'Courier New', monospace; color: var(--retro-accent); letter-spacing: 1.4px; }
.small-square { width: 5px; height: 5px; background: var(--retro-accent); }
.situation-text { font: 23px/1.35 var(--font-terminal); color: var(--retro-text-light); margin: 12px 0 22px; max-width: 830px; }
.choices-container { display: flex; flex-wrap: wrap; gap: 10px; }
.choice-btn { flex: 1 1 240px; display: flex; justify-content: space-between; text-align: left; padding: 17px 19px; font-size: 10px; line-height: 1.6; border-width: 1px; box-shadow: 3px 3px 0 #0006; }
.choice-label { max-width: 95%; }
.story-note { color: var(--retro-muted); font: 9px 'Courier New', monospace; margin-top: 17px; letter-spacing: .5px; }
.history-panel { display: flex; flex-direction: column; border-left: 1px solid var(--retro-border); padding-left: 26px; min-height: 0; }
.archive-heading { display: flex; justify-content: space-between; color: var(--retro-accent); }
.history-panel h2 { margin: 10px 0 25px; font: 27px var(--font-terminal); color: var(--retro-text-light); }
.connection-list { border-top: 1px solid var(--retro-border); }
.connection { padding: 13px 0; border-bottom: 1px solid var(--retro-border); display: flex; flex-direction: column; gap: 5px; }
.connection span { font: bold 9px 'Courier New', monospace; letter-spacing: 1px; color: var(--retro-muted); }
.connection strong { font: 10px 'Courier New', monospace; color: var(--retro-accent); letter-spacing: .6px; }
.history-header { margin: 25px 0 14px; display: flex; justify-content: space-between; font: 9px 'Courier New', monospace; letter-spacing: 1.5px; color: var(--retro-muted); }
.history-list { flex: 1; min-height: 120px; max-height: 40vh; overflow-y: auto; }
.log-entry { border-left: 1px solid var(--retro-border); padding: 0 10px 18px 14px; margin-left: 3px; position: relative; }
.log-entry::before { content: ''; position: absolute; left: -3px; top: 3px; width: 5px; height: 5px; background: var(--retro-accent); }
.log-meta { color: var(--retro-accent); font: 9px 'Courier New', monospace; text-transform: uppercase; margin-bottom: 7px; }
.log-meta span { color: var(--retro-muted); }
.log-entry p { font: 17px/1.2 var(--font-terminal); color: var(--retro-muted); }
.log-danger p { color: var(--retro-danger); }
.chapter-shortcut { padding: 17px 14px; border: 1px solid var(--retro-border); margin-top: 20px; background: var(--retro-bg-dark); }
.chapter-shortcut > p:nth-child(2) { font: 18px var(--font-terminal); margin: 8px 0 15px; }
.chapter-shortcut button { display: flex; gap: 12px; width: 100%; justify-content: space-between; background: none; border: 0; color: var(--retro-accent); text-align: left; font: bold 11px 'Courier New', monospace; cursor: pointer; padding: 8px 0; }
.chapter-shortcut button:hover { color: var(--retro-text-light); }
.archive-footer { font: 9px/1.8 'Courier New', monospace; color: var(--retro-muted); margin-top: 22px; }
.ending-banner { padding: 20px; border: 1px solid var(--retro-danger); background: #9e4b3010; }
.ending-banner h2 { color: var(--retro-danger); font-size: 12px; }
.ending-banner p { font: 20px/1.3 var(--font-terminal); margin: 12px 0 18px; }
.ending-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.ending-actions .retro-btn { font-size: 9px; border-width: 1px; }
@media (min-width: 1500px) { .story-layout { padding: 35px max(35px, calc((100vw - 1450px) / 2)); } }
@media (max-width: 1000px) { .story-layout { grid-template-columns: minmax(0, 1fr) 220px; gap: 22px; padding: 22px; } .history-panel { padding-left: 20px; } .story-label { display: none; } }
@media (max-width: 760px) { .story-layout { display: block; padding: 20px 16px; } .history-panel { border-left: 0; border-top: 1px solid var(--retro-border); padding: 22px 0 0; margin-top: 28px; } .chapter-heading { margin-bottom: 18px; } h1 { font-size: clamp(17px, 4vw, 25px); } .connection-list { display: flex; gap: 20px; } .connection { flex: 1; } .history-list { max-height: 180px; min-height: auto; } .chapter-shortcut { margin-top: 12px; } .situation-text { font-size: 22px; } .choice-btn { flex-basis: 100%; font-size: 9px; padding: 16px 13px; } }
</style>
