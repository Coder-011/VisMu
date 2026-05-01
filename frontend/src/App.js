import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { RefreshCw, Settings, User, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { audioEngine } from './systems/audioEngine';
import { useVisMuStore } from './store/useVisMuStore';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: '' };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error: error.message };
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "flex items-center justify-center min-h-screen w-screen bg-[#050505] text-white p-4", children: _jsxs("div", { className: "text-center space-y-4 p-8 border border-red-900/50 rounded-2xl bg-[#0a0a0a] max-w-md w-full", children: [_jsx("h1", { className: "text-3xl font-black text-red-500", children: "Error" }), _jsx("p", { className: "text-gray-400 text-sm", children: this.state.error }), _jsx("button", { onClick: () => window.location.reload(), className: "px-6 py-2 bg-[#00f2ff] text-black rounded-lg font-bold text-sm", children: "Reload" })] }) }));
        }
        return this.props.children;
    }
}
const App = () => {
    const [initialized, setInitialized] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [activeTab, setActiveTab] = useState('Studio');
    const [showSettings, setShowSettings] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarActiveItem, setSidebarActiveItem] = useState('PERFORMANCE');
    const [showSidebarMessage, setShowSidebarMessage] = useState('');
    const { useBackendAPI, setBackendAPI, backendConnected, setBackendConnected } = useVisMuStore();
    const handleSidebarItemClick = (label) => {
        setSidebarActiveItem(label);
        setShowSidebarMessage(` ${label} functionality coming soon...`);
        setTimeout(() => setShowSidebarMessage(''), 3000);
    };
    const startSystem = async () => {
        try {
            await audioEngine.initialize();
        }
        catch (err) {
            console.warn('Audio init failed, continuing anyway:', err);
        }
        setInitialized(true);
    };
    return (_jsx(ErrorBoundary, { children: _jsxs("div", { className: "flex h-screen w-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00f2ff] selection:text-black", children: [!initialized && (_jsx("div", { className: "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md p-4", children: _jsxs("div", { className: "text-center space-y-8 w-full max-w-md p-8 sm:p-12 border border-[#1a1a1a] rounded-3xl bg-[#0a0a0a] shadow-2xl", children: [_jsx("h1", { className: "text-5xl sm:text-6xl font-black italic tracking-tighter text-[#00f2ff] mb-2", children: "VisMu" }), _jsx("p", { className: "text-gray-500 text-sm tracking-widest font-bold", children: "STUDIO EDITION V1.0" }), _jsx("button", { onClick: startSystem, className: "w-full py-4 bg-[#00f2ff] text-black rounded-xl font-black text-sm tracking-[0.2em] hover:bg-[#00d8e4] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)]", children: "START ENGINE" }), _jsx("p", { className: "text-[10px] text-gray-700 uppercase tracking-widest", children: "Web Audio & Camera Permission Required" })] }) })), sidebarOpen && (_jsx("div", { className: "fixed inset-0 z-40 bg-black/60 lg:hidden", onClick: () => setSidebarOpen(false) })), _jsx("div", { className: `fixed lg:relative z-50 lg:z-auto h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`, children: _jsx(Sidebar, { onClose: () => setSidebarOpen(false), activeItem: sidebarActiveItem, onItemClick: handleSidebarItemClick }) }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 w-full", children: [_jsxs("header", { className: "h-14 sm:h-16 border-b border-[#1a1a1a] flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a] shrink-0 relative", children: [_jsxs("div", { className: "flex items-center space-x-4 sm:space-x-12", children: [_jsx("button", { className: "lg:hidden text-gray-400 hover:text-white mr-2", onClick: () => setSidebarOpen(true), children: _jsx(Menu, { size: 20 }) }), _jsx("h1", { className: "text-xl sm:text-2xl font-black italic tracking-tighter text-[#00f2ff]", children: "VisMu" }), _jsx("nav", { className: "hidden sm:flex space-x-6 sm:space-x-8", children: ['Studio', 'Library', 'Live', 'Nodes'].map((item) => (_jsx("button", { onClick: () => setActiveTab(item), className: `text-[11px] font-bold tracking-widest uppercase pb-1 transition-all ${item === activeTab
                                                    ? 'text-white border-b-2 border-[#00f2ff]'
                                                    : 'text-gray-500 hover:text-gray-300'}`, children: item }, item))) })] }), _jsxs("div", { className: "flex items-center space-x-4 sm:space-x-6 text-gray-500", children: [_jsx("button", { className: "hover:text-[#00f2ff] transition-colors", onClick: () => window.location.reload(), children: _jsx(RefreshCw, { size: 18 }) }), _jsxs("button", { className: "hover:text-[#00f2ff] transition-colors relative", onClick: () => {
                                                setShowSettings(!showSettings);
                                                setShowUserMenu(false);
                                            }, children: [_jsx(Settings, { size: 18 }), showSettings && (_jsxs("div", { className: "absolute top-12 right-0 w-64 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-2xl z-50", children: [_jsx("h3", { className: "text-xs font-bold text-white mb-3", children: "Settings" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-gray-400", children: "Audio Enabled" }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "toggle toggle-xs" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-gray-400", children: "Hand Tracking" }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "toggle toggle-xs" })] }), _jsxs("div", { className: "pt-2 border-t border-[#1a1a1a]", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-[10px] text-gray-400", children: "Use Backend API" }), _jsx("button", { onClick: () => {
                                                                                        const newValue = !useBackendAPI;
                                                                                        setBackendAPI(newValue);
                                                                                        if (!newValue)
                                                                                            setBackendConnected(false);
                                                                                    }, className: `w-10 h-5 rounded-full transition-colors ${useBackendAPI ? 'bg-[#00f2ff]' : 'bg-gray-600'}`, children: _jsx("div", { className: `w-4 h-4 rounded-full bg-white transform transition-transform ${useBackendAPI ? 'translate-x-5' : 'translate-x-0.5'}` }) })] }), useBackendAPI && (_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-[9px] text-gray-400", children: backendConnected ? 'Connected to backend' : 'Backend offline' })] })), _jsx("button", { className: "text-[10px] text-[#00f2ff] hover:underline", children: "Reset All Settings" })] })] })] }))] }), _jsxs("button", { className: "hover:text-[#00f2ff] transition-colors relative", onClick: () => {
                                                setShowUserMenu(!showUserMenu);
                                                setShowSettings(false);
                                            }, children: [_jsx(User, { size: 18 }), showUserMenu && (_jsx("div", { className: "absolute top-12 right-0 w-48 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-2xl z-50", children: _jsxs("div", { className: "space-y-2", children: [_jsx("button", { className: "block w-full text-left text-[10px] text-gray-300 hover:text-white py-1", children: "Profile" }), _jsx("button", { className: "block w-full text-left text-[10px] text-gray-300 hover:text-white py-1", children: "History" }), _jsx("button", { className: "block w-full text-left text-[10px] text-gray-300 hover:text-white py-1", children: "Sign Out" })] }) }))] })] })] }), _jsxs("main", { className: "flex-1 overflow-auto relative", children: [activeTab === 'Studio' && _jsx(Dashboard, { initialized: initialized }), activeTab === 'Library' && (_jsx("div", { className: "p-8 text-center text-gray-500 text-sm", children: "Library content coming soon..." })), activeTab === 'Live' && (_jsx("div", { className: "p-8 text-center text-gray-500 text-sm", children: "Live performance mode coming soon..." })), activeTab === 'Nodes' && (_jsx("div", { className: "p-8 text-center text-gray-500 text-sm", children: "Node editor coming soon..." })), showSidebarMessage && (_jsx("div", { className: "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#00f2ff] text-black px-4 py-2 rounded-lg text-xs font-bold z-50 shadow-lg", children: showSidebarMessage }))] })] })] }) }));
};
export default App;
//# sourceMappingURL=App.js.map