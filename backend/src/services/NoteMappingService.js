"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteMappingService = exports.NoteMappingService = void 0;
class NoteMappingService {
    determineNote(holeState) {
        const { H1, H2, H3, H4, H5, H6 } = holeState;
        // Mapping based on # VisMu Flute Detection Backend - C.txt
        // Pa (659 Hz) ← H1, H2, H3, H4, H5, H6 ALL CLOSED
        if (H1 && H2 && H3 && H4 && H5 && H6)
            return 'Pa';
        // Dha (739 Hz) ← H1, H2, H3, H4, H5 closed | H6 open
        if (H1 && H2 && H3 && H4 && H5 && !H6)
            return 'Dha';
        // Ni (830 Hz) ← H1, H2, H3, H4 closed | H5, H6 open
        if (H1 && H2 && H3 && H4 && !H5 && !H6)
            return 'Ni';
        // Sa (440 Hz) ← H1, H2, H3 closed | H4, H5, H6 open
        if (H1 && H2 && H3 && !H4 && !H5 && !H6)
            return 'Sa';
        // Re (494 Hz) ← H1, H2 closed | H3, H4, H5, H6 open
        if (H1 && H2 && !H3 && !H4 && !H5 && !H6)
            return 'Re';
        // Ga (523 Hz) ← H1 closed | H2, H3, H4, H5, H6 open
        if (H1 && !H2 && !H3 && !H4 && !H5 && !H6)
            return 'Ga';
        // Ma (587 Hz) ← H1 open (all holes open)
        if (!H1 && !H2 && !H3 && !H4 && !H5 && !H6)
            return 'Ma';
        return null;
    }
    getFrequency(note) {
        const frequencies = {
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
exports.NoteMappingService = NoteMappingService;
exports.noteMappingService = new NoteMappingService();
//# sourceMappingURL=NoteMappingService.js.map