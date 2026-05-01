const SWARA_FREQUENCIES: Record<string, number> = {
  Sa: 440, Re: 494, Ga: 523, Ma: 587, Pa: 659, Dha: 739, Ni: 830,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentNote: string | null = null;
  private initialized = false;

  public async initialize() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      await this.ctx.resume();

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0;

      // Slight reverb via convolver approximation using delay
      const delay = this.ctx.createDelay(0.5);
      delay.delayTime.value = 0.15;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.25;
      delay.connect(feedback);
      feedback.connect(delay);
      this.gainNode.connect(delay);
      delay.connect(this.ctx.destination);
      this.gainNode.connect(this.ctx.destination);

      // Single persistent oscillator
      this.oscillator = this.ctx.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 440;
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();

      this.initialized = true;
      console.log('✅ Audio engine initialized');
    } catch (err) {
      console.warn('⚠️ Audio engine failed:', err);
    }
  }

  public playNote(note: string | null) {
    if (!this.initialized || !this.ctx || !this.oscillator || !this.gainNode) return;
    if (note === this.currentNote) return;

    const now = this.ctx.currentTime;

    if (!note || note === '--') {
      // Fade out
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
      this.currentNote = null;
      return;
    }

    const freq = SWARA_FREQUENCIES[note];
    if (!freq) return;

    // Glide to new frequency
    this.oscillator.frequency.cancelScheduledValues(now);
    this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
    this.oscillator.frequency.linearRampToValueAtTime(freq, now + 0.05);

    // Fade in if was silent
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);

    this.currentNote = note;
  }

  public isInitialized() { return this.initialized; }
}

export const audioEngine = new AudioEngine();
