import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RetroSoundManager } from '../src/audio/SoundManager.ts';

class Param {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  outputs: Node[] = [];
  disconnected = false;
  connect(node: Node) { this.outputs.push(node); }
  disconnect() { this.disconnected = true; }
}
class Gain extends Node { gain = new Param(); }
class Source extends Node {
  frequency = new Param();
  onended: (() => void) | null = null;
  startAt = 0;
  cancelled = false;
  start(at = 0) { this.startAt = at; }
  stop(at?: number) { if (at === undefined) this.cancelled = true; }
}
const contexts: Context[] = [];
class Context {
  currentTime = 0;
  sampleRate = 1000;
  state = 'running';
  destination = new Node();
  nodes: Node[] = [];
  constructor() { contexts.push(this); }
  add<T extends Node>(node: T): T { this.nodes.push(node); return node; }
  createDynamicsCompressor() {
    return this.add(Object.assign(new Node(), {
      threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param(),
    }));
  }
  createGain() { return this.add(new Gain()); }
  createOscillator() { return this.add(new Source()); }
  createBufferSource() { return this.add(new Source()); }
  createBiquadFilter() { return this.add(Object.assign(new Node(), { frequency: new Param(), Q: new Param() })); }
  createBuffer(_channels: number, size: number) { return { getChannelData: () => new Float32Array(size) }; }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

const timers = new Map<number, () => void>();
const activation = { hasBeenActive: true, isActive: true };
let manager: RetroSoundManager;
let nextTimer = 0;
const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

beforeEach(() => {
  contexts.length = 0;
  timers.clear();
  activation.hasBeenActive = true;
  activation.isActive = true;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    AudioContext: Context,
    navigator: { userActivation: activation },
    setInterval: (callback: () => void) => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval: (id: number) => { timers.delete(id); },
  } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } });
  manager = new RetroSoundManager();
});
afterEach(() => {
  manager.stopCombatAmbience();
  manager.stopSirens();
  manager.stopFlatline();
  if (!manager.getMuted()) manager.toggleMute();
  if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});

function outputGain(context: Context): Gain {
  const gain = context.nodes.find(node => node instanceof Gain && node.outputs.includes(context.destination));
  assert.ok(gain instanceof Gain, 'Every voice must pass through a master volume node');
  return gain;
}
function sources(context: Context): Source[] { return context.nodes.filter(node => node instanceof Source); }
function tick() { for (const callback of [...timers.values()]) callback(); }

describe('Procedural sound lifecycle and shared audio controls', () => {
  it('waits for user activation before creating sound, including pending combat ambience', () => {
    activation.hasBeenActive = false;
    activation.isActive = false;
    manager.startCombatAmbience(1);
    manager.playClick();
    assert.equal(contexts.length, 0);
    assert.equal(timers.size, 0);
    activation.hasBeenActive = true;
    activation.isActive = true;
    manager.playWhoosh();
    assert.equal(contexts.length, 1);
    assert.equal(timers.size, 1, 'The previously requested combat loop can start after a gesture');
  });

  it('clamps volume and applies one saved volume to all effects and sustained audio', () => {
    assert.equal(manager.getVolume(), 0.55);
    manager.setVolume(2);
    assert.equal(manager.getVolume(), 1);
    manager.setVolume(-1);
    assert.equal(manager.getVolume(), 0);
    manager.setVolume(0.35);
    manager.setVolume(Number.NaN);
    assert.equal(manager.getVolume(), 0.35);
    manager.playPunch();
    manager.startFlatline();
    const context = contexts[0]!;
    const master = outputGain(context);
    assert.equal(master.gain.value, 0.35);
    assert.equal(context.nodes.filter(node => node.outputs.includes(context.destination)).length, 1);
    manager.toggleMute();
    assert.equal(master.gain.value, 0);
    manager.toggleMute();
    assert.equal(master.gain.value, 0.35);
  });

  it('mute cancels and disconnects playing AND future notes, with no chime or heartbeat timers left', () => {
    manager.playCoin();
    manager.playHeartbeat();
    manager.playDrugBoost();
    manager.startFlatline();
    manager.startCombatAmbience(2);
    manager.startSirens();
    tick();
    const context = contexts[0]!;
    const playing = sources(context);
    assert.ok(playing.some(source => source.startAt > context.currentTime), 'Exercise scheduled future notes');
    assert.equal(timers.size, 1, 'Sirens and combat share one cancellable scheduler');
    manager.toggleMute();
    assert.equal(outputGain(context).gain.value, 0);
    assert.ok(playing.every(source => source.cancelled && source.disconnected));
    assert.equal(timers.size, 0);
    manager.stopCombatAmbience();
    manager.stopSirens();
    manager.toggleMute();
    assert.equal(timers.size, 0, 'Unmute must not restart loops that were stopped while muted');
    assert.equal(sources(context).length, playing.length, 'Unmute must not resurrect old effects');
  });

  it('cleans up naturally ended effect graphs and reuses the master graph', () => {
    manager.playKick();
    const context = contexts[0]!;
    const firstVoices = sources(context);
    for (const source of firstVoices) source.onended?.();
    assert.ok(firstVoices.every(source => source.disconnected && source.onended === null));
    const master = outputGain(context);
    assert.equal(master.disconnected, false);
    manager.playBlock();
    assert.equal(contexts.length, 1);
    assert.equal(outputGain(context), master);
  });

  it('stopping combat cancels queued backing notes without stopping an unrelated effect', () => {
    manager.playClick();
    const context = contexts[0]!;
    const effect = sources(context)[0]!;
    manager.startCombatAmbience(3);
    manager.startCombatAmbience(3);
    assert.equal(timers.size, 1, 'Duplicate starts must not stack backing tracks');
    tick();
    const combatSources = sources(context).filter(source => source !== effect);
    assert.ok(combatSources.length > 0);
    manager.stopCombatAmbience();
    assert.ok(combatSources.every(source => source.cancelled && source.disconnected));
    assert.equal(effect.cancelled, false);
    assert.equal(timers.size, 0);
    const count = sources(context).length;
    context.currentTime = 30;
    tick();
    assert.equal(sources(context).length, count, 'Leaving a fight must not schedule any more backing notes');
  });
});
