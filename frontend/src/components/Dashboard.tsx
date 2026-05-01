import React, { useState, useRef } from 'react';
import { useVisMuStore } from '../store/useVisMuStore';
import { Disc, RotateCcw, Camera, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WebcamView from './WebcamView';
import Flute3D from './Flute3D';
import { audioEngine } from '../systems/audioEngine';
import { clearSessionMetrics, getPerformanceSummary } from '../systems/api';

interface DashboardProps {
  initialized: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ initialized }) => {
  const {
    handTrackingActive, confidenceScore, currentPitch, frequency,
    latency, holeStates, pressure, resonance, totalHolesClosed, sessionNoteCount,
    resetSession,
  } = useVisMuStore();

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const summary = getPerformanceSummary();

  const handleRecord = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vismu-recording-${Date.now()}.webm`;
        a.click();
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const handleSnapshot = () => {
    const video = document.querySelector('video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);
    ctx.restore();
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `vismu-snapshot-${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    audioEngine.playNote(null);
    resetSession();
    clearSessionMetrics();
    if (recording) { mediaRecorderRef.current?.stop(); setRecording(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6" style={{ paddingBottom: '2rem' }}>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6">

        {/* Video Feed */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden relative">
          <div className="absolute top-3 left-4 z-10 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${handTrackingActive ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold tracking-widest text-gray-300">
              {handTrackingActive ? 'TRACKING ACTIVE' : initialized ? 'NO HAND DETECTED' : 'WAITING...'}
            </span>
          </div>
          <div className="absolute top-3 right-4 z-10 text-right">
            <p className="text-[9px] text-gray-500 font-bold tracking-widest">CONFIDENCE</p>
            <p className="text-lg font-light text-white">{confidenceScore.toFixed(3)}</p>
          </div>
          <div className="aspect-video bg-neutral-900 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
            <WebcamView initialized={initialized} />
          </div>
          <div className="p-3 flex space-x-6">
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-0.5">LATENCY</p>
              <p className="text-xs text-white">{latency.toFixed(1)}ms</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-0.5">PRESSURE</p>
              <p className="text-xs text-white">{pressure}%</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-0.5">RESONANCE</p>
              <p className="text-xs text-white">{resonance}%</p>
            </div>
          </div>
        </div>

        {/* 3D Flute */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">3D Flute Model</p>
            <p className="text-[9px] text-gray-600">Drag to rotate</p>
          </div>
          <div className="h-48 sm:h-56">
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-5, -5, -5]} intensity={0.3} color="#00f2ff" />
              <Flute3D holeStates={holeStates} currentNote={currentPitch} />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Current Pitch */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">CURRENT PITCH</p>
            <h3 className="text-7xl font-thin text-white tracking-tighter">{currentPitch}</h3>
            <div className="w-full space-y-2 pt-2">
              <div className="flex justify-between text-[9px] text-gray-600 font-bold">
                <span>{frequency > 0 ? `${frequency}Hz` : '---'}</span>
                <span>FREQ</span>
              </div>
              <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-[#00f2ff] to-cyan-400"
                  animate={{ width: frequency > 0 ? '75%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col space-y-3">
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Session</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-gray-600 font-bold">NOTES PLAYED</p>
                <p className="text-sm text-white">{sessionNoteCount}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 font-bold">AVG LATENCY</p>
                <p className="text-sm text-white">{summary.avgLatency.toFixed(1)}ms</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 font-bold">AVG CONFIDENCE</p>
                <p className="text-sm text-white">{summary.avgConfidence.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 font-bold">TOTAL NOTES</p>
                <p className="text-sm text-white">{summary.totalNotes}</p>
              </div>
            </div>
          </div>

          {/* Finger Holes */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col space-y-4">
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Finger Configuration</p>
            <div className="flex justify-between items-center px-1">
              {holeStates.map((isActive, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'bg-[#00f2ff]/20 border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.4)]' : 'border-[#222]'
                  }`}>
                    {isActive && <div className="w-4 h-4 rounded-sm bg-[#00f2ff]" />}
                  </div>
                  <span className="text-[9px] text-gray-600 font-bold">H{idx + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#1a1a1a]">
              <span className="text-[10px] text-gray-500 font-bold">Holes Closed</span>
              <span className="bg-[#111] px-3 py-1 rounded text-xs font-mono text-[#00f2ff]">{totalHolesClosed} / 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex justify-center pt-2">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl px-6 sm:px-10 py-3 sm:py-4 flex items-center space-x-6 sm:space-x-10 shadow-2xl">
          <ControlButton icon={Disc} label="RECORD" active={recording} onClick={handleRecord} />
          <ControlButton icon={Camera} label="SNAPSHOT" onClick={handleSnapshot} />
          <ControlButton icon={RotateCcw} label="RESET" onClick={handleReset} />
          <div className="w-px h-8 bg-[#1a1a1a]" />
          <button onClick={handleReset} className="flex flex-col items-center group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-900 group-hover:text-white active:scale-95 transition-all">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[8px] font-black text-red-900 tracking-widest mt-1">PANIC</span>
          </button>
        </div>
      </div>

    </div>
  );
};

const ControlButton: React.FC<{ icon: any; label: string; active?: boolean; onClick?: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center group">
    <div className={`w-8 h-8 flex items-center justify-center transition-all ${active ? 'text-red-400' : 'text-gray-500 group-hover:text-[#00f2ff]'}`}>
      <Icon size={20} />
    </div>
    <span className={`text-[8px] font-bold tracking-widest mt-1 ${active ? 'text-red-400' : 'text-gray-600'}`}>{label}</span>
  </button>
);

export default Dashboard;
