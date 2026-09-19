import { reactive, computed } from 'vue';
import type { GameMode, PlayerStats, StoryChoice, StoryLogItem, StoryNode } from '../types/game';
import { STORY_NODES } from '../data/storyNodes';
import { soundManager } from '../audio/SoundManager';

const defaultStats = (): PlayerStats => ({
  cash: 40,
  debt: 0,
  health: 100,
  stamina: 100,
  addiction: 0,
  tolerance: 0,
  drugCost: 25,
  doses: 0,
  age: 'Age 16',
  boostActive: false,
  boostTimer: 0,
  sluggishTimer: 0,
});

interface GameState {
  mode: GameMode;
  currentNodeId: string;
  stats: PlayerStats;
  logs: StoryLogItem[];
  currentFightLevel: 1 | 2 | 3;
  currentRobLevel: 1 | 2 | 3;
  theme: 'dmg' | 'amber' | 'neon';
  scanlinesEnabled: boolean;
}

const state = reactive<GameState>({
  mode: 'STORY',
  currentNodeId: 'START_SCHOOL',
  stats: defaultStats(),
  logs: [{
    id: 'log-0',
    timestamp: '08:00',
    age: 'Age 16',
    text: 'Began sophomore year at West River High School.',
    type: 'info',
  }],
  currentFightLevel: 1,
  currentRobLevel: 1,
  theme: 'dmg',
  scanlinesEnabled: true,
});

let boostInterval: number | null = null;
let sluggishInterval: number | null = null;

