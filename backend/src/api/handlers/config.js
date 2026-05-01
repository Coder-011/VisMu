"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.getDefaults = void 0;
const express_1 = require("express");
// Default configuration
const defaultConfig = {
    calibrationMode: 'auto',
    audioFormat: 'wav',
    targetLatency: 4,
    smoothing: 'kalman',
    pressureSensitivity: 0.8,
};
// In-memory config store (in production, use database)
const configStore = { ...defaultConfig };
const getDefaults = (req, res) => {
    res.json({
        calibrationMode: configStore.calibrationMode,
        audioFormat: configStore.audioFormat,
        targetLatency: configStore.targetLatency,
        smoothing: configStore.smoothing,
        pressureSensitivity: configStore.pressureSensitivity,
    });
};
exports.getDefaults = getDefaults;
const updateConfig = (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value required' });
    }
    if (!(key in configStore)) {
        return res.status(400).json({ error: 'Invalid configuration key' });
    }
    // Update config
    configStore[key] = value;
    res.json({
        updated: true,
        config: { ...configStore }
    });
};
exports.updateConfig = updateConfig;
//# sourceMappingURL=config.js.map