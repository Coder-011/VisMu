import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { HandTracking, detectNoteFromLandmarks } from '../systems/handTracking';
import { useVisMuStore } from '../store/useVisMuStore';
import { audioEngine } from '../systems/audioEngine';
const WebcamView = ({ initialized }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handTrackingRef = useRef(null);
    const streamRef = useRef(null);
    const [camError, setCamError] = useState(null);
    const [backendError, setBackendError] = useState(null);
    const { setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics, useBackendAPI, backendConnected, setBackendConnected, } = useVisMuStore();
    const drawLandmarks = useCallback((landmarks) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17],
        ];
        ctx.strokeStyle = 'rgba(0,242,255,0.5)';
        ctx.lineWidth = 2;
        for (const [a, b] of connections) {
            const lmA = landmarks[a], lmB = landmarks[b];
            if (!lmA || !lmB)
                continue;
            ctx.beginPath();
            ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
            ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
            ctx.stroke();
        }
        // Draw dots
        for (const lm of landmarks) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2ff';
            ctx.fill();
        }
    }, []);
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }, []);
    const processResults = useCallback(async (results) => {
        const startTime = performance.now();
        if (results.multiHandLandmarks?.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            setHandTrackingActive(true);
            drawLandmarks(landmarks);
            if (useBackendAPI && backendConnected) {
                // Send to backend API
                try {
                    const response = await fetch('http://localhost:3000/api/detect/landmarks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            landmarks,
                            timestamp: Date.now(),
                            sessionId: 'vismu-session',
                        }),
                    });
                    if (!response.ok)
                        throw new Error(`Backend error: ${response.status}`);
                    const data = await response.json();
                    setConfidenceScore(data.confidence || 0);
                    // Map note to frequency if not provided by backend
                    const noteFrequencies = {
                        'Sa': 440, 'Re': 494, 'Ga': 523, 'Ma': 587, 'Pa': 659, 'Dha': 739, 'Ni': 830
                    };
                    const freq = data.frequency || (data.currentNote ? noteFrequencies[data.currentNote] || 0 : 0);
                    setPitchData(data.currentNote || '--', freq);
                    // Convert backend holeState object to boolean array
                    const backendHoleStates = data.holeState
                        ? Object.values(data.holeState).slice(0, 6)
                        : [false, false, false, false, false, false];
                    setHoleStates(backendHoleStates);
                    // Pressure is array from backend, take first value or 0
                    const pressure = Array.isArray(data.pressure) ? data.pressure[0] || 0 : 0;
                    setMetrics(pressure, 88);
                    setLatency(data.latency || parseFloat((performance.now() - startTime).toFixed(1)));
                    audioEngine.playNote(data.currentNote && data.currentNote !== '--' ? data.currentNote : null);
                    setBackendError(null);
                }
                catch (err) {
                    console.error('Backend API failed:', err);
                    setBackendError('Backend unavailable, using local detection');
                    setBackendConnected(false);
                    // Fallback to local detection
                    const detection = detectNoteFromLandmarks(landmarks);
                    setConfidenceScore(detection.confidence);
                    setPitchData(detection.note, detection.freq);
                    setHoleStates(detection.holeStates);
                    setMetrics(detection.pressure, 88);
                    audioEngine.playNote(detection.note && detection.note !== '--' ? detection.note : null);
                    setLatency(parseFloat((performance.now() - startTime).toFixed(1)));
                }
            }
            else {
                // Local detection
                const detection = detectNoteFromLandmarks(landmarks);
                setConfidenceScore(detection.confidence);
                setPitchData(detection.note, detection.freq);
                setHoleStates(detection.holeStates);
                setMetrics(detection.pressure, 88);
                audioEngine.playNote(detection.note && detection.note !== '--' ? detection.note : null);
                setLatency(parseFloat((performance.now() - startTime).toFixed(1)));
            }
        }
        else {
            setHandTrackingActive(false);
            setConfidenceScore(0);
            setPitchData('--', 0);
            audioEngine.playNote(null);
            clearCanvas();
        }
    }, [useBackendAPI, backendConnected, setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics, drawLandmarks, clearCanvas]);
    useEffect(() => {
        if (!initialized)
            return;
        let interval;
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: false,
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                handTrackingRef.current = new HandTracking(processResults);
                interval = setInterval(async () => {
                    const video = videoRef.current;
                    if (video && video.readyState === 4 && handTrackingRef.current?.isReady()) {
                        await handTrackingRef.current.send(video);
                    }
                }, 50);
                // Check backend connection if enabled
                if (useBackendAPI) {
                    try {
                        const healthRes = await fetch('http://localhost:3000/api/health');
                        setBackendConnected(healthRes.ok);
                        if (!healthRes.ok)
                            setBackendError('Backend offline');
                    }
                    catch {
                        setBackendConnected(false);
                        setBackendError('Backend unavailable');
                    }
                }
            }
            catch (err) {
                console.error('Camera error:', err);
                setCamError(err?.message ?? 'Camera unavailable');
            }
        };
        startCamera();
        return () => {
            clearInterval(interval);
            handTrackingRef.current?.close();
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [initialized, processResults, useBackendAPI]);
    if (camError) {
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-neutral-900", children: _jsx("p", { className: "text-red-400 text-xs text-center px-4", children: camError }) }));
    }
    if (backendError) {
        return (_jsx("div", { className: "absolute top-2 left-2 z-20 bg-red-900/80 text-white text-[10px] px-2 py-1 rounded", children: backendError }));
    }
    return (_jsxs("div", { className: "relative w-full h-full", children: [useBackendAPI && (_jsxs("div", { className: "absolute top-2 left-2 z-20 flex items-center space-x-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-[10px] text-white bg-black/50 px-1 py-0.5 rounded", children: backendConnected ? 'BACKEND' : 'LOCAL' })] })), _jsx("video", { ref: videoRef, className: "w-full h-full object-cover", playsInline: true, muted: true, style: { transform: 'scaleX(-1)' } }), _jsx("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full pointer-events-none", style: { transform: 'scaleX(-1)' } })] }));
};
export default WebcamView;
//# sourceMappingURL=WebcamView.js.map