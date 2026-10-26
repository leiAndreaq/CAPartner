import { useState } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Overview from './components/Overview';
import Monitoring from './components/Monitoring';
import Camera from './components/Camera';
import ActivityLog from './components/ActivityLog';
import Alerts from './components/Alerts';
import Settings from './components/Settings'; // Add this import

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Overview');
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState(1);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Helper function to handle logout globally
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('Overview'); // Reset page for next login
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        alertBadgeCount={unacknowledgedAlerts}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar activePage={activePage} onLogout={handleLogout} />
        <div className="flex-1 overflow-hidden relative">
          {activePage === 'Overview' && <Overview />}
          {activePage === 'Monitoring' && <Monitoring />}
          {activePage === 'Camera' && <Camera />}
          {activePage === 'Activity Log' && <ActivityLog />}
          {activePage === 'Alerts' && (
            <Alerts onUnacknowledgedCountChange={setUnacknowledgedAlerts} />
          )}
          {/* Add the Settings page here and pass the logout handler */}
          {activePage === 'Settings' && <Settings onLogout={handleLogout} />} 
        </div>
      </div>
    </div>
  );
}

export default App;