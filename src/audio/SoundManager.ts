// A small, gesture-unlocked synth. Every voice shares one volume/mute control.
type AudioBus = 'effects' | 'combat' | 'sirens' | 'flatline';
type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[]; bus: AudioBus };
type Transport = { step: number; nextAt: number; level: number };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export class RetroSoundManager {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private voices = new Set<Voice>();
  private isMuted = false;
  private volume = 0.55;
  private combat: Transport | null = null;
  private sirens: Transport | null = null;
  private scheduler: number | null = null;
  private flatlineActive = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    // Mounting a component must never unlock audio. The first real click/key does.
    const activation = window.navigator?.userActivation;
    if (!this.ctx && activation && !activation.hasBeenActive && !activation.isActive) return null;
    if (!this.ctx) {
      const AudioCtor = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      try {
        this.ctx = new AudioCtor();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.12;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const samples = this.noiseBuffer.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
        this.compressor = null;
        this.masterGain = null;
        return null;
      }
    }
    if (this.ctx.state === 'suspended' && (!activation || activation.isActive)) {
      void this.ctx.resume().catch(() => { /* A later gesture can retry. */ });
    }
    this.startScheduler();
    return this.ctx;
  }

  public getVolume(): number { return this.volume; }

  public setVolume(value: number) {
    if (!Number.isFinite(value)) return;
    this.volume = clamp(value, 0, 1);
    this.updateMaster();
  }

  public getMuted(): boolean { return this.isMuted; }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateMaster();
    if (this.isMuted) {
      // Cancel future notes too, so unmuting cannot resurrect an old hit/chime.
      this.stopVoices();
      this.stopScheduler();
      this.flatlineActive = false;
    } else {
      this.getContext();
      const now = this.ctx?.currentTime ?? 0;
      if (this.combat) this.combat.nextAt = now + 0.025;
      if (this.sirens) this.sirens.nextAt = now + 0.025;
      this.startScheduler();
    }
    return this.isMuted;
  }

  private updateMaster() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    // Mute is immediate; all voices, including sustained tones, use this node.
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[], bus: AudioBus) {
    const voice: Voice = { source, nodes, bus };
    this.voices.add(voice);
    source.onended = () => this.releaseVoice(voice);
  }

  private releaseVoice(voice: Voice, stop = false) {
    if (!this.voices.delete(voice)) return;
    voice.source.onended = null;
    if (stop) {
      try { voice.source.stop(); } catch { /* Already ended. */ }
    }
    for (const node of voice.nodes) node.disconnect();
  }

  private stopVoices(bus?: AudioBus) {
    for (const voice of this.voices) {
      if (!bus || voice.bus === bus) this.releaseVoice(voice, true);
    }
  }

  private envelope(gain: GainNode, time: number, duration: number, level: number) {
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(clamp(level, 0.0001, 0.5), time + Math.min(0.006, duration / 5));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    gain.gain.linearRampToValueAtTime(0, time + duration + 0.005);
  }

  private tone(frequency: number, endFrequency: number, duration: number,
    waveform: OscillatorType, level: number, bus: AudioBus = 'effects', at?: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.compressor) return;
    const time = Math.max(ctx.currentTime, at ?? ctx.currentTime);
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    source.type = waveform;
    source.frequency.setValueAtTime(Math.max(20, frequency), time);
    source.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
    this.envelope(gain, time, duration, level);
    source.connect(gain);
    gain.connect(this.compressor);
    this.track(source, [source, gain], bus);
    source.start(time);
    source.stop(time + duration + 0.008);
  }

  private noise(duration: number, cutoff: number, endCutoff: number, level: number,
    type: BiquadFilterType = 'lowpass', bus: AudioBus = 'effects', at?: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.compressor || !this.noiseBuffer) return;
    const time = Math.max(ctx.currentTime, at ?? ctx.currentTime);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = type;
    filter.Q.value = 0.65;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endCutoff), time + duration);
    this.envelope(gain, time, duration, level);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    this.track(source, [source, filter, gain], bus);
    source.start(time, Math.random() * 0.4, duration + 0.008);
    source.stop(time + duration + 0.008);
  }

  public playClick(pitch = 520) {
    this.tone(pitch, pitch * 1.15, 0.045, 'triangle', 0.055);
  }

  public playWhoosh(kind: 'punch' | 'kick' = 'punch') {
    if (kind === 'kick') this.noise(0.18, 1150, 230, 0.13, 'bandpass');
    else this.noise(0.105, 1700, 450, 0.09, 'bandpass');
  }

  public playPunch() {
    this.tone(145, 48, 0.14, 'sine', 0.29);
    this.tone(260, 95, 0.045, 'triangle', 0.08);
    this.noise(0.065, 2100, 540, 0.12, 'bandpass');
  }

  public playKick() {
    this.tone(108, 32, 0.22, 'sine', 0.35);
    this.tone(190, 60, 0.10, 'triangle', 0.10);
    this.noise(0.10, 1300, 190, 0.16, 'lowpass');
  }

  public playBlock() {
    this.tone(340, 230, 0.12, 'triangle', 0.105);
    this.tone(570, 430, 0.07, 'sine', 0.065);
    this.noise(0.055, 1850, 700, 0.075, 'bandpass');
  }

  public playJump() { this.tone(135, 350, 0.15, 'triangle', 0.075); }
  public playSlide() { this.noise(0.18, 1500, 220, 0.12, 'bandpass'); }

  public playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;
    [784, 1047].forEach((frequency, index) => {
      this.tone(frequency, frequency, 0.15, 'triangle', 0.06, 'effects', ctx.currentTime + index * 0.075);
    });
  }

  public playDrugBoost() {
    const ctx = this.getContext();
    if (!ctx) return;
    [196, 247, 294, 330].forEach((frequency, index) => {
      this.tone(frequency, frequency * 1.025, 0.17, 'triangle', 0.065, 'effects', ctx.currentTime + index * 0.055);
    });
  }

  public playHeartbeat(strength = 1) {
    const ctx = this.getContext();
    if (!ctx) return;
    const weight = Number.isFinite(strength) ? clamp(strength, 0.2, 1.8) : 1;
    this.tone(72, 32, 0.13, 'sine', 0.20 * weight, 'effects', ctx.currentTime);
    this.tone(57, 28, 0.15, 'sine', 0.13 * weight, 'effects', ctx.currentTime + 0.14);
  }

  public startFlatline() {
    if (this.isMuted || this.flatlineActive) return;
    const ctx = this.getContext();
    if (!ctx || !this.compressor) return;
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    source.type = 'sine';
    source.frequency.value = 660;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.065, ctx.currentTime + 0.08);
    source.connect(gain);
    gain.connect(this.compressor);
    this.track(source, [source, gain], 'flatline');
    this.flatlineActive = true;
    source.start();
  }

  public stopFlatline() {
    this.flatlineActive = false;
    this.stopVoices('flatline');
  }

  public playGlitch() { this.noise(0.055, 1300, 240, 0.09, 'bandpass'); }
  public playStaticBurst() {
    this.noise(0.12, 2500, 650, 0.10, 'lowpass');
    this.tone(75, 35, 0.12, 'triangle', 0.045);
  }

  public startCombatAmbience(level = 1) {
    const stage = Number.isFinite(level) ? Math.round(clamp(level, 1, 3)) : 1;
    if (this.combat?.level === stage) return;
    this.stopVoices('combat');
    this.combat = { step: 0, nextAt: (this.ctx?.currentTime ?? 0) + 0.025, level: stage };
    this.getContext();
    this.startScheduler();
  }

  public stopCombatAmbience() {
    this.combat = null;
    this.stopVoices('combat');
    if (!this.sirens) this.stopScheduler();
  }

  public startSirens() {
    if (this.sirens) return;
    this.sirens = { step: 0, nextAt: (this.ctx?.currentTime ?? 0) + 0.025, level: 1 };
    this.getContext();
    this.startScheduler();
  }

  public stopSirens() {
    this.sirens = null;
    this.stopVoices('sirens');
    if (!this.combat) this.stopScheduler();
  }

  private startScheduler() {
    if (!this.ctx || this.isMuted || this.scheduler !== null || (!this.combat && !this.sirens)) return;
    this.scheduler = window.setInterval(() => this.tick(), 40);
  }

  private stopScheduler() {
    if (this.scheduler !== null) window.clearInterval(this.scheduler);
    this.scheduler = null;
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;
    // Do not accumulate a catch-up burst when a tab or AudioContext was paused.
    if (typeof document !== 'undefined' && document.hidden) {
      this.stopVoices('combat');
      this.stopVoices('sirens');
      if (this.combat) this.combat.nextAt = now + 0.04;
      if (this.sirens) this.sirens.nextAt = now + 0.04;
      return;
    }
    if (this.combat) {
      if (this.combat.nextAt < now) this.combat.nextAt = now + 0.015;
      while (this.combat.nextAt < now + 0.12) {
        this.combatBeat(this.combat.step++, this.combat.nextAt, this.combat.level);
        this.combat.nextAt += 60 / (80 + this.combat.level * 6) / 2;
      }
    }
    if (this.sirens) {
      if (this.sirens.nextAt < now) this.sirens.nextAt = now + 0.015;
      while (this.sirens.nextAt < now + 0.12) {
        const high = this.sirens.step++ % 2 === 0;
        this.tone(high ? 630 : 490, high ? 510 : 620, 0.44, 'triangle', 0.06, 'sirens', this.sirens.nextAt);
        this.sirens.nextAt += 0.45;
      }
    }
  }

  private combatBeat(step: number, at: number, level: number) {
    const beat = step % 16;
    // A restrained minor-key bass ostinato and dusty drum-machine pulse.
    const roots = [55, 55, 49, 51.91];
    if (beat % 2 === 0) {
      const note = roots[Math.floor(beat / 4)]!;
      this.tone(note, note, 0.27, 'triangle', 0.055, 'combat', at);
      this.tone(note * 2, note, 0.10, 'sine', 0.025, 'combat', at);
    }
    if (beat % 4 === 0) this.tone(100, 38, 0.17, 'sine', 0.095, 'combat', at);
    if (beat % 4 === 2) this.noise(0.10, 1400, 500, 0.038, 'bandpass', 'combat', at);
    this.noise(0.035, 4200, 2200, beat % 2 ? 0.015 : 0.009, 'highpass', 'combat', at);
    if (level > 1 && (beat === 7 || beat === 15)) {
      this.tone(220, 220, 0.20, 'triangle', 0.022, 'combat', at);
    }
  }
}

export const soundManager = new RetroSoundManager();
