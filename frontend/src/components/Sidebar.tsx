import React from 'react';
import {
  BarChart3,
  Music,
  Eye,
  Speaker,
  Settings2,
  HelpCircle,
  Terminal,
  Unplug,
  X,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const menuItems = [
    { icon: BarChart3, label: 'PERFORMANCE', active: true },
    { icon: Music, label: 'NOTE MAPPING', active: false },
    { icon: Eye, label: 'VISUALIZER', active: false },
    { icon: Speaker, label: 'AUDIO IO', active: false },
    { icon: Unplug, label: 'MIDI', active: false },
  ];

  return (
    <div className="w-64 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col p-6">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h2 className="text-[#00f2ff] text-xl font-bold tracking-wider mb-1">Control Deck</h2>
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
            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
              item.active
                ? 'bg-[#111] text-[#00f2ff] border-r-2 border-[#00f2ff]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <item.icon size={18} />
            <span className="text-[11px] font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-6">
        <button className="w-full py-3 bg-[#00f2ff] text-black rounded font-bold text-[11px] tracking-widest flex items-center justify-center space-x-2 hover:bg-[#00d8e4] active:scale-95 transition-all">
          <Settings2 size={16} />
          <span>CALIBRATE SENSOR</span>
        </button>

        <div className="space-y-4 border-t border-[#1a1a1a] pt-6">
          <button className="flex items-center space-x-3 text-gray-600 hover:text-gray-400 transition-colors">
            <HelpCircle size={16} />
            <span className="text-[10px] font-bold tracking-widest">SUPPORT</span>
          </button>
          <button className="flex items-center space-x-3 text-gray-600 hover:text-gray-400 transition-colors">
            <Terminal size={16} />
            <span className="text-[10px] font-bold tracking-widest">LOGS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
