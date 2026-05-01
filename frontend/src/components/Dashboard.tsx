import React, { useState } from 'react';
import { useVisMuStore } from '../store/useVisMuStore';
import { Disc, RotateCcw, Camera, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import WebcamView from './WebcamView';
import { audioEngine } from '../systems/audioEngine';

interface DashboardProps {
  initialized: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ initialized }) => {
  const {
    handTrackingActive,
    confidenceScore,
    currentPitch,
    frequency,
    latency,
    holeStates,
    pressure,
    resonance,
    totalHolesClosed,
    setPitchData,
    setHandTrackingActive,
    setConfidenceScore,
    setHoleStates,
    setMetrics,
  } = useVisMuStore();

  const [recording, setRecording] = useState(false);

  const handleRecord = () => setRecording((r) => !r);

  const handleSnapshot = () => {
    const video = document.querySelector('video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `vismu-snapshot-${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    audioEngine.playNote(null);
    setPitchData('--', 0);
    setHandTrackingActive(false);
    setConfidenceScore(0);
    setHoleStates([false, false, false, false, false, false]);
    setMetrics(0, 0);
    setRecording(false);
  };

  const handlePanic = () => {
    audioEngine.playNote(null);
    setPitchData('--', 0);
    setHandTrackingActive(false);
    setConfidenceScore(0);
    setHoleStates([false, false, false, false, false, false]);
    setMetrics(0, 0);
    setRecording(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col space-y-4 sm:space-y-6 pb-32 sm:pb-36">
      {/* Main grid: stacked on mobile, side-by-side on lg */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden relative">
          <div className="absolute top-3 left-4 z-10 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${handTrackingActive ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold tracking-widest text-gray-300">
              {handTrackingActive ? 'TRACKING ACTIVE' : 'NO HAND DETECTED'}
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

          <div className="absolute bottom-3 left-4 flex space-x-6 sm:space-x-12">
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-0.5">INPUT DEVICE</p>
              <p className="text-xs text-white">Webcam</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-0.5">LATENCY</p>
              <p className="text-xs text-white">{latency.toFixed(1)}ms</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col space-y-4 sm:space-y-6">
          {/* Current Pitch */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center space-y-4">
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">CURRENT PITCH</p>
            <h3 className="text-6xl sm:text-8xl font-thin text-white tracking-tighter">{currentPitch}</h3>

            <div className="w-full space-y-2 pt-4">
              <div className="flex justify-between text-[9px] text-gray-600 font-bold">
                <span>{frequency > 0 ? `${frequency}Hz` : '---'}</span>
                <span>TARGET</span>
                <span>{frequency > 0 ? `${frequency + 2}Hz` : '---'}</span>
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

          {/* Hole States */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 sm:p-6 flex flex-col space-y-5">
            <div className="flex items-center space-x-2">
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Finger Configuration</p>
            </div>

            <div className="flex justify-between items-center px-2">
              {holeStates.map((isActive, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-[#00f2ff]/20 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                      : 'border-[#222] bg-transparent'
                  }`}>
                    {isActive && <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-[#00f2ff]" />}
                  </div>
                  <span className="text-[9px] text-gray-600 font-bold">H{idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#1a1a1a]">
              <span className="text-[10px] text-gray-500 font-bold">Holes Closed</span>
              <span className="bg-[#111] px-3 py-1 rounded text-xs font-mono text-[#00f2ff]">{totalHolesClosed} / 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flute Visualization */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 sm:p-8">
        <div className="flex space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Pressure: {pressure}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Resonance: {resonance}%</span>
          </div>
        </div>

        <div className="relative w-full h-10 sm:h-12 bg-gradient-to-b from-[#111] to-[#050505] rounded-full border border-[#222] flex items-center px-8 sm:px-12 justify-around shadow-inner">
          <div className="absolute -left-2 w-6 sm:w-8 h-12 sm:h-14 bg-[#111] border border-[#222] rounded-full" />
          {holeStates.map((isActive, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: -20 }}
                  className="absolute -top-10 bg-[#111] border border-[#333] px-1.5 py-0.5 rounded text-[8px] font-bold text-white tracking-widest uppercase"
                >
                  ON
                </motion.div>
              )}
              <div className={`w-6 h-5 sm:w-8 sm:h-6 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-400 shadow-[0_0_25px_rgba(0,242,255,0.6)]'
                  : 'bg-black border border-[#333]'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl px-5 sm:px-8 py-3 sm:py-4 flex items-center space-x-6 sm:space-x-10 shadow-2xl z-50">
        <ControlButton
          icon={Disc}
          label="RECORD"
          active={recording}
          onClick={handleRecord}
        />
        <ControlButton
          icon={Camera}
          label="SNAPSHOT"
          onClick={handleSnapshot}
        />
        <ControlButton
          icon={RotateCcw}
          label="RESET"
          onClick={handleReset}
        />
        <div className="w-px h-8 bg-[#1a1a1a]" />
        <button
          onClick={handlePanic}
          className="flex flex-col items-center group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-900 group-hover:text-white active:scale-95 transition-all shadow-lg group-hover:shadow-red-900/40">
            <AlertTriangle size={20} />
          </div>
          <span className="text-[8px] font-black text-red-900 tracking-widest mt-1 sm:mt-2">PANIC</span>
        </button>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center group">
    <div className={`w-8 h-8 flex items-center justify-center transition-all ${
      active ? 'text-red-400' : 'text-gray-500 group-hover:text-[#00f2ff]'
    }`}>
      <Icon size={20} />
    </div>
    <span className={`text-[8px] font-bold tracking-widest mt-1 ${active ? 'text-red-400' : 'text-gray-600'}`}>
      {label}
    </span>
  </button>
);

export default Dashboard;
