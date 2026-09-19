<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import DownfallScene from './DownfallScene.vue';
import { useGameState } from '../state/useGameState';
import { soundManager } from '../audio/SoundManager';

type Scene = 'school' | 'dose' | 'shortage' | 'debt' | 'escape' | 'collapse' | 'flatline';
interface MemoryChoice { label: string; detail: string; response: string; keepsake: string }
interface Memory {
  scene: Scene;
  time: string;
  title: string;
  subtitle: string;
  body: string;
  quote: string;
  speaker: string;
  evidence: string;
  choices: MemoryChoice[];
}

const { state, resetGame, openStatsModal } = useGameState();
// The six flashback lines are preserved from Noah's original ending.
const memories: Memory[] = [
  {
    scene: 'school', time: 'AGE 16 · BEHIND THE GYM', title: '“Just one pill to study.”',
    subtitle: 'SCHOOL // FIRST DOSE',
    body: 'Offered a prescription stimulant behind gym bleachers. “Takes exam stress off. Just once.” The first memory is the promise that made it sound easy.',
    quote: 'AGE 16: "Just one pill to study... everybody does it."', speaker: 'THE FIRST RATIONALIZATION',
    evidence: 'Exam pressure. One pill. “Just once.”',
    choices: [
      { label: 'Remember the offer', detail: 'Behind the gym bleachers.', response: '“Takes exam stress off. Just once.” You take it. The story begins with the belief that one pill will stay one pill.', keepsake: '“Just one pill to study... everybody does it.”' },
      { label: 'Remember the pressure', detail: 'The reason you told yourself.', response: 'You wanted to study. You told yourself everybody did it. That was the first explanation; more would follow.', keepsake: '“Just one pill to study... everybody does it.”' },
    ],
  },
  {
    scene: 'dose', time: 'AGE 16 · ALLOWANCE', title: 'The allowance covers it.',
    subtitle: 'SCHOOL // TOLERANCE',
    body: 'The rush was intense, but cravings return mid-week. Your weekly allowance covers the dealer. Then tolerance rises. You skip meals and tremble through morning classes.',
    quote: 'ALLOWANCE: "My weekly pocket money covers it easily."', speaker: 'THE SECOND RATIONALIZATION',
    evidence: '$25 a week. Then more. Then nothing left.',
    choices: [
      { label: 'Count the allowance', detail: 'Follow the weekly $25.', response: 'Weekly allowance covers the pills until it does not. Tolerance doubles. The same pocket money no longer stretches far enough.', keepsake: '“My weekly pocket money covers it easily.”' },
      { label: 'Remember the classroom', detail: 'Notice what the rush cost.', response: 'Skipping meals. Trembling in morning classes. The promise was easier studying; now getting through the morning is the problem.', keepsake: 'Tolerance rising. Skipping meals.' },
    ],
  },
  {
    scene: 'shortage', time: 'AGE 16–17 · SHORTAGE', title: 'There is no more money.',
    subtitle: 'FAMILY & FRIENDS // BORROWING',
    body: 'Broke. Chills, sweating, and tremors. The dealer cuts you off without cash. You turn toward the people whose trust you have been spending along with their money.',
    quote: 'SHORTAGE: "Mom warned me that money doesn\'t grow on trees..."', speaker: 'THE WARNING YOU REMEMBER',
    evidence: 'Parents grow suspicious. A friend lends bus fare. Trust frays.',
    choices: [
      { label: 'Remember your parents', detail: 'The $50 request. The $15 warning.', response: 'They notice your bloodshot eyes. They refuse $50, but hand over $15 with a strict warning. It is less than you wanted.', keepsake: '“Mom warned me that money doesn’t grow on trees...”' },
      { label: 'Remember your friend', detail: '“You look sick, man.”', response: 'Shivering outside the cafeteria, you ask your best friend for cash. The $10 bus fare barely covers half a dose. Your friend cuts contact.', keepsake: 'A friend lent $10. Trust was fraying.' },
    ],
  },
  {
    scene: 'debt', time: 'AGE 17–18 · THE LOAN', title: 'The loan shark smiles.',
    subtitle: 'DEBT // THE AVALANCHE',
    body: 'A black car stops outside school. “$300 today, weekly interest.” The cash buys a binge. The payment becomes $600. Borrowing again pushes the debt to $3,000.',
    quote: 'DEBT: "The loan shark smiled. He said he was helping me."', speaker: 'THE PROMISE THAT BECAME A THREAT',
    evidence: '$300 borrowed. $600 demanded. $3,000 owed.',
    choices: [
      { label: 'Read the amount due', detail: 'Follow the growing debt.', response: '“Payment due with interest ($600).” You borrow more to cover it. The debt snowballs to $3,000 while you hide from your family.', keepsake: 'Borrowing again turned $600 into $3,000.' },
      { label: 'Remember the threat', detail: '“No more loans!”', response: 'Enforcers corner you. “You owe $3,000. Collect debts for us or we break your legs.” The offer of help has become a demand.', keepsake: '“The loan shark smiled. He said he was helping me.”' },
    ],
  },
  {
    scene: 'escape', time: 'AGE 18–19 · THE GETAWAY', title: 'There is nowhere to stop.',
    subtitle: 'SYNDICATE // SIRENS // ROOFTOPS',
    body: 'Debt collection for the syndicate. Police sirens. Desperate street theft. The stolen cash goes on more drugs, and each getaway takes more from your body. Search helicopters sweep the high-rises.',
    quote: 'ALLEY: "Running from police sirens on rooftop tiles..."', speaker: 'THE MEMORY THAT WILL NOT SLOW DOWN',
    evidence: 'Storekeeper. Gambler. Warehouse. Alley. Rooftop.',
    choices: [
      { label: 'Remember the syndicate', detail: 'What working off the debt meant.', response: 'They send you to collect from a storekeeper, a gambler, and a warehouse bouncer. Violence replaces repayment. Then the warehouse doors burst open: “POLICE!”', keepsake: 'Debt collection ended in a police raid.' },
      { label: 'Follow the rooftop chase', detail: 'The last stolen cash.', response: 'From an alley sprint to a penthouse cash box. Lungs burning, vision narrowing, you keep running beneath the searchlights. The money never lasts.', keepsake: '“Running from police sirens on rooftop tiles...”' },
    ],
  },
  {
    scene: 'collapse', time: 'AGE 19 · THE FINAL HEARTBEAT', title: '“I can’t draw air.”',
    subtitle: 'COLLAPSE // FINAL HEARTBEAT',
    body: 'You leap past the fire escape onto the water tower. Stolen cash in hand. Agonizing pain seizes your chest. The chase is over. The memories arrive all at once.',
    quote: 'CHEST: "My heart is bursting... I can\'t draw air..."', speaker: 'THE LAST MOMENT',
    evidence: 'The water tower. Stolen cash. A heartbeat slipping away.',
    choices: [
      { label: 'Gasp for breath', detail: 'Stay with the final moment.', response: 'The cash is still in your hand. You try to draw another breath. The memories fall quiet. The heartbeat stops.', keepsake: '“My heart is bursting... I can’t draw air...”' },
      { label: 'Listen to the heartbeat', detail: 'Follow the rhythm to silence.', response: 'A racing beat. A broken rhythm. Then a flat line. There are no more rooftops to cross, and no more time to spend.', keepsake: 'A racing beat. A broken rhythm. Then silence.' },
    ],
  },
];

