// C-scale bansuri frequencies — must match NOTE_MAP in handTracking.ts
const SWARA_FREQUENCIES: Record<string, number> = {
  'Sa':  261.6,
  'Re':  293.7,
  'Ga':  329.6,
  'Ma':  349.2,
  'Pa':  392.0,
  'Dha': 440.0,
  'Ni':  493.9,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private noteGain: GainNode | null = null;
  private currentNote: string | null = null;
  private initialized = false;

  public async initialize() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      await this.ctx.resume();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;

      // Reverb via convolver
      const convolver = this.ctx.createConvolver();
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.2;
      const rate = this.ctx.sampleRate;
      const len = rate * 1.5;
      const impulse = this.ctx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const ch = impulse.getChannelData(c);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      convolver.buffer = impulse;
      this.masterGain.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(this.ctx.destination);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      console.log('✅ Audio engine initialized');
    } catch (err) {
      console.warn('⚠️ Audio engine failed:', err);
    }
  }

  private stopCurrent(when: number) {
    if (!this.noteGain || !this.ctx) return;
    const g = this.noteGain;
    const now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, when);
    const delay = (when - now + 0.05) * 1000;
    setTimeout(() => { try { g.disconnect(); } catch { /* ignore */ } }, delay);
    this.oscs.forEach(o => { try { o.stop(when + 0.05); } catch { /* ignore */ } });
    this.oscs = [];
    this.noteGain = null;
  }

  public playNote(note: string | null) {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    if (note === this.currentNote) return;

    const now = this.ctx.currentTime;
    this.stopCurrent(now + 0.08);
    this.currentNote = null;

    if (!note || note === '--') return;

    const baseFreq = SWARA_FREQUENCIES[note];
    if (!baseFreq) return;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(1.0, now + 0.06);
    noteGain.connect(this.masterGain);

    // Flute timbre: fundamental + soft harmonics
    const harmonics = [{ mult: 1, gain: 0.7 }, { mult: 2, gain: 0.15 }, { mult: 3, gain: 0.05 }];
    const oscs: OscillatorNode[] = harmonics.map(({ mult, gain }) => {
      const osc = this.ctx!.createOscillator();
      const hg = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * mult;
      hg.gain.value = gain;
      osc.connect(hg);
      hg.connect(noteGain);
      osc.start(now);
      return osc;
    });

    // Vibrato LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 5.5;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    oscs.forEach(o => lfoGain.connect(o.frequency));
    lfo.start(now + 0.15);

    this.oscs = [...oscs, lfo];
    this.noteGain = noteGain;
    this.currentNote = note;
  }

  public isInitialized() { return this.initialized; }
}

export const audioEngine = new AudioEngine();
