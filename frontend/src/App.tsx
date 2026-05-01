import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { RefreshCw, Settings, User, Menu } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { audioEngine } from './systems/audioEngine';
import { useVisMuStore } from './store/useVisMuStore';

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
        <div className="flex items-center justify-center min-h-screen w-screen bg-[#050505] text-white p-4">
          <div className="text-center space-y-4 p-8 border border-red-900/50 rounded-2xl bg-[#0a0a0a] max-w-md w-full">
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = useState('Studio');
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('PERFORMANCE');
  const [showSidebarMessage, setShowSidebarMessage] = useState('');
  
  const { useBackendAPI, setUseBackendAPI, backendConnected, setBackendConnected } = useVisMuStore();

  const handleSidebarItemClick = (label: string) => {
    setSidebarActiveItem(label);
    setShowSidebarMessage(` ${label} functionality coming soon...`);
    setTimeout(() => setShowSidebarMessage(''), 3000);
  };

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
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md p-4">
            <div className="text-center space-y-8 w-full max-w-md p-8 sm:p-12 border border-[#1a1a1a] rounded-3xl bg-[#0a0a0a] shadow-2xl">
              <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter text-[#00f2ff] mb-2">
                VisMu
              </h1>
              <p className="text-gray-500 text-sm tracking-widest font-bold">
                STUDIO EDITION V1.0
              </p>
              <button
                onClick={startSystem}
                className="w-full py-4 bg-[#00f2ff] text-black rounded-xl font-black text-sm tracking-[0.2em] hover:bg-[#00d8e4] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)]"
              >
                START ENGINE
              </button>
              <p className="text-[10px] text-gray-700 uppercase tracking-widest">
                Web Audio & Camera Permission Required
              </p>
            </div>
          </div>
        )}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:relative z-50 lg:z-auto h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar 
            onClose={() => setSidebarOpen(false)} 
            activeItem={sidebarActiveItem}
            onItemClick={handleSidebarItemClick}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b border-[#1a1a1a] flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a] shrink-0 relative">
            <div className="flex items-center space-x-4 sm:space-x-12">
              <button
                className="lg:hidden text-gray-400 hover:text-white mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-[#00f2ff]">
                VisMu
              </h1>
              <nav className="hidden sm:flex space-x-6 sm:space-x-8">
                {['Studio', 'Library', 'Live', 'Nodes'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveTab(item)}
                    className={`text-[11px] font-bold tracking-widest uppercase pb-1 transition-all ${
                      item === activeTab
                        ? 'text-white border-b-2 border-[#00f2ff]'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6 text-gray-500">
              <button className="hover:text-[#00f2ff] transition-colors" onClick={() => window.location.reload()}>
                <RefreshCw size={18} />
              </button>
              <button className="hover:text-[#00f2ff] transition-colors relative" onClick={() => {
                setShowSettings(!showSettings);
                setShowUserMenu(false);
              }}>
                <Settings size={18} />
                {showSettings && (
                  <div className="absolute top-12 right-0 w-64 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-2xl z-50">
                    <h3 className="text-xs font-bold text-white mb-3">Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Audio Enabled</span>
                        <input type="checkbox" defaultChecked className="toggle toggle-xs" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Hand Tracking</span>
                        <input type="checkbox" defaultChecked className="toggle toggle-xs" />
                      </div>
                      <div className="pt-2 border-t border-[#1a1a1a]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-gray-400">Use Backend API</span>
                          <button
                            onClick={() => {
                              const newValue = !useBackendAPI;
                              setUseBackendAPI(newValue);
                              if (!newValue) setBackendConnected(false);
                            }}
                            className={`w-10 h-5 rounded-full transition-colors ${useBackendAPI ? 'bg-[#00f2ff]' : 'bg-gray-600'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${useBackendAPI ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        {useBackendAPI && (
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[9px] text-gray-400">
                              {backendConnected ? 'Connected to backend' : 'Backend offline'}
                            </span>
                          </div>
                        )}
                        <button className="text-[10px] text-[#00f2ff] hover:underline">Reset All Settings</button>
                      </div>
                    </div>
                  </div>
                )}
              </button>
              <button className="hover:text-[#00f2ff] transition-colors relative" onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowSettings(false);
              }}>
                <User size={18} />
                {showUserMenu && (
                  <div className="absolute top-12 right-0 w-48 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-2xl z-50">
                    <div className="space-y-2">
                      <button className="block w-full text-left text-[10px] text-gray-300 hover:text-white py-1">Profile</button>
                      <button className="block w-full text-left text-[10px] text-gray-300 hover:text-white py-1">History</button>
                      <button className="block w-full text-left text-[10px] text-gray-300 hover:text-white py-1">Sign Out</button>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto relative">
            {activeTab === 'Studio' && <Dashboard initialized={initialized} />}
            {activeTab === 'Library' && (
              <div className="p-8 text-center text-gray-500 text-sm">Library content coming soon...</div>
            )}
            {activeTab === 'Live' && (
              <div className="p-8 text-center text-gray-500 text-sm">Live performance mode coming soon...</div>
            )}
            {activeTab === 'Nodes' && (
              <div className="p-8 text-center text-gray-500 text-sm">Node editor coming soon...</div>
            )}
            
            {/* Sidebar action feedback message */}
            {showSidebarMessage && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#00f2ff] text-black px-4 py-2 rounded-lg text-xs font-bold z-50 shadow-lg">
                {showSidebarMessage}
              </div>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;