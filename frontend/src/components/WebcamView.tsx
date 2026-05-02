import React, { useRef, useEffect, useCallback, useState } from 'react';
import { HandTracking, detectNoteFromLandmarks } from '../systems/handTracking';
import { useVisMuStore } from '../store/useVisMuStore';
import { audioEngine } from '../systems/audioEngine';
import { logMetric } from '../systems/api';

interface WebcamViewProps {
  initialized: boolean;
}

const WebcamView: React.FC<WebcamViewProps> = ({ initialized }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  const storeRef = useRef(useVisMuStore.getState());
  useEffect(() => useVisMuStore.subscribe(s => { storeRef.current = s; }), []);

  const drawLandmarks = useCallback((landmarks: any[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];
    ctx.strokeStyle = 'rgba(0,242,255,0.7)';
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const lmA = landmarks[a], lmB = landmarks[b];
      if (!lmA || !lmB) continue;
      ctx.beginPath();
      ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
      ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
      ctx.stroke();
    }
    const tipIds = new Set([4, 8, 12, 16, 20]);
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, tipIds.has(i) ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = tipIds.has(i) ? '#ffffff' : '#00f2ff';
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    activeRef.current = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        // Create tracker — pass a stable ref-based callback
        const tracker = new HandTracking((results: any) => {
          if (!activeRef.current) return;
          const startTime = performance.now();
          const { setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics } = storeRef.current;

          if (results.multiHandLandmarks?.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            setHandTrackingActive(true);
            const canvas = canvasRef.current;
            const vid = videoRef.current;
            if (canvas && vid) drawLandmarks(landmarks, canvas, vid);

            const detection = detectNoteFromLandmarks(landmarks);
            setConfidenceScore(detection.confidence);
            setPitchData(detection.note, detection.freq);
            setHoleStates(detection.holeStates);
            setMetrics(detection.pressure, 88);
            audioEngine.playNote(detection.note);

            const latency = parseFloat((performance.now() - startTime).toFixed(1));
            setLatency(latency);
            logMetric({ note: detection.note, latency, confidence: detection.confidence });
          } else {
            setHandTrackingActive(false);
            setConfidenceScore(0);
            setPitchData('--', 0);
            audioEngine.playNote(null);
            const canvas = canvasRef.current;
            if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          }
        });

        // Wait for model, then start rAF loop
        const waitId = setInterval(() => {
          if (!activeRef.current) { clearInterval(waitId); return; }
          if (tracker.isReady()) {
            clearInterval(waitId);
            setModelLoading(false);
            const loop = () => {
              if (!activeRef.current) return;
              if (video.readyState === 4) tracker.send(video);
              rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
          }
        }, 300);

        // Store tracker for cleanup
        (video as any)._tracker = tracker;
        (video as any)._waitId = waitId;

      } catch (err: any) {
        setCamError(err?.message ?? 'Camera unavailable — check permissions');
      }
    };

    startCamera();

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      const video = videoRef.current;
      if (video) {
        clearInterval((video as any)._waitId);
        (video as any)._tracker?.close();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [initialized, drawLandmarks]); // stable deps only

  if (camError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center space-y-2 px-4">
          <p className="text-red-400 text-xs">{camError}</p>
          <p className="text-gray-600 text-[10px]">Check camera permissions and reload</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
      {initialized && modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-[#00f2ff] font-bold tracking-widest">LOADING AI MODEL...</p>
            <p className="text-[9px] text-gray-500">First load may take ~10s</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamView;
