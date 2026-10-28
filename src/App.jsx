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

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Overview');
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState(1);
  
  // Track which enforcer to view in the Monitoring tab
  const [targetEnforcerId, setTargetEnforcerId] = useState(null);

  // Global state for the administrator profile
  const [adminProfile, setAdminProfile] = useState({
    fullName: 'Alex Mendoza',
    role: 'System Administrator',
    username: 'alex.admin',
    email: 'alex.mendoza@capartner.sys'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('Overview');
  };

  const handleViewEnforcer = (id) => {
    setTargetEnforcerId(id);
    setActivePage('Monitoring');
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        alertBadgeCount={unacknowledgedAlerts}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Navbar now receives unacknowledgedAlerts so the bell badge stays in sync */}
        <Navbar 
          activePage={activePage} 
          onLogout={handleLogout} 
          onNavigate={setActivePage}
          alertCount={unacknowledgedAlerts}
          userProfile={adminProfile}
        />
        
        <div className="flex-1 overflow-hidden relative">
          
          {activePage === 'Overview' && (
            <Overview onViewEnforcer={handleViewEnforcer} />
          )}

          {activePage === 'Monitoring' && (
            <Monitoring 
              targetId={targetEnforcerId} 
              onResetTarget={() => setTargetEnforcerId(null)} 
            />
          )}
          
          {activePage === 'Camera' && <Camera />}
          
          {activePage === 'Activity Log' && <ActivityLog />}
          
          {activePage === 'Alerts' && (
            <Alerts onUnacknowledgedCountChange={setUnacknowledgedAlerts} />
          )}
          
          {activePage === 'Settings' && (
            <Settings 
              onLogout={handleLogout} 
              userProfile={adminProfile}
              onUpdateProfile={setAdminProfile}
            />
          )} 
          
        </div>
      </div>
    </div>
  );
}

export default App;