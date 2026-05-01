export type Note = 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni' | null;
export interface HoleState {
    H1: boolean;
    H2: boolean;
    H3: boolean;
    H4: boolean;
    H5: boolean;
    H6: boolean;
}
export declare class NoteMappingService {
    determineNote(holeState: HoleState): Note;
    getFrequency(note: Note): number;
}
export declare const noteMappingService: NoteMappingService;
//# sourceMappingURL=NoteMappingService.d.ts.map