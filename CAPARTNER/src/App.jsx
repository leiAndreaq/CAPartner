import { useState } from 'react';
import './index.css';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import TwoFactorPage from './pages/TwoFactorPage';
import OverviewPage from './pages/OverviewPage';
import MonitoringPage from './pages/MonitoringPage';
import CameraPage from './pages/CameraPage';
import SettingsPage from './pages/SettingsPage';
import ActivityPage from './pages/ActivityPage';

export default function App() {
  const [currentStep, setCurrentStep] = useState('splash');

  // HANDLE TAB NAVIGATION BETWEEN DASHBOARD PAGES
  const handleTabChange = (tabName) => {
    if (tabName === 'Overview') setCurrentStep('overview');
    if (tabName === 'Monitoring') setCurrentStep('monitoring');
    if (tabName === 'Camera') setCurrentStep('camera');
    if (tabName === 'Activity Log') setCurrentStep('activityLog');
    if (tabName === 'Settings') setCurrentStep('settings');
  };

  if (currentStep === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setCurrentStep('login')}
        duration={1500}
      />
    );
  }

  if (currentStep === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => setCurrentStep('twoFactor')}
      />
    );
  }

  if (currentStep === 'twoFactor') {
    return (
      <TwoFactorPage
        onVerifySuccess={() => setCurrentStep('overview')}
        onBackToLogin={() => setCurrentStep('login')} 
      />
    );
  }

  if (currentStep === 'overview') {
    return (
      <OverviewPage
        onTabChange={handleTabChange}
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  if (currentStep === 'monitoring') {
    return (
      <MonitoringPage
        onTabChange={handleTabChange}
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  if (currentStep === 'camera') {
    return (
      <CameraPage
        onTabChange={handleTabChange}
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  if (currentStep === 'activityLog') {
    return (
      <ActivityPage
        onTabChange={handleTabChange}
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  if (currentStep === 'settings') {
    return (
      <SettingsPage
        onTabChange={handleTabChange}
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  return null;
}