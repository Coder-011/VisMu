import React from 'react';
import { useVisMuStore } from '../store/useVisMuStore';
import { 
  Circle, 
  Disc, 
  RotateCcw, 
  Camera, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import WebcamView from './WebcamView';

const Dashboard: React.FC = () => {
  const { 
    handTrackingActive, 
    confidenceScore, 
    currentPitch, 
    frequency,
    latency,
    holeStates,
    pressure,
    resonance,
    totalHolesClosed
  } = useVisMuStore();

  return (
    <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Video Feed */}
        <div className="col-span-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden relative group">
          <div className="absolute top-4 left-6 z-10 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${handTrackingActive ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold tracking-widest text-gray-300">HAND TRACKING ACTIVE</span>
          </div>
          
          <div className="absolute top-4 right-6 z-10 text-right">
            <p className="text-[9px] text-gray-500 font-bold tracking-widest">CONFIDENCE SCORE</p>
            <p className="text-xl font-light text-white">{confidenceScore.toFixed(3)}</p>
          </div>

          <div className="aspect-video bg-neutral-900 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
            <WebcamView />
            
            {/* Mock Landmarks on a Flute Image if we had one, for now just empty */}
          </div>

          <div className="absolute bottom-4 left-6 flex space-x-12">
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">INPUT DEVICE</p>
              <p className="text-xs text-white">Built-in 4K Wide Angle Cam</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">LATENCY</p>
              <p className="text-xs text-white">{latency.toFixed(1)}ms</p>
            </div>
          </div>
        </div>

        {/* Right Column: Pitch & Config */}
        <div className="col-span-4 flex flex-col space-y-6">
          {/* Current Pitch */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">CURRENT PITCH</p>
            <h3 className="text-8xl font-thin text-white tracking-tighter">{currentPitch}</h3>
            
            <div className="w-full space-y-2 pt-4">
              <div className="flex justify-between text-[9px] text-gray-600 font-bold">
                <span>440Hz</span>
                <span>TARGET: 442Hz</span>
                <span>+2 cents</span>
              </div>
              <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 via-[#00f2ff] to-cyan-400"
                  initial={{ width: '0%' }}
                  animate={{ width: '75%' }}
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 flex flex-col space-y-6">
            <div className="flex items-center space-x-2">
              <Settings2 size={14} className="text-gray-500" />
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Configuration</p>
            </div>

            <div className="flex justify-between items-center px-4">
              {holeStates.map((isActive, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#00f2ff]/20 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]' 
                      : 'border-[#222] bg-transparent'
                  }`}>
                    {isActive && <div className="w-4 h-4 rounded-sm bg-[#00f2ff]" />}
                  </div>
                  <span className="text-[9px] text-gray-600 font-bold">H{idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#1a1a1a]">
              <span className="text-[10px] text-gray-500 font-bold">Total Holes Closed</span>
              <span className="bg-[#111] px-3 py-1 rounded text-xs font-mono text-[#00f2ff]">{totalHolesClosed} / 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Flute Visualization */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 relative flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-8 absolute top-8 left-8 right-8">
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Pressure: {pressure}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Resonance: {resonance}%</span>
            </div>
          </div>
        </div>

        {/* Horizontal Flute Graphic */}
        <div className="relative w-full h-12 bg-gradient-to-b from-[#111] to-[#050505] rounded-full border border-[#222] flex items-center px-12 space-x-12 mt-12 shadow-inner">
          <div className="absolute -left-2 w-8 h-14 bg-[#111] border border-[#222] rounded-full" />
          
          {holeStates.map((isActive, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: -20 }}
                  className="absolute -top-12 bg-[#111] border border-[#333] px-2 py-0.5 rounded text-[8px] font-bold text-white tracking-widest uppercase"
                >
                  Active
                </motion.div>
              )}
              <div className={`w-8 h-6 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-cyan-400 shadow-[0_0_25px_rgba(0,242,255,0.6)]' 
                  : 'bg-black border border-[#333]'
              }`} />
            </div>
          ))}

          <div className="absolute right-8 bottom-0 transform translate-y-full pt-4 flex flex-col items-end">
             <p className="text-[9px] text-gray-600 font-bold tracking-widest">MODEL ENGINE</p>
             <p className="text-white text-lg font-light tracking-widest">[ V-WOOD-X1 ]</p>
          </div>
        </div>
      </div>

      {/* Control Bar at the very bottom center */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl px-8 py-4 flex items-center space-x-10 shadow-2xl z-50">
        <ControlButton icon={Disc} label="RECORD" />
        <ControlButton icon={Camera} label="SNAPSHOT" />
        <ControlButton icon={RotateCcw} label="RESET" />
        <div className="w-px h-8 bg-[#1a1a1a]" />
        <button className="flex flex-col items-center group">
          <div className="w-12 h-12 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-900 group-hover:text-white transition-all shadow-lg group-hover:shadow-red-900/40">
            <AlertTriangle size={24} />
          </div>
          <span className="text-[8px] font-black text-red-900 tracking-widest mt-2">PANIC</span>
        </button>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{ icon: any, label: string }> = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center group">
    <div className="w-8 h-8 flex items-center justify-center text-gray-500 group-hover:text-[#00f2ff] transition-all">
      <Icon size={20} />
    </div>
    <span className="text-[8px] font-bold text-gray-600 tracking-widest mt-1">{label}</span>
  </button>
);

const Settings2 = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
  </svg>
);

export default Dashboard;
