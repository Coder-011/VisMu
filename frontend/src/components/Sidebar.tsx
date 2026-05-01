import React from 'react';
import { BarChart3, Music, Eye, Speaker, Settings2, HelpCircle, Terminal, Unplug, X } from 'lucide-react';
import { useVisMuStore } from '../store/useVisMuStore';

interface SidebarProps {
  onClose?: () => void;
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, activeItem = 'PERFORMANCE', onItemClick }) => {
  const { confidenceScore, latency } = useVisMuStore();

  const menuItems = [
    { icon: BarChart3, label: 'PERFORMANCE' },
    { icon: Music, label: 'NOTE MAPPING' },
    { icon: Eye, label: 'VISUALIZER' },
    { icon: Speaker, label: 'AUDIO IO' },
    { icon: Unplug, label: 'MIDI' },
  ];

  return (
    <div className="w-64 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col p-6">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h2 className="text-[#00f2ff] text-xl font-bold tracking-wider mb-1">
            <span className="font-black italic">VisMu</span> Control Deck
          </h2>
          <p className="text-gray-500 text-xs tracking-widest">Active Sync: 120 BPM</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white mt-1">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onItemClick?.(item.label)}
            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeItem === item.label
                ? 'bg-[#111] text-[#00f2ff] border-r-2 border-[#00f2ff]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <item.icon size={18} />
            <span className="text-[11px] font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Real-Time Metrics */}
      <div className="mt-6 p-4 bg-[#111] rounded-lg border border-[#1a1a1a]">
        <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-3">REAL-TIME METRICS</p>
        <div className="space-y-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-400">CONFIDENCE</span>
            <span className={`font-mono ${confidenceScore >= 0.9 ? 'text-[#00f2ff]' : 'text-white'}`}>
              {confidenceScore.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-400">LATENCY</span>
            <span className={`font-mono ${latency <= 10 ? 'text-[#00f2ff]' : 'text-yellow-400'}`}>
              {latency.toFixed(1)}ms
            </span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-400">ENGINE</span>
            <span className="font-mono text-[#00f2ff]">CLIENT</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <button
          onClick={() => onItemClick?.('CALIBRATE')}
          className="w-full py-3 bg-[#00f2ff] text-black rounded font-bold text-[11px] tracking-widest flex items-center justify-center space-x-2 hover:bg-[#00d8e4] active:scale-95 transition-all"
        >
          <Settings2 size={16} />
          <span>CALIBRATE SENSOR</span>
        </button>

        <div className="space-y-4 border-t border-[#1a1a1a] pt-6">
          <button onClick={() => onItemClick?.('SUPPORT')} className="flex items-center space-x-3 text-gray-600 hover:text-gray-400 transition-colors">
            <HelpCircle size={16} />
            <span className="text-[10px] font-bold tracking-widest">SUPPORT</span>
          </button>
          <button onClick={() => onItemClick?.('LOGS')} className="flex items-center space-x-3 text-gray-600 hover:text-gray-400 transition-colors">
            <Terminal size={16} />
            <span className="text-[10px] font-bold tracking-widest">LOGS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