const chapterIndex = ref(0);
const selectedChoice = ref<number | null>(null);
const remembered = ref<string[]>([]);
const headingRef = ref<HTMLHeadingElement | null>(null);
const endingRef = ref<HTMLElement | null>(null);
const isComplete = computed(() => chapterIndex.value >= memories.length);
const chapter = computed(() => memories[Math.min(chapterIndex.value, memories.length - 1)]!);
const choice = computed(() => selectedChoice.value === null ? null : chapter.value.choices[selectedChoice.value]);
const activeScene = computed<Scene>(() => isComplete.value ? 'flatline' : chapter.value.scene);
const finalMessage = computed(() => remembered.value[5] ?? '“My heart is bursting... I can’t draw air...”');
// These finite vignettes begin on the player's choice, then keep their aftermath pose.
const sceneWaiting = computed(() => !isComplete.value && selectedChoice.value === null
  && ['school', 'dose', 'debt', 'escape', 'collapse'].includes(activeScene.value));
const scenePaused = computed(() => state.reducedMotion || state.showStatsModal || sceneWaiting.value);

function focusHeading() {
  nextTick(() => {
    headingRef.value?.focus({ preventScroll: true });
    endingRef.value?.scrollTo({ top: 0, behavior: 'instant' });
  });
}

function choose(index: number) {
  if (isComplete.value || selectedChoice.value !== null || state.showStatsModal) return;
  const option = chapter.value.choices[index];
  if (!option) return;
  soundManager.playClick(320);
  selectedChoice.value = index;
  remembered.value[chapterIndex.value] = option.keepsake;
}

