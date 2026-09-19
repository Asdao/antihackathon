import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useGameState } from '../src/state/useGameState.ts';

describe('Game State & Mechanics Test Suite', () => {
  const {
    state,
    resetGame,
    selectChoice,
    applyStatDeltas,
    triggerDrugBoost,
    onFightComplete,
    onRobComplete,
    openStatsModal,
    closeStatsModal,
  } = useGameState();

  beforeEach(() => {
    resetGame();
  });

  it('should initialize with correct default stats and story mode', () => {
    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(state.currentNodeId, 'START_SCHOOL');
    assert.strictEqual(state.stats.cash, 40);
    assert.strictEqual(state.stats.debt, 0);
    assert.strictEqual(state.stats.drugCost, 25);
    assert.strictEqual(state.stats.health, 100);
    assert.strictEqual(state.stats.stamina, 100);
    assert.strictEqual(state.stats.addiction, 0);
    assert.strictEqual(state.stats.tolerance, 0);
    assert.strictEqual(state.showStatsModal, false);
  });

  it('should compound debt with interest upon story choices', () => {
    state.stats.debt = 500;
    // Advance choice
    selectChoice({ text: 'Next', targetNodeId: 'LOAN_SHARK_CUTOFF' });
    // Formula: Math.round(debt * 1.08 + 45) -> 500 * 1.08 + 45 = 540 + 45 = 585
    assert.strictEqual(state.stats.debt, 585, 'Debt must compound with 8% + 45 fee');
  });

  it('should dynamically escalate drug cost as addiction and tolerance rise', () => {
    assert.strictEqual(state.stats.drugCost, 25, 'Initial drug cost must be $25');

    // Simulate addiction and tolerance growth
    applyStatDeltas({ addictionDelta: 30, toleranceDelta: 20 });
    // Formula: Math.round(25 + addiction * 4.5 + tolerance * 6)
    // 25 + (30 * 4.5) + (20 * 6) = 25 + 135 + 120 = 280
    assert.strictEqual(state.stats.drugCost, 280, 'Drug cost must scale dynamically');

    // Extreme addiction
    applyStatDeltas({ addictionDelta: 50, toleranceDelta: 50 });
    assert.ok(state.stats.drugCost >= 600, 'Severe tolerance must push dose cost over $600');
  });

  it('enforces rule: Robbery 1 failure routes to arrest (NOT death)', () => {
    state.currentRobLevel = 1;
    state.mode = 'PARKOUR_RUNNER';

    // Simulate failing Robbery 1
    onRobComplete(false);

    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(
      state.currentNodeId,
      'ENDING_ARRESTED_STREET',
      'Failing Robbery 1 must result in arrest (ENDING_ARRESTED_STREET)'
    );
  });

  it('enforces rule: Robbery 2 failure routes to arrest (NOT death)', () => {
    state.currentRobLevel = 2;
    state.mode = 'PARKOUR_RUNNER';

    // Simulate failing Robbery 2
    onRobComplete(false);

    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(
      state.currentNodeId,
      'ENDING_ARRESTED_STREET',
      'Failing Robbery 2 must result in arrest (ENDING_ARRESTED_STREET)'
    );
  });

  it('enforces rule: Robbery 3 failure routes to cardiovascular collapse (death climax)', () => {
    state.currentRobLevel = 3;
    state.mode = 'PARKOUR_RUNNER';

    // Simulate failing Robbery 3
    onRobComplete(false);

    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(
      state.currentNodeId,
      'CLIMAX_ESCAPE',
      'Failing Robbery 3 must trigger the fatal collapse ending climax'
    );
  });

  it('enforces rule: Robbery 3 success also routes to cardiovascular collapse (death climax)', () => {
    state.currentRobLevel = 3;
    state.mode = 'PARKOUR_RUNNER';

    // Winning Robbery 3
    onRobComplete(true);

    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(
      state.currentNodeId,
      'CLIMAX_ESCAPE',
      'Winning Robbery 3 must lead to the final fatal heartbeat collapse'
    );
  });

  it('should advance robbery levels upon successful getaways', () => {
    state.currentRobLevel = 1;
    onRobComplete(true);
    assert.strictEqual(state.currentNodeId, 'STAGE_ROB_2_INTRO');

    state.currentRobLevel = 2;
    onRobComplete(true);
    assert.strictEqual(state.currentNodeId, 'STAGE_ROB_3_INTRO');
  });

  it('should handle fight outcomes properly', () => {
    state.currentFightLevel = 1;
    state.mode = 'SHADOW_FIGHTER';

    // Win fight 1
    onFightComplete(true);
    assert.strictEqual(state.mode, 'STORY');
    assert.strictEqual(state.currentNodeId, 'STAGE_FIGHT_2_INTRO');

    // Lose fight
    state.mode = 'SHADOW_FIGHTER';
    onFightComplete(false);
    assert.strictEqual(state.currentNodeId, 'KICKED_OUT_TO_THIEVES');
  });

  it('should toggle crisis stats modal on and off', () => {
    assert.strictEqual(state.showStatsModal, false);
    openStatsModal();
    assert.strictEqual(state.showStatsModal, true);
    closeStatsModal();
    assert.strictEqual(state.showStatsModal, false);
  });

  it('should reset all state and close modals on resetGame', () => {
    state.stats.health = 20;
    state.stats.debt = 5000;
    state.showStatsModal = true;
    state.currentNodeId = 'ENDING_ARRESTED_STREET';

    resetGame();

    assert.strictEqual(state.currentNodeId, 'START_SCHOOL');
    assert.strictEqual(state.stats.health, 100);
    assert.strictEqual(state.stats.debt, 0);
    assert.strictEqual(state.showStatsModal, false);
    assert.strictEqual(state.mode, 'STORY');
  });
});
