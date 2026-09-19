// Web Audio API Procedural Retro Sound Engine
// Zero external audio files: pure browser synthesis following "Less is More"

class RetroSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private flatlineOsc: OscillatorNode | null = null;
  private flatlineGain: GainNode | null = null;
  private sirenInterval: number | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSirens();
      this.stopFlatline();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Core Synth Primitives ---

  /** Play a frequency-swept oscillator tone */
  private playTone(freq: number, endFreq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /** Play filtered white noise burst */
  private playNoise(duration: number, cutoff: number, vol: number = 0.2) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
  }

  // --- Game SFX ---

  public playClick(pitch = 520) {
    this.playTone(pitch, pitch * 1.5, 0.04, 'square', 0.08);
  }

  public playPunch() {
    this.playNoise(0.08, 1200, 0.3);
  }

  public playKick() {
    this.playTone(220, 35, 0.15, 'triangle', 0.45);
  }

  public playBlock() {
    this.playTone(880, 440, 0.08, 'square', 0.15);
  }

  public playJump() {
    this.playTone(150, 600, 0.12, 'square', 0.12);
  }

  public playSlide() {
    this.playTone(400, 100, 0.16, 'sawtooth', 0.12);
  }

  public playCoin() {
    [988, 1318].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, freq, 0.2, 'square', 0.1), idx * 80);
    });
  }

  public playDrugBoost() {
    [262, 330, 392, 523, 659, 784].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, freq * 1.05, 0.15, 'sine', 0.12), idx * 45);
    });
  }

  public startSirens() {
    if (this.isMuted || this.sirenInterval) return;
    let high = true;
    this.sirenInterval = window.setInterval(() => {
      this.playTone(high ? 780 : 580, high ? 740 : 540, 0.28, 'sawtooth', 0.07);
      high = !high;
    }, 300);
  }

  public stopSirens() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  public playHeartbeat(strength = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const thump = (delay: number, freq: number, vol: number) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, ctx.currentTime);

        gain.gain.setValueAtTime(vol * strength, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }, delay);
    };

    thump(0, 75, 0.45);   // Lub
    thump(120, 60, 0.35); // Dub
  }

  public startFlatline() {
    if (this.isMuted || this.flatlineOsc) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.flatlineOsc = ctx.createOscillator();
    this.flatlineGain = ctx.createGain();
    this.flatlineOsc.type = 'sine';
    this.flatlineOsc.frequency.setValueAtTime(800, ctx.currentTime);
    this.flatlineGain.gain.setValueAtTime(0.12, ctx.currentTime);

    this.flatlineOsc.connect(this.flatlineGain);
    this.flatlineGain.connect(ctx.destination);
    this.flatlineOsc.start();
  }

  public stopFlatline() {
    if (this.flatlineOsc) {
      try {
        this.flatlineOsc.stop();
        this.flatlineOsc.disconnect();
      } catch {}
      this.flatlineOsc = null;
      this.flatlineGain = null;
    }
  }

  public playGlitch() {
    this.playNoise(0.06, 2000, 0.25);
  }
}

export const soundManager = new RetroSoundManager();
