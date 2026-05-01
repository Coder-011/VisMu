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
  const [camError, setCamError] = useState<string | null>(null);

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections = [
      [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
    ];
    ctx.strokeStyle = 'rgba(0,242,255,0.5)';
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const lmA = landmarks[a], lmB = landmarks[b];
      if (!lmA || !lmB) continue;
      ctx.beginPath();
      ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
      ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
      ctx.stroke();
    }
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00f2ff';
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
    let interval: ReturnType<typeof setInterval>;

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
        interval = setInterval(() => {
          const video = videoRef.current;
          if (video && video.readyState === 4 && handTrackingRef.current?.isReady()) {
            handTrackingRef.current.send(video);
          }
        }, 50);
      } catch (err: any) {
        setCamError(err?.message ?? 'Camera unavailable');
      }
    };

    startCamera();
    return () => {
      clearInterval(interval);
      handTrackingRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [initialized, processResults]);

  if (camError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
        <p className="text-red-400 text-xs text-center px-4">{camError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
    </div>
  );
};

export default WebcamView;
