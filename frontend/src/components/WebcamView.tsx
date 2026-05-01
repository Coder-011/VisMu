import React, { useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { HandTracking } from '../systems/handTracking';
import { useVisMuStore } from '../store/useVisMuStore';
import axios from 'axios';
import { audioEngine } from '../systems/audioEngine';

const WebcamView: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const { setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics } = useVisMuStore();
  const handTrackingRef = useRef<HandTracking | null>(null);

  const processResults = useCallback(async (results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandTrackingActive(true);
      const landmarks = results.multiHandLandmarks[0];
      const confidence = results.multiHandWorldLandmarks?.[0]?.[0]?.visibility || 0.992; // Mock if not available
      setConfidenceScore(confidence);

      // Send landmarks to backend
      try {
        const response = await axios.post('http://localhost:3000/api/detect/landmarks', {
          landmarks,
          timestamp: Date.now(),
        });

        const { holeState, currentNote, frequency, latency, pressure } = response.body || response.data;
        
        setPitchData(currentNote || '--', frequency);
        setLatency(latency);
        audioEngine.playNote(currentNote);
        
        const states = [
          holeState.H1,
          holeState.H2,
          holeState.H3,
          holeState.H4,
          holeState.H5,
          holeState.H6
        ];
        setHoleStates(states);
        
        // Calculate average pressure for display
        const avgPressure = pressure.reduce((a: number, b: number) => a + b, 0) / 6;
        setMetrics(Math.round(avgPressure), 88); // Resonance mock for now
      } catch (err) {
        console.error('Backend error:', err);
      }
    } else {
      setHandTrackingActive(false);
      setConfidenceScore(0);
    }
  }, [setHandTrackingActive, setConfidenceScore, setPitchData, setLatency, setHoleStates, setMetrics]);

  useEffect(() => {
    handTrackingRef.current = new HandTracking(processResults);

    const interval = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        await handTrackingRef.current?.send(webcamRef.current.video);
      }
    }, 50); // 20 FPS for processing to save CPU

    return () => {
      clearInterval(interval);
      handTrackingRef.current?.close();
    };
  }, [processResults]);

  return (
    <div className="relative w-full h-full">
      <Webcam
        ref={webcamRef}
        mirrored
        audio={false}
        className="w-full h-full object-cover"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "user"
        }}
      />
    </div>
  );
};

export default WebcamView;
