import { useState, useEffect } from 'react';
import './index.css';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import TwoFactorPage from './pages/TwoFactorPage';
import OverviewPage from './pages/OverviewPage';
import MonitoringPage from './pages/MonitoringPage';
import CameraPage from './pages/CameraPage';
import SettingsPage from './pages/SettingsPage';
import ActivityPage from './pages/ActivityPage';
import { saveSession, loadSession, clearSession } from './api';

export default function App() {
  const [currentStep, setCurrentStep] = useState('splash');
  // pending = password was right, waiting for the email code
  const [pending, setPending] = useState(null);
  // session = fully logged in (login pass + when it ends)
  const [session, setSession] = useState(loadSession);
  const [loginNotice, setLoginNotice] = useState('');

  // LOG OUT: FORGET THE LOGIN PASS AND GO BACK TO THE LOGIN PAGE
  const logout = (notice = '') => {
    clearSession();
    setSession(null);
    setPending(null);
    setLoginNotice(notice);
    setCurrentStep('login');
  };

  // AUTO SIGN-OUT WHEN THE LOGIN PASS ENDS (auto_signout_minutes IN THE BACKEND SETTINGS)
  useEffect(() => {
    if (!session) return undefined;
    const timer = setTimeout(
      () => logout('You were signed out automatically. Please log in again.'),
      Math.max(session.expiresAt - Date.now(), 0)
    );
    return () => clearTimeout(timer);
  }, [session]);

  // HANDLE TAB NAVIGATION BETWEEN DASHBOARD PAGES
  const handleTabChange = (tabName) => {
    if (tabName === 'Overview') setCurrentStep('overview');
    if (tabName === 'Monitoring') setCurrentStep('monitoring');
    if (tabName === 'Camera') setCurrentStep('camera');
    if (tabName === 'Activity Log') setCurrentStep('activityLog');
    if (tabName === 'Settings') setCurrentStep('settings');
    if (tabName === 'Alerts') return;
  };

  if (currentStep === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setCurrentStep(session ? 'overview' : 'login')}
        duration={1500}
      />
    );
  }

  // NO DASHBOARD PAGE WITHOUT A LOGIN PASS
  if (currentStep === 'login' || (!session && currentStep !== 'twoFactor')) {
    return (
      <LoginPage
        notice={loginNotice}
        onLoginSuccess={(info) => {
          setPending(info);
          setLoginNotice('');
          setCurrentStep('twoFactor');
        }}
      />
    );
  }

  if (currentStep === 'twoFactor') {
    return (
      <TwoFactorPage
        pendingToken={pending?.pendingToken}
        userEmail={pending?.email}
        codeValidMinutes={pending?.codeValidMinutes}
        onVerifySuccess={(result) => {
          setSession(saveSession(result));
          setPending(null);
          setCurrentStep('overview');
        }}
        onBackToLogin={() => logout()}
      />
    );
  }

  if (currentStep === 'overview') {
    return (
      <OverviewPage
        onTabChange={handleTabChange}
        onLogout={() => logout()}
      />
    );
  }

  if (currentStep === 'monitoring') {
    return (
      <MonitoringPage
        onTabChange={handleTabChange}
        onLogout={() => logout()}
        onSessionEnded={(notice) => logout(notice)}
      />
    );
  }

  if (currentStep === 'camera') {
    return (
      <CameraPage
        onTabChange={handleTabChange}
        onLogout={() => logout()}
      />
    );
  }

  if (currentStep === 'activityLog') {
    return (
      <ActivityPage
        onTabChange={handleTabChange}
        onLogout={() => logout()}
      />
    );
  }

  if (currentStep === 'settings') {
    return (
      <SettingsPage
        onTabChange={handleTabChange}
        onLogout={() => logout()}
      />
    );
  }

  return null;
}
