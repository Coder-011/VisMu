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
  const handTrackingRef = useRef<HandTracking | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [camError, setCamError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  const {
    setHandTrackingActive, setConfidenceScore,
    setPitchData, setLatency, setHoleStates, setMetrics,
  } = useVisMuStore();

  const drawLandmarks = useCallback((landmarks: any[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    ctx.strokeStyle = 'rgba(0,242,255,0.6)';
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const lmA = landmarks[a], lmB = landmarks[b];
      if (!lmA || !lmB) continue;
      ctx.beginPath();
      ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
      ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
      ctx.stroke();
    }

    // Fingertips in accent colour, rest in cyan
    const tipIds = new Set([4, 8, 12, 16, 20]);
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, tipIds.has(i) ? 6 : 3, 0, Math.PI * 2);
      ctx.fillStyle = tipIds.has(i) ? '#ffffff' : '#00f2ff';
      ctx.fill();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const processResults = useCallback((results: any) => {
    const startTime = performance.now();
    if (results.multiHandLandmarks?.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandTrackingActive(true);
      drawLandmarks(landmarks);
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
      clearCanvas();
    }
  }, [setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics, drawLandmarks, clearCanvas]);

  useEffect(() => {
    if (!initialized) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        // Init hand tracking
        const tracker = new HandTracking(processResults);
        handTrackingRef.current = tracker;

        // Poll until model ready, then switch to rAF loop
        const waitForModel = setInterval(() => {
          if (tracker.isReady()) {
            clearInterval(waitForModel);
            setModelLoading(false);

            const loop = () => {
              if (video.readyState === 4) tracker.send(video);
              rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
          }
        }, 200);

      } catch (err: any) {
        setCamError(err?.message ?? 'Camera unavailable');
      }
    };

    startCamera();

    return () => {
      cancelAnimationFrame(rafRef.current);
      handTrackingRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [initialized, processResults]);

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
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
      {initialized && modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] text-[#00f2ff] font-bold tracking-widest">LOADING MODEL...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamView;
