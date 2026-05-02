import React, { useRef, useEffect, useCallback, useState } from 'react';
import { HandTracking, detectNoteFromLandmarks } from '../systems/handTracking';
import { useVisMuStore } from '../store/useVisMuStore';
import { audioEngine } from '../systems/audioEngine';
import { logMetric } from '../systems/api';

interface WebcamViewProps { initialized: boolean; }

const WebcamView: React.FC<WebcamViewProps> = ({ initialized }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  const storeRef = useRef(useVisMuStore.getState());
  useEffect(() => useVisMuStore.subscribe(s => { storeRef.current = s; }), []);

  const drawLandmarks = useCallback((landmarks: any[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const connections = [
      [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
    ];
    ctx.strokeStyle = 'rgba(0,242,255,0.7)';
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const A = landmarks[a], B = landmarks[b];
      if (!A || !B) continue;
      ctx.beginPath();
      ctx.moveTo(A.x * canvas.width, A.y * canvas.height);
      ctx.lineTo(B.x * canvas.width, B.y * canvas.height);
      ctx.stroke();
    }
    const tips = new Set([4, 8, 12, 16, 20]);
    landmarks.forEach((lm, i) => {
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, tips.has(i) ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = tips.has(i) ? '#ffffff' : '#00f2ff';
      ctx.fill();
    });
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

        const tracker = new HandTracking((results: any) => {
          if (!activeRef.current) return;
          const { setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics } = storeRef.current;
          const startTime = performance.now();
          if (results.multiHandLandmarks?.length > 0) {
            const lm = results.multiHandLandmarks[0];
            setHandTrackingActive(true);
            const canvas = canvasRef.current, vid = videoRef.current;
            if (canvas && vid) drawLandmarks(lm, canvas, vid);
            const d = detectNoteFromLandmarks(lm);
            setConfidenceScore(d.confidence);
            setPitchData(d.note, d.freq);
            setHoleStates(d.holeStates);
            setMetrics(d.pressure, 88);
            audioEngine.playNote(d.note);
            const latency = parseFloat((performance.now() - startTime).toFixed(1));
            setLatency(latency);
            logMetric({ note: d.note, latency, confidence: d.confidence });
          } else {
            setHandTrackingActive(false);
            setConfidenceScore(0);
            setPitchData('--', 0);
            audioEngine.playNote(null);
            const canvas = canvasRef.current;
            if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          }
        });

        // Poll for ready/failed — max 35s
        let elapsed = 0;
        const waitId = setInterval(() => {
          if (!activeRef.current) { clearInterval(waitId); return; }
          elapsed += 300;
          if (tracker.isReady()) {
            clearInterval(waitId);
            setModelStatus('ready');
            const loop = () => {
              if (!activeRef.current) return;
              if (video.readyState === 4) tracker.send(video);
              rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
          } else if (tracker.isFailed() || elapsed > 35000) {
            clearInterval(waitId);
            setModelStatus('failed');
          }
        }, 300);

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
      if (video) { clearInterval((video as any)._waitId); (video as any)._tracker?.close(); }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [initialized, drawLandmarks]);

  if (camError) return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <div className="text-center space-y-2 px-4">
        <p className="text-red-400 text-xs">{camError}</p>
        <p className="text-gray-600 text-[10px]">Check camera permissions and reload</p>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
      {initialized && modelStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-[#00f2ff] font-bold tracking-widest">LOADING AI MODEL</p>
            <p className="text-[9px] text-gray-400">First load ~10–20s</p>
          </div>
        </div>
      )}
      {initialized && modelStatus === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center space-y-2 px-4">
            <p className="text-red-400 text-xs font-bold">MODEL FAILED TO LOAD</p>
            <p className="text-gray-500 text-[10px]">Reload the page to retry</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamView;
