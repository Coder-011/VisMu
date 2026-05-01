import React from 'react';
import Sidebar from './components/Sidebar';
import { RefreshCcw, Settings, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { audioEngine } from './systems/audioEngine';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-[#050505] text-white">
          <div className="text-center space-y-4 p-12 border border-red-900/50 rounded-2xl bg-[#0a0a0a] max-w-md">
            <h1 className="text-3xl font-black text-red-500">Error</h1>
            <p className="text-gray-400 text-sm">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#00f2ff] text-black rounded-lg font-bold text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [initialized, setInitialized] = React.useState(false);

  const startSystem = async () => {
    try {
      await audioEngine.initialize();
    } catch (err) {
      console.warn('Audio init failed, continuing anyway:', err);
    }
    setInitialized(true);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00f2ff] selection:text-black">
        {!initialized && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md">
            <div className="text-center space-y-8 max-w-md p-12 border border-[#1a1a1a] rounded-3xl bg-[#0a0a0a] shadow-2xl">
              <h1 className="text-6xl font-black italic tracking-tighter text-[#00f2ff] mb-2">
                VisMu
              </h1>
              <p className="text-gray-500 text-sm tracking-widest font-bold">
                STUDIO EDITION V1.0
              </p>
              <button
                onClick={startSystem}
                className="w-full py-4 bg-[#00f2ff] text-black rounded-xl font-black text-sm tracking-[0.2em] hover:bg-[#00d8e4] transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)]"
              >
                START ENGINE
              </button>
              <p className="text-[10px] text-gray-700 uppercase tracking-widest">
                Web Audio &amp; Camera Permission Required
              </p>
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
              <h1 className="text-2xl font-black italic tracking-tighter text-[#00f2ff]">
                VisMu
              </h1>
              <nav className="flex space-x-8">
                {['Studio', 'Library', 'Live', 'Nodes'].map((item) => (
                  <button
                    key={item}
                    className={`text-[11px] font-bold tracking-widest uppercase pb-1 transition-all ${
                      item === 'Studio'
                        ? 'text-white border-b-2 border-[#00f2ff]'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-6 text-gray-500">
              <button className="hover:text-[#00f2ff] transition-colors">
                <RefreshCcw size={18} />
              </button>
              <button className="hover:text-[#00f2ff] transition-colors">
                <Settings size={18} />
              </button>
              <button className="hover:text-[#00f2ff] transition-colors">
                <User size={18} />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            <Dashboard />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
