import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Overview from './components/Overview';
import Monitoring from './components/Monitoring';
import Camera from './components/Camera';
import ActivityLog from './components/ActivityLog';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import AdminSettings from './components/AdminSettings';
import { AlertTriangle, VideoOff, BatteryWarning, Radio, X } from 'lucide-react';

function App() {
  // ==========================================================
  // 1. STATE MANAGEMENT (Navigation, Auth, & Layout Controls)
  // ==========================================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [activePage, setActivePage] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Shared Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Alex Mendoza',
    username: 'alex.admin',
    email: 'alex.mendoza@capartner.sys',
    role: 'System Administrator',
    avatar: null
  });

  // Dual SOS Alert States: Full-Screen Blurred Modal & Floating Banner
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [showSosBanner, setShowSosBanner] = useState(false);

  // Trigger para sa Critical Emergency Alerts: Lilitaw 5 seconds pagka-login
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setShowCriticalModal(true);
        setShowSosBanner(true);
      }, 5000); // 5 seconds delay
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // ==========================================================
  // 2. GLOBAL MOCK DATA (Alerts & System Incidents)
  // ==========================================================
  const [alerts, setAlerts] = useState([
    {
      id: 1, 
      type: 'SOS Signal', 
      target: 'CAP-01 — Ramon Dizon', 
      desc: 'Auto-detected — abnormal heart rate (132 bpm) + irregular motion pattern',
      time: 'Today, 05:46 PM', 
      severity: 'CRITICAL', 
      status: 'Unacknowledged', 
      category: 'SOS', 
      icon: AlertTriangle
    },
    {
      id: 2, 
      type: 'SOS Signal', 
      target: 'Miguel Reyes · ENF-2401', 
      desc: 'Manual SOS signal initiated from wearable device.',
      time: 'Today, 10:46 AM', 
      severity: 'CRITICAL', 
      status: 'Unacknowledged', 
      category: 'SOS', 
      icon: AlertTriangle
    },
    {
      id: 3, 
      type: 'Abnormal Heart Rate', 
      target: 'Andrea Dela Cruz · ENF-2402', 
      desc: 'Configured heart-rate warning threshold exceeded at 104 BPM.',
      time: 'Today, 10:14 AM', 
      severity: 'WARNING', 
      status: 'Unacknowledged', 
      category: 'Health', 
      icon: AlertTriangle
    },
    {
      id: 4, 
      type: 'Camera Offline', 
      target: 'Camera 3 · South Highway', 
      desc: 'Camera stream and heartbeat are unavailable.',
      time: 'Today, 9:56 AM', 
      severity: 'CRITICAL', 
      status: 'Unacknowledged', 
      category: 'Device', 
      icon: VideoOff
    },
    {
      id: 5, 
      type: 'Low Battery', 
      target: 'Jose Santos · ENF-2403', 
      desc: 'Device battery reached 18 percent.',
      time: 'Today, 9:42 AM', 
      severity: 'WARNING', 
      status: 'Resolved', 
      category: 'Device', 
      icon: BatteryWarning
    },
    {
      id: 6, 
      type: 'LoRa Connection Lost', 
      target: 'Miguel Reyes · ENF-2401', 
      desc: 'LoRa fallback connection was temporarily unavailable.',
      time: 'Yesterday, 4:31 PM', 
      severity: 'INFO', 
      status: 'Resolved', 
      category: 'Connection', 
      icon: Radio
    },
  ]);

  const unacknowledgedCount = alerts.filter(a => a.status === 'Unacknowledged').length;

  // ==========================================================
  // 3. EVENT HANDLERS
  // ==========================================================
  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a));
  };

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  const handleClearAll = () => {
    setAlerts([]);
  };

  const handleNavigation = (page, alertId = null) => {
    setActivePage(page);
    setSelectedAlertId(alertId || null);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('Overview');
    setSelectedAlertId(null);
    setIsSidebarOpen(false);
    setShowCriticalModal(false);
    setShowSosBanner(false);
  };

  // ==========================================================
  // 4. CONDITIONAL RENDERING (Splash & Auth Screens)
  // ==========================================================
  if (isSplashVisible) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} duration={1800} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // ==========================================================
  // 5. MAIN DASHBOARD RENDER INTERFACE
  // ==========================================================
  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-white font-sans">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close mobile navigation"
          className="fixed inset-0 z-40 bg-slate-900/55 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigation}
          alertBadgeCount={unacknowledgedCount > 0 ? unacknowledgedCount : null}
          onClose={() => setIsSidebarOpen(false)}
          adminProfile={adminProfile}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Workspace Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          activePage={activePage}
          notifications={alerts}
          onNavigate={handleNavigation}
          onClearAll={handleClearAll}
          onLogout={handleLogout}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          adminProfile={adminProfile}
        />
        
        {/* Active Page View Switcher */}
        <div className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[#F8FAF9]">
          {activePage === 'Overview' && <Overview />}
          {activePage === 'Monitoring' && <Monitoring />}
          {activePage === 'Camera' && <Camera />}
          {activePage === 'Activity Log' && <ActivityLog />}
          {activePage === 'Alerts' && (
            <Alerts 
              alerts={alerts}
              selectedAlertId={selectedAlertId}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onClearAll={handleClearAll}
            />
          )}
          {activePage === 'Personnel Accounts' && <Settings onLogout={handleLogout} />}
          {activePage === 'Admin Account Settings' && (
            <AdminSettings adminProfile={adminProfile} setAdminProfile={setAdminProfile} />
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. FULL-SCREEN BLURRED CRITICAL EMERGENCY MODAL           */}
      {/* ========================================================== */}
      {showCriticalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-red-500 overflow-hidden text-center animate-in zoom-in-95 duration-200">
            
            {/* Top Critical Header */}
            <div className="bg-red-600 px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider">CRITICAL EMERGENCY ALERT</span>
              </div>
              <span className="text-[10px] font-bold text-white/90">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-1">
                CAP-01 — Ramon Dizon
              </h3>
              
              <p className="text-xs text-gray-600 mb-6 bg-red-50 border border-red-100 p-3 rounded-2xl leading-relaxed font-medium">
                Auto-detected emergency: abnormal heart rate (132 bpm) + irregular motion pattern detected in real-time.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCriticalModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCriticalModal(false);
                    setShowSosBanner(false);
                    handleNavigation('Alerts', 1);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  View in Alerts
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. FLOATING SOS NOTIFICATION BANNER (TOP RIGHT)            */}
      {/* ========================================================== */}
      {showSosBanner && !showCriticalModal && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 z-[120] sm:max-w-[420px] rounded-2xl shadow-2xl border-2 border-red-500 bg-white animate-in slide-in-from-top-5 duration-300 overflow-hidden">
          
          <div className="bg-[#d93636] px-3.5 sm:px-4 py-2 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em]">ACTIVE SOS — CRITICAL NOTIFICATION</span>
            </div>
            
            <button
              type="button"
              onClick={() => setShowSosBanner(false)}
              className="text-white/80 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 sm:p-4 bg-white text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-black tracking-tight text-[#d93636] truncate">
                CAP-01 — Ramon Dizon
              </h4>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5 leading-snug">
                Auto-detected — abnormal heart rate (132 bpm) + irregular motion pattern
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSosBanner(false);
                handleNavigation('Alerts', 1);
              }}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-[#d93636] hover:bg-red-700 px-4 py-2 text-xs font-extrabold text-white transition shadow-md shadow-red-600/30 cursor-pointer text-center"
            >
              View in Alerts
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;