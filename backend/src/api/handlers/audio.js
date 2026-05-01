"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopNote = exports.playNote = exports.getNote = void 0;
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Audio directory - should contain pre-recorded flute notes
const AUDIO_DIR = path_1.default.join(__dirname, '../../public/audio');
// In-memory playback tracking (for demo purposes)
const activePlaybacks = new Map();
const getNote = (req, res) => {
    const noteParam = req.params.note;
    const note = Array.isArray(noteParam) ? noteParam[0] : noteParam;
    const formatParam = req.query.format;
    const format = Array.isArray(formatParam) ? formatParam[0] : (formatParam || 'wav');
    if (!note) {
        return res.status(400).json({ error: 'Note parameter required' });
    }
    // Validate note
    const validNotes = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
    if (!validNotes.includes(note)) {
        return res.status(400).json({ error: 'Invalid note' });
    }
    const filename = `${note.toLowerCase()}.${format}`;
    const filePath = path_1.default.join(AUDIO_DIR, filename);
    // Check if file exists
    if (!fs_1.default.existsSync(filePath)) {
        // For demo, return a placeholder response
        return res.status(404).json({
            error: 'Audio file not found',
            message: `Expected file: ${filename} in ${AUDIO_DIR}`,
            note: note,
            frequency: getFrequency(note)
        });
    }
    res.sendFile(filePath);
};
exports.getNote = getNote;
const playNote = (req, res) => {
    const { note, duration, volume } = req.body;
    if (!note) {
        return res.status(400).json({ error: 'Note required' });
    }
    const playbackId = `pb_${Date.now()}`;
    const noteDuration = duration || 2000;
    activePlaybacks.set(playbackId, {
        startTime: Date.now(),
        duration: noteDuration
    });
    // Clean up after duration
    setTimeout(() => {
        activePlaybacks.delete(playbackId);
    }, noteDuration);
    res.json({
        playbackId,
        duration: noteDuration,
        status: 'playing',
        note,
        volume: volume || 0.8
    });
};
exports.playNote = playNote;
const stopNote = (req, res) => {
    const { playbackId } = req.body;
    if (playbackId && activePlaybacks.has(playbackId)) {
        const playback = activePlaybacks.get(playbackId);
        const elapsed = Date.now() - playback.startTime;
        activePlaybacks.delete(playbackId);
        return res.json({
            status: 'stopped',
            duration: elapsed,
            playbackId
        });
    }
    res.json({ status: 'no_active_playback' });
};
exports.stopNote = stopNote;
function getFrequency(note) {
    const frequencies = {
        'Sa': 440, 'Re': 494, 'Ga': 523, 'Ma': 587, 'Pa': 659, 'Dha': 739, 'Ni': 830
    };
    return frequencies[note] || 0;
}
//# sourceMappingURL=audio.js.map