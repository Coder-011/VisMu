import React, { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { HandTracking, detectNoteFromLandmarks } from '../systems/handTracking';
import { useVisMuStore } from '../store/useVisMuStore';
import { audioEngine } from '../systems/audioEngine';

interface WebcamViewProps {
  initialized: boolean;
}

const WebcamView: React.FC<WebcamViewProps> = ({ initialized }) => {
  const webcamRef = useRef<Webcam>(null);
  const handTrackingRef = useRef<HandTracking | null>(null);
  const [camError, setCamError] = useState(false);
  const {
    setHandTrackingActive,
    setConfidenceScore,
    setPitchData,
    setLatency,
    setHoleStates,
    setMetrics,
  } = useVisMuStore();

  const processResults = useCallback(
    (results: any) => {
      const startTime = performance.now();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandTrackingActive(true);
        const landmarks = results.multiHandLandmarks[0];
        const detection = detectNoteFromLandmarks(landmarks);

        setConfidenceScore(detection.confidence);
        setPitchData(detection.note, detection.freq);
        setHoleStates(detection.holeStates);
        setMetrics(detection.pressure, 88);
        audioEngine.playNote(detection.note);

        const latency = performance.now() - startTime;
        setLatency(parseFloat(latency.toFixed(1)));
      } else {
        setHandTrackingActive(false);
        setConfidenceScore(0);
        setPitchData('--', 0);
        audioEngine.playNote(null);
      }
    },
    [setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics],
  );

  useEffect(() => {
    if (!initialized) return;

    handTrackingRef.current = new HandTracking(processResults);

    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        handTrackingRef.current?.isReady()
      ) {
        await handTrackingRef.current.send(webcamRef.current.video);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      handTrackingRef.current?.close();
    };
  }, [initialized, processResults]);

  return (
    <div className="relative w-full h-full">
      {camError ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-600 text-xs italic">Camera unavailable</p>
        </div>
      ) : (
        <Webcam
          ref={webcamRef}
          mirrored
          audio={false}
          className="w-full h-full object-cover"
          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
          onUserMediaError={() => setCamError(true)}
        />
      )}
    </div>
  );
};

export default WebcamView;
