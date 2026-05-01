import * as Tone from 'tone';

// Note frequencies for the bansuri swaras
const SWARA_FREQUENCIES: Record<string, number> = {
  Sa: 440,
  Re: 494,
  Ga: 523,
  Ma: 587,
  Pa: 659,
  Dha: 739,
  Ni: 830,
};

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private currentNote: string | null = null;
  private initialized = false;

  public async initialize() {
    if (this.initialized) return;

    try {
      await Tone.start();

      // Use a synthesizer that sounds flute-like (sine + slight detune)
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.8,
          release: 0.4,
        },
        volume: -8,
      }).toDestination();

      // Add reverb for ambiance
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
      this.synth.connect(reverb);

      this.initialized = true;
      console.log('✅ Audio engine initialized');
    } catch (err) {
      console.warn('⚠️ Audio engine failed to init:', err);
    }
  }

  public playNote(note: string | null) {
    if (!this.initialized || !this.synth) return;
    if (note === this.currentNote) return;
    if (note === '--' || !note) {
      // Stop current note
      if (this.currentNote) {
        const freq = SWARA_FREQUENCIES[this.currentNote];
        if (freq) {
          try { this.synth.triggerRelease(freq); } catch { /* ignore */ }
        }
      }
      this.currentNote = null;
      return;
    }

    // Release old note
    if (this.currentNote) {
      const oldFreq = SWARA_FREQUENCIES[this.currentNote];
      if (oldFreq) {
        try { this.synth.triggerRelease(oldFreq); } catch { /* ignore */ }
      }
    }

    // Play new note
    const freq = SWARA_FREQUENCIES[note];
    if (freq) {
      try {
        this.synth.triggerAttack(freq);
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    }

    this.currentNote = note;
  }

  public isInitialized() {
    return this.initialized;
  }
}

export const audioEngine = new AudioEngine();
