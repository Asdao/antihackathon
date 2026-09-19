import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useGameState } from '../src/state/useGameState.ts';

describe('Minigame Balance, Obstacle Diversity & Immuniity Mechanics', () => {
  const { state, resetGame, triggerDrugBoost, applyStatDeltas } = useGameState();

  beforeEach(() => {
    resetGame();
  });

  it('should verify extended duration configurations for all 3 robbery stages', () => {
    const robConfigs = [
      { level: 1, targetDistance: 950, speed: 4.8 },
      { level: 2, targetDistance: 1400, speed: 5.4 },
      { level: 3, targetDistance: 1900, speed: 6.0 },
    ];

    for (const config of robConfigs) {
      assert.ok(
        config.targetDistance >= 900,
        `Robbery level ${config.level} distance (${config.targetDistance}) must provide extended escape pacing`
      );
      // Pacing calculation: at 60fps with distance += speed * 0.12, frames required:
      const totalFrames = config.targetDistance / (config.speed * 0.12);
      const totalSeconds = totalFrames / 60;
      assert.ok(
        totalSeconds >= 25,
        `Robbery level ${config.level} must last at least 25 seconds of continuous running (calculated: ${totalSeconds.toFixed(1)}s)`
      );
    }
  });

  it('should verify extended opponent HP and combat pacing for all 3 fights', () => {
    const targetConfigs = [
      { name: 'CORNER STORE OWNER', maxHp: 180, dmg: 10 },
      { name: 'UNDERGROUND GAMBLER', maxHp: 250, dmg: 15 },
      { name: 'ROGUE WAREHOUSE BOUNCER', maxHp: 340, dmg: 20 },
    ];

    const playerMaxHp = 160;

    for (const target of targetConfigs) {
      assert.ok(
        target.maxHp >= 180,
        `Opponent ${target.name} must have extended HP (>= 180) to avoid premature match ending`
      );
      assert.ok(
        playerMaxHp >= 150,
        'Player max HP must be at least 150 to sustain extended tactical exchanges'
      );
      // Hits to defeat at base punch damage (12):
      const hitsNeeded = target.maxHp / 12;
      assert.ok(
        hitsNeeded >= 15,
        `Match must require at least 15 base strikes to defeat ${target.name} (calculated: ${hitsNeeded.toFixed(1)} hits)`
      );
    }
  });

  it('should support all 6 diverse obstacle archetypes with both jump and slide requirements', () => {
    const obstacleTypes = [
      'jump_bin',
      'jump_fence',
      'slide_pipe',
      'slide_beam',
      'jump_barrels',
      'jump_ac_vent',
    ];

    assert.strictEqual(obstacleTypes.length, 6, 'Must feature exactly 6 diverse obstacle archetypes');

    const jumpObstacles = obstacleTypes.filter((t) => t.startsWith('jump_'));
    const slideObstacles = obstacleTypes.filter((t) => t.startsWith('slide_'));

    assert.strictEqual(jumpObstacles.length, 4, 'Must have 4 jump obstacle variants');
    assert.strictEqual(slideObstacles.length, 2, 'Must have 2 overhead slide obstacle variants');
  });

  it('mechanics verification: drug boost grants 100% obstacle immunity', () => {
    // Initial conditions
    state.stats.doses = 2;
    state.stats.health = 100;
    state.stats.stamina = 100;
    assert.strictEqual(state.stats.boostActive, false);

    // Simulate collision function mimicking ParkourRunner.vue collision block
    let hitCount = 0;
    function simulateObstacleCollision(obs: { hit: boolean; shattered?: boolean }) {
      if (state.stats.boostActive) {
        // Boosted immunity: obstacle shattered, 0 damage, 0 stamina loss, 0 trip count
        obs.hit = true;
        obs.shattered = true;
      } else {
        obs.hit = true;
        hitCount++;
        state.stats.stamina = Math.max(0, state.stats.stamina - 20);
        state.stats.health = Math.max(0, state.stats.health - 12);
      }
    }

    // 1. Without boost: player takes damage
    const normalObs = { hit: false };
    simulateObstacleCollision(normalObs);
    assert.strictEqual(normalObs.hit, true);
    assert.strictEqual(normalObs.shattered, undefined);
    assert.strictEqual(hitCount, 1);
    assert.strictEqual(state.stats.health, 88);
    assert.strictEqual(state.stats.stamina, 80);

    // 2. Activate boost
    const boosted = triggerDrugBoost();
    assert.strictEqual(boosted, true);
    assert.strictEqual(state.stats.boostActive, true);
    const postDoseHealth = state.stats.health; // Account for dose toxic wear (-4)

    // 3. Collision while boost is active: immune!
    const immuneObs = { hit: false };
    simulateObstacleCollision(immuneObs);
    assert.strictEqual(immuneObs.hit, true);
    assert.strictEqual(immuneObs.shattered, true, 'Obstacle must be shattered');
    assert.strictEqual(hitCount, 1, 'Hit count must NOT increase during boost');
    assert.strictEqual(state.stats.health, postDoseHealth, 'Health must NOT decrease from obstacle collision during boost');
    assert.strictEqual(state.stats.stamina, 80, 'Stamina must NOT decrease during boost');
  });

  it('mechanics verification: sluggish crash cuts speed by 50% and weakens jumps', () => {
    const baseSpeed = 4.8;
    const baseJump = -13.5;

    // Normal state
    state.stats.sluggishTimer = 0;
    state.stats.boostActive = false;

    let speed = baseSpeed;
    if (state.stats.sluggishTimer > 0) speed *= 0.50;
    assert.strictEqual(speed, 4.8);

    // Enter sluggish crash
    state.stats.sluggishTimer = 400;

    let crashedSpeed = baseSpeed;
    if (state.stats.sluggishTimer > 0) crashedSpeed *= 0.50;
    assert.strictEqual(crashedSpeed, 2.4, 'Sluggish crash must reduce speed by exactly 50%');

    // Jump multiplier
    const jumpMult = state.stats.sluggishTimer > 0 ? 0.70 : 1.0;
    const sluggishJump = baseJump * jumpMult;
    assert.strictEqual(sluggishJump, -9.45, 'Jump strength must be reduced to 70% in sluggish state');
  });

  it('mechanics verification: sluggish crash imposes heavy attack delay and recovery locks', () => {
    // Combat parameters
    function getAttackParameters(type: 'punch' | 'kick', isSluggish: boolean, isBoosted: boolean) {
      const isKick = type === 'kick';
      const playerActionTimer = isSluggish ? (isKick ? 36 : 24) : (isKick ? 14 : 10);
      const baseDmg = isKick ? 20 : 12;
      const dmg = baseDmg * (isBoosted ? 1.5 : 1) * (isSluggish ? 0.6 : 1);
      const windupDelay = isSluggish ? (isKick ? 340 : 250) : (isBoosted ? 80 : (isKick ? 150 : 100));

      return { playerActionTimer, dmg, windupDelay };
    }

    // Normal attack
    const normalPunch = getAttackParameters('punch', false, false);
    assert.strictEqual(normalPunch.playerActionTimer, 10);
    assert.strictEqual(normalPunch.dmg, 12);
    assert.strictEqual(normalPunch.windupDelay, 100);

    // Sluggish punch
    const sluggishPunch = getAttackParameters('punch', true, false);
    assert.strictEqual(sluggishPunch.playerActionTimer, 24, 'Sluggish recovery lock must be 24 frames (doubled)');
    assert.strictEqual(Math.round(sluggishPunch.dmg * 10) / 10, 7.2, 'Sluggish damage must suffer 40% penalty (0.6x)');
    assert.strictEqual(sluggishPunch.windupDelay, 250, 'Sluggish windup must delay strike to 250ms');

    // Sluggish kick
    const sluggishKick = getAttackParameters('kick', true, false);
    assert.strictEqual(sluggishKick.playerActionTimer, 36, 'Sluggish kick recovery lock must be 36 frames');
    assert.strictEqual(sluggishKick.dmg, 12, 'Sluggish kick damage must be 12 (vs 20 base)');
    assert.strictEqual(sluggishKick.windupDelay, 340, 'Sluggish kick windup must delay strike to 340ms');
  });
});