function continueStory() {
  if (selectedChoice.value === null || isComplete.value) return;
  soundManager.playClick(400);
  chapterIndex.value += 1;
  selectedChoice.value = null;
  focusHeading();
}

function replayMemories() {
  chapterIndex.value = 0;
  selectedChoice.value = null;
  remembered.value = [];
  soundManager.playClick(400);
  focusHeading();
}

function onKeydown(event: KeyboardEvent) {
  if (state.showStatsModal || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === '1' || event.key === '2') {
    if (isComplete.value || selectedChoice.value !== null) return;
    event.preventDefault();
    choose(Number(event.key) - 1);
  } else if (event.key === 'Enter' && !target?.closest('button, a') && selectedChoice.value !== null) {
    event.preventDefault();
    continueStory();
  }
}

onMounted(() => {
  soundManager.stopSirens();
  soundManager.stopFlatline();
  window.addEventListener('keydown', onKeydown);
  focusHeading();
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  soundManager.stopFlatline();
});
</script>

<template>
  <section ref="endingRef" class="ending-container" :class="{ 'ending-complete': isComplete }" aria-label="Interactive final chapter">
    <div class="ending-shell">
      <header class="ending-masthead">
        <div class="masthead-title"><span class="record-mark" aria-hidden="true"></span> FINAL HEARTBEAT <span class="edition">/ INTERACTIVE EPILOGUE</span></div>
        <span class="playback-label">{{ isComplete ? 'TAPE COMPLETE' : 'YOU CONTROL THE PACE' }}</span>
      </header>

      <div class="chapter-heading">
        <p class="eyebrow">{{ isComplete ? 'EPILOGUE / THE ILLUSION OF CONTROL' : `${String(chapterIndex + 1).padStart(2, '0')} / ${chapter.subtitle}` }}</p>
        <h1 ref="headingRef" tabindex="-1">{{ isComplete ? 'The illusion of control.' : chapter.title }}</h1>
        <p class="chapter-intro">{{ isComplete ? '“Just once.” “Allowance covers it.” “I can stop anytime.”' : 'Revisit the final memories. Choose a detail, then continue when you’re ready.' }}</p>
      </div>

      <div class="ending-layout">
        <div class="film-column">
          <div class="film-frame">
            <div class="film-header"><span>{{ isComplete ? '00 BPM · END OF SIGNAL' : chapter.time }}</span><span>{{ sceneWaiting && !state.reducedMotion ? 'Ⅱ AWAITING YOUR CHOICE' : 'SP / VHS ARCHIVE' }}</span></div>
            <DownfallScene :scene="activeScene" :intensity="chapterIndex / memories.length" :paused="scenePaused" :reduced-motion="state.reducedMotion" />
            <div class="film-caption"><span class="caption-marker" aria-hidden="true">└</span>{{ isComplete ? 'No cardiac rhythm. The chase ends here.' : chapter.evidence }}</div>
          </div>

          <div class="memory-track" aria-label="Memory progress">
            <div v-for="(memory, index) in memories" :key="memory.scene" class="memory-stop" :class="{ 'is-current': index === chapterIndex, 'is-past': index < chapterIndex }" :aria-current="index === chapterIndex ? 'step' : undefined">
              <span class="track-bar"></span><span>{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <div class="memory-stop" :class="{ 'is-current': isComplete }"><span class="track-bar"></span><span>END</span></div>
          </div>
          <p class="film-footnote">A FICTIONAL STORY ABOUT ADDICTION, HARM & THE PEOPLE LEFT BEHIND.</p>
        </div>

        <div v-if="!isComplete" class="narrative-column">
          <p class="story-body">{{ chapter.body }}</p>
          <blockquote><p>{{ chapter.quote }}</p><cite>{{ chapter.speaker }}</cite></blockquote>

          <div v-if="!choice" class="choice-panel">
            <p class="choice-label">CHOOSE WHAT TO FACE <span>1 / 2</span></p>
            <button v-for="(option, index) in chapter.choices" :key="option.label" class="memory-choice" type="button" :aria-keyshortcuts="String(index + 1)" @click="choose(index)">
              <span class="choice-number">{{ index + 1 }}</span>
              <span class="choice-copy"><strong>{{ option.label }}</strong><small>{{ option.detail }}</small></span>
              <span class="choice-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
          <div v-else class="memory-response" aria-live="polite" aria-atomic="true">
            <p class="response-label">{{ chapter.scene === 'collapse' ? 'THE LAST HEARTBEAT' : 'MEMORY RECOVERED' }}</p>
            <p>{{ choice.response }}</p>
            <button type="button" class="continue-button" @click="continueStory">{{ chapter.scene === 'collapse' ? 'SEE WHAT REMAINS' : 'CONTINUE THE MEMORY' }} <span aria-hidden="true">→</span></button>
          </div>
          <p class="interaction-hint">{{ choice ? 'Continue when you’re ready. There is no timer.' : sceneWaiting ? 'Choose to replay this memory. Click, tap, or press 1 / 2.' : 'Click, tap, or press 1 / 2. Take your time.' }}</p>
        </div>

        <div v-else class="narrative-column memorial-panel">
          <p class="memorial-kicker">THE LAST MOMENT</p>
          <blockquote class="last-message"><p>{{ finalMessage }}</p></blockquote>
          <p class="story-body">Addiction begins with rationalizations. As tolerance escalates, debt, syndicates, and crime follow. In the end, the chemical promise takes everything.</p>
          <div class="kept-memory"><span>WHERE THE STORY BEGAN</span><p>{{ remembered[0] }}</p></div>
          <div class="end-note"><p>The simulation ends. The warning remains.</p><span>Asking for help can be the next choice.</span></div>
          <div class="epilogue-actions">
            <button type="button" class="continue-button" @click="resetGame">RESTART LIFE SIMULATION <span aria-hidden="true">↗</span></button>
            <div class="secondary-actions"><button type="button" @click="replayMemories">↺ REPLAY MEMORIES</button><button type="button" @click="openStatsModal">VIEW CRISIS DOSSIER →</button></div>
          </div>
        </div>
      </div>
      <footer class="ending-footer"><span>SHADOW SPIRAL / FINAL HEARTBEAT</span><span>{{ isComplete ? 'END OF TAPE' : `MEMORY ${chapterIndex + 1} OF ${memories.length}` }}</span></footer>
    </div>
  </section>
</template>

<style scoped>
.ending-container { --ink: #f1e8d6; --muted: #a49a87; --gold: #d8ad65; --line: #3b352d; width: 100%; height: 100%; overflow-y: auto; overflow-x: hidden; color: var(--ink); background: #10110f; scrollbar-color: #73614b #10110f; font-family: 'Courier New', monospace; }
.ending-shell { width: min(1380px, 100%); min-height: 100%; margin: 0 auto; padding: clamp(18px, 3.4vw, 52px); display: flex; flex-direction: column; }
.ending-masthead { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
.masthead-title { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; letter-spacing: 2px; }
.record-mark { width: 7px; height: 7px; background: #c75e49; box-shadow: 0 0 10px #c75e4933; }
.edition { color: var(--muted); font-size: 10px; letter-spacing: 1px; font-weight: 400; }
.playback-label { color: var(--muted); font-size: 9px; letter-spacing: 1px; white-space: nowrap; }
.chapter-heading { padding: 29px 0 28px; }
.eyebrow { color: var(--gold); font-size: 10px; letter-spacing: 2px; margin-bottom: 13px; font-weight: 700; }
h1 { color: var(--ink); font-family: var(--font-pixel); font-weight: 400; font-size: clamp(16px, 1.9vw, 26px); line-height: 1.6; letter-spacing: -1px; outline: none; }
.chapter-intro { color: var(--muted); font-size: 12px; line-height: 1.7; margin-top: 10px; }
.ending-layout { display: grid; grid-template-columns: minmax(0, 1.34fr) minmax(290px, 1fr); gap: clamp(24px, 3vw, 48px); align-items: start; flex: 1; }
.film-column { min-width: 0; }
.film-frame { padding: 5px; border: 1px solid #494337; background: #191b17; box-shadow: 8px 8px 0 #090a08; }
.film-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #b9ad91; font-size: 8px; letter-spacing: 1px; padding: 9px 8px 12px; }
.film-caption { display: flex; gap: 10px; font-size: 11px; line-height: 1.6; color: #bcb19d; padding: 15px 10px 12px; min-height: 64px; }
.caption-marker { color: var(--gold); }
.memory-track { display: grid; grid-template-columns: repeat(7, 1fr); gap: 7px; margin-top: 28px; }
.memory-stop { color: #817867; font-size: 9px; letter-spacing: 1px; }
.track-bar { display: block; height: 3px; background: #393a31; margin-bottom: 8px; }
.is-current { color: var(--gold); }
.is-current .track-bar { background: var(--gold); box-shadow: 0 0 8px #d8ad6522; }
.is-past { color: #c7b896; }
.is-past .track-bar { background: #857358; }
.film-footnote { font-size: 8px; line-height: 1.8; color: #8b8475; letter-spacing: .7px; margin-top: 21px; }
.narrative-column { padding-top: 2px; min-width: 0; }
.story-body { font-size: 14px; line-height: 1.9; color: #d2cabb; }
blockquote { padding: 14px 0 14px 17px; border-left: 2px solid #9b7050; margin: 21px 0 26px; }
blockquote p { font-size: 17px; line-height: 1.65; color: #e1ccaa; }
cite { display: block; font-size: 8px; line-height: 1.8; letter-spacing: 1px; color: var(--muted); font-style: normal; margin-top: 9px; }
.choice-label { color: var(--muted); font-size: 9px; font-weight: 700; letter-spacing: 1.4px; margin-bottom: 11px; display: flex; justify-content: space-between; }
.choice-label span { color: #b6a584; }
.memory-choice { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; margin: 9px 0; min-height: 76px; padding: 14px; border: 1px solid #514839; background: #1b1d18; color: var(--ink); font-family: inherit; cursor: pointer; transition: background .18s, border-color .18s; }
.memory-choice:hover { border-color: var(--gold); background: #28271f; }
.choice-number { color: #d0ae70; font-size: 12px; border: 1px solid #5b4e36; width: 25px; height: 28px; flex-shrink: 0; display: grid; place-items: center; }
.choice-copy { display: flex; flex-direction: column; gap: 6px; }
.choice-copy strong { font-size: 12px; line-height: 1.5; }
.choice-copy small { font-size: 10px; line-height: 1.5; color: var(--muted); }
.choice-arrow { margin-left: auto; color: var(--gold); font-size: 19px; }
.memory-response { background: #202118; border: 1px solid #625337; padding: 19px; }
.response-label { color: var(--gold); font-size: 9px; letter-spacing: 1.5px; margin-bottom: 12px; }
.memory-response > p:not(.response-label) { font-size: 13px; line-height: 1.85; }
.continue-button { margin-top: 19px; width: 100%; min-height: 46px; padding: 13px 15px; display: flex; justify-content: space-between; align-items: center; gap: 14px; font: inherit; font-size: 10px; line-height: 1.6; letter-spacing: 1px; font-weight: 700; background: #d6b071; color: #18180f; border: 1px solid #d6b071; cursor: pointer; }
.continue-button:hover { background: #f0d29f; }
.interaction-hint { color: #a69a83; font-size: 9px; line-height: 1.8; margin-top: 14px; }
.memorial-kicker { color: var(--gold); font-size: 9px; letter-spacing: 2px; }
.last-message { margin-top: 14px; }
.last-message p { font-size: 20px; }
.kept-memory { margin-top: 24px; color: #bdb29c; font-size: 12px; line-height: 1.8; }
.kept-memory span { color: var(--gold); font-size: 8px; letter-spacing: 1.3px; }
.kept-memory p { margin-top: 7px; }
.end-note { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 12px; line-height: 1.8; }
.end-note p { color: var(--gold); }
.end-note span { color: var(--muted); font-size: 11px; }
.secondary-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.secondary-actions button { border: 0; min-height: 44px; padding: 5px 0; background: transparent; color: #b7aa90; font: inherit; font-size: 9px; line-height: 1.8; cursor: pointer; text-align: left; }
.secondary-actions button:hover { color: var(--ink); }
button:focus-visible { outline: 2px solid #f2cc88; outline-offset: 4px; }
.ending-footer { display: flex; justify-content: space-between; gap: 18px; border-top: 1px solid var(--line); margin-top: 35px; padding-top: 16px; color: #8f8573; font-size: 8px; letter-spacing: 1.3px; }
@media (max-width: 900px) { .ending-layout { grid-template-columns: minmax(0, 1fr) minmax(270px, 1fr); gap: 23px; } .edition { display: none; } .story-body { font-size: 13px; } }
@media (max-width: 680px) { .ending-shell { padding: 18px; } .ending-masthead { padding-bottom: 16px; } .masthead-title { font-size: 10px; letter-spacing: 1px; gap: 7px; } .playback-label { font-size: 7px; letter-spacing: .5px; } .chapter-heading { padding: 25px 0 22px; } h1 { font-size: 16px; line-height: 1.7; letter-spacing: -.5px; } .chapter-intro { font-size: 11px; } .ending-layout { grid-template-columns: 1fr; gap: 24px; } .memory-track { margin-top: 19px; } .film-footnote { display: none; } .film-caption { min-height: 0; padding: 12px 8px; } .narrative-column { padding-top: 0; } .story-body { font-size: 13px; } blockquote { margin: 18px 0 22px; } .ending-footer { font-size: 7px; letter-spacing: .5px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
