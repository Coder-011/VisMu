export type Note = 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni' | null;

export interface HoleState {
  H1: boolean; // true = closed
  H2: boolean;
  H3: boolean;
  H4: boolean;
  H5: boolean;
  H6: boolean;
}

export class NoteMappingService {
  public determineNote(holeState: HoleState): Note {
    const { H1, H2, H3, H4, H5, H6 } = holeState;

    // Mapping based on # VisMu Flute Detection Backend - C.txt
    
    // Pa (659 Hz) ← H1, H2, H3, H4, H5, H6 ALL CLOSED
    if (H1 && H2 && H3 && H4 && H5 && H6) return 'Pa';

    // Dha (739 Hz) ← H1, H2, H3, H4, H5 closed | H6 open
    if (H1 && H2 && H3 && H4 && H5 && !H6) return 'Dha';

    // Ni (830 Hz) ← H1, H2, H3, H4 closed | H5, H6 open
    if (H1 && H2 && H3 && H4 && !H5 && !H6) return 'Ni';

    // Sa (440 Hz) ← H1, H2, H3 closed | H4, H5, H6 open
    if (H1 && H2 && H3 && !H4 && !H5 && !H6) return 'Sa';

    // Re (494 Hz) ← H1, H2 closed | H3, H4, H5, H6 open
    if (H1 && H2 && !H3 && !H4 && !H5 && !H6) return 'Re';

    // Ga (523 Hz) ← H1 closed | H2, H3, H4, H5, H6 open
    if (H1 && !H2 && !H3 && !H4 && !H5 && !H6) return 'Ga';

    // Ma (587 Hz) ← H1 open (all holes open)
    if (!H1 && !H2 && !H3 && !H4 && !H5 && !H6) return 'Ma';

    return null;
  }

  public getFrequency(note: Note): number {
    const frequencies: any = {
      'Sa': 440,
      'Re': 494,
      'Ga': 523,
      'Ma': 587,
      'Pa': 659,
      'Dha': 739,
      'Ni': 830,
    };
    return note ? frequencies[note] : 0;
  }
}

export const noteMappingService = new NoteMappingService();