export function useGameState() {
  const currentNode = computed(() => STORY_NODES[state.currentNodeId] || STORY_NODES['START_SCHOOL']);

  function addLog(text: string, type: StoryLogItem['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      age: state.stats.age,
      text,
      type,
    });
  }

  function applyStatDeltas(deltas?: StoryNode['statEffects']) {
    if (!deltas) return;
    const s = state.stats;

    if (deltas.cashDelta) s.cash = Math.max(0, s.cash + deltas.cashDelta);
    if (deltas.debtDelta) s.debt = Math.max(0, s.debt + deltas.debtDelta);
    if (deltas.healthDelta) s.health = Math.max(0, Math.min(100, s.health + deltas.healthDelta));
    if (deltas.addictionDelta) s.addiction = Math.max(0, Math.min(100, s.addiction + deltas.addictionDelta));
    if (deltas.dosesDelta) s.doses = Math.max(0, s.doses + deltas.dosesDelta);

    // Compounding Predatory Debt: Debt keeps multiplying with weekly extortionate rates
    if (s.debt > 0) {
      const interest = Math.round(s.debt * 0.08 + 45);
      s.debt += interest;
    }

    // Escalating Drug Cost: Tolerance and street desperation drive price through the roof
    s.drugCost = Math.round(25 + s.addiction * 4.5 + s.tolerance * 6);

    if (s.health <= 0 && state.mode !== 'ENDING_SEQUENCE') {
      soundManager.playGlitch();
      addLog('Vital organs collapsed due to chronic substance abuse.', 'danger');
      state.currentNodeId = 'ENDING_COLLAPSE_EARLY';
      state.mode = 'STORY';
    }
  }

  function triggerDrugBoost(): boolean {
    if (state.stats.doses <= 0) {
      soundManager.playClick(300);
      return false;
    }

    const s = state.stats;
    s.doses--;
    s.boostActive = true;
    s.boostTimer = 6;
    s.addiction = Math.min(100, s.addiction + 10);
    s.tolerance = Math.min(100, s.tolerance + 5);
    s.health = Math.max(5, s.health - 4);
    s.drugCost = Math.round(25 + s.addiction * 4.5 + s.tolerance * 6);

    soundManager.playDrugBoost();
    addLog('Consumed drug dose: Surge activated!', 'warning');

    if (boostInterval) clearInterval(boostInterval);
    boostInterval = window.setInterval(() => {
      if (s.boostTimer > 0) {
        s.boostTimer--;
      } else {
        s.boostActive = false;
        clearInterval(boostInterval!);
        boostInterval = null;

        s.sluggishTimer = s.addiction > 60 ? 6 : 3;
        addLog('Drug boost crashed: Fatigue and sluggishness set in.', 'danger');
        soundManager.playGlitch();

        if (sluggishInterval) clearInterval(sluggishInterval);
        sluggishInterval = window.setInterval(() => {
          if (s.sluggishTimer > 0) s.sluggishTimer--;
          else clearInterval(sluggishInterval!);
        }, 1000);
      }
    }, 1000);

    return true;
  }

  function selectChoice(choice: StoryChoice) {
    soundManager.playClick();

    if (choice.action) {
      const { type } = choice.action;
      if (type === 'FIGHT') {
        state.currentFightLevel = choice.action.level;
        state.mode = 'SHADOW_FIGHTER';
        addLog('Engaging target in shadow combat.', 'warning');
      } else if (type === 'ROB') {
        state.currentRobLevel = choice.action.level;
        state.mode = 'PARKOUR_RUNNER';
        addLog('Initiating getaway run.', 'danger');
      } else if (type === 'CINEMATIC') {
        state.mode = 'ENDING_SEQUENCE';
      }
      return;
    }

    if (choice.targetNodeId) {
      const next = STORY_NODES[choice.targetNodeId];
      if (next) {
        state.currentNodeId = next.id;
        state.stats.age = next.age;
        if (next.logMessage) addLog(next.logMessage, next.isEnding ? 'danger' : 'info');
        if (next.statEffects) applyStatDeltas(next.statEffects);

        if (next.id === 'POLICE_RAID') soundManager.startSirens();
        else soundManager.stopSirens();
      }
    }
  }

  const FIGHT_OUTCOMES: Record<number, { next: string; log: string; sirens?: boolean }> = {
    1: { next: 'STAGE_FIGHT_2_INTRO', log: 'Defeated Shopkeeper. Debt reduced by $400.' },
    2: { next: 'STAGE_FIGHT_3_INTRO', log: 'Defeated Gambler. Syndicate pleased.' },
    3: { next: 'POLICE_RAID', log: 'Target eliminated. POLICE SQUAD BREACHED THE PERIMETER!', sirens: true },
  };

  function onFightComplete(won: boolean) {
    soundManager.stopSirens();
    if (won) {
      const outcome = FIGHT_OUTCOMES[state.currentFightLevel];
      state.currentNodeId = outcome.next;
      addLog(outcome.log, 'success');
      if (outcome.sirens) soundManager.startSirens();
    } else {
      state.currentNodeId = 'KICKED_OUT_TO_THIEVES';
      addLog('Lost combat! Beaten and cast into the street.', 'danger');
    }
    state.mode = 'STORY';
  }

  const ROB_WINS: Record<number, { next: string; log: string; type: StoryLogItem['type'] }> = {
    1: { next: 'STAGE_ROB_2_INTRO', log: 'Escaped Robbery 1. Physical decay intensifying.', type: 'success' },
    2: { next: 'STAGE_ROB_3_INTRO', log: 'Escaped Robbery 2. Severe tachycardia.', type: 'warning' },
    3: { next: 'CLIMAX_ESCAPE', log: 'Escaped final chase! Heart arrhythmia critical!', type: 'danger' },
  };

  const ROB_FAILS: Record<number, string> = {
    1: 'ENDING_COLLAPSE_STREET',
    2: 'ENDING_COLLAPSE_OD',
    3: 'CLIMAX_ESCAPE',
  };

  function onRobComplete(won: boolean) {
    if (won) {
      const outcome = ROB_WINS[state.currentRobLevel];
      state.currentNodeId = outcome.next;
      addLog(outcome.log, outcome.type);
    } else {
      state.currentNodeId = ROB_FAILS[state.currentRobLevel];
    }
    state.mode = 'STORY';
  }

  function resetGame() {
    soundManager.stopFlatline();
    soundManager.stopSirens();
    if (boostInterval) clearInterval(boostInterval);
    if (sluggishInterval) clearInterval(sluggishInterval);

    state.mode = 'STORY';
    state.currentNodeId = 'START_SCHOOL';
    state.stats = defaultStats();
    state.currentFightLevel = 1;
    state.currentRobLevel = 1;
    state.logs = [{
      id: `log-reset-${Date.now()}`,
      timestamp: '08:00',
      age: 'Age 16',
      text: 'Began sophomore year at West River High School.',
      type: 'info',
    }];
  }

  function toggleTheme() {
    const cycle: Record<GameState['theme'], GameState['theme']> = { dmg: 'amber', amber: 'neon', neon: 'dmg' };
    state.theme = cycle[state.theme];
  }

  return {
    state,
    currentNode,
    selectChoice,
    applyStatDeltas,
    triggerDrugBoost,
    onFightComplete,
    onRobComplete,
    resetGame,
    toggleTheme,
  };
}
