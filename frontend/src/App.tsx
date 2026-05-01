import React from 'react';
import Sidebar from './components/Sidebar';
import { RefreshCcw, Settings, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { audioEngine } from './systems/audioEngine';

const App: React.FC = () => {
  const [initialized, setInitialized] = React.useState(false);

  const startSystem = async () => {
    await audioEngine.initialize();
    setInitialized(true);
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00f2ff] selection:text-black">
      {!initialized && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md">
          <div className="text-center space-y-8 max-w-md p-12 border border-[#1a1a1a] rounded-3xl bg-[#0a0a0a] shadow-2xl">
             <h1 className="text-6xl font-black italic tracking-tighter text-[#00f2ff] mb-2">VisMu</h1>
             <p className="text-gray-500 text-sm tracking-widest font-bold">STUDIO EDITION V1.0</p>
             <button 
               onClick={startSystem}
               className="w-full py-4 bg-[#00f2ff] text-black rounded-xl font-black text-sm tracking-[0.2em] hover:bg-[#00d8e4] transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)]"
             >
               START ENGINE
             </button>
             <p className="text-[10px] text-gray-700 uppercase tracking-widest">Web Audio & Camera Permission Required</p>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-black italic tracking-tighter text-[#00f2ff]">VisMu</h1>
            <nav className="flex space-x-8">
              {['Studio', 'Library', 'Live', 'Nodes'].map((item) => (
                <button
                  key={item}
                  className={`text-[11px] font-bold tracking-widest uppercase pb-1 transition-all ${
                    item === 'Studio' ? 'text-white border-b-2 border-[#00f2ff]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-6 text-gray-500">
            <button className="hover:text-[#00f2ff] transition-colors"><RefreshCcw size={18} /></button>
            <button className="hover:text-[#00f2ff] transition-colors"><Settings size={18} /></button>
            <button className="hover:text-[#00f2ff] transition-colors"><User size={18} /></button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

export default App;
