import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.Sampler | null = null;
  private currentNote: string | null = null;
  private initialized = false;

  public async initialize() {
    if (this.initialized) return;

    // In a real app, these would be URLs to high-quality samples
    this.synth = new Tone.Sampler({
      urls: {
        Sa: "sa.wav",
        Re: "re.wav",
        Ga: "ga.wav",
        Ma: "ma.wav",
        Pa: "pa.wav",
        Dha: "dha.wav",
        Ni: "ni.wav",
      },
      baseUrl: "http://localhost:3000/audio/",
      onload: () => {
        console.log("Flute samples loaded");
      },
      onerror: (err) => {
        console.warn("Could not load samples, falling back to synthesis", err);
        this.setupFallbackSynth();
      }
    }).toDestination();

    await Tone.start();
    this.initialized = true;
  }

  private setupFallbackSynth() {
    // A simple flute-like synth using sine waves and noise
    this.synth = new Tone.Sampler({
       urls: {
         C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
       }
    }).toDestination();
  }

  public playNote(note: string | null) {
    if (!this.initialized || !this.synth) return;

    if (note === this.currentNote) return;

    if (this.currentNote) {
      this.synth.triggerRelease(this.currentNote);
    }

    if (note) {
      // Map Sa, Re, etc. to frequencies or piano keys for the sampler
      const noteMap: any = {
        'Sa': 'C4',
        'Re': 'D4',
        'Ga': 'E4',
        'Ma': 'F4',
        'Pa': 'G4',
        'Dha': 'A4',
        'Ni': 'B4',
      };
      
      const midiNote = noteMap[note];
      if (midiNote) {
        this.synth.triggerAttack(midiNote);
      }
    }

    this.currentNote = note;
  }
}

export const audioEngine = new AudioEngine();
