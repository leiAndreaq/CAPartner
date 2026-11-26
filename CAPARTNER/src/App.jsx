import { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import SplashScreen from './components/SplashScreen';
import SosPopup from './components/SosPopup';
import LoginPage from './pages/LoginPage';
import TwoFactorPage from './pages/TwoFactorPage';
import { AlertsProvider } from './alertsWatcher';
import { saveSession, loadSession, clearSession, adminLogout } from './api';

// Dashboard pages load only when opened, so the first screen loads faster.
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const CameraPage = lazy(() => import('./pages/CameraPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));

const DASHBOARD_STEPS = ['overview', 'monitoring', 'alerts', 'camera', 'activityLog', 'settings'];

// The page is kept in the address (example: #/alerts), so a refresh stays on the same page and Back works.
function stepFromHash() {
  const name = window.location.hash.replace(/^#\//, '');
  return DASHBOARD_STEPS.includes(name) ? name : 'overview';
}

export default function App() {
  const [currentStep, setCurrentStep] = useState('splash');
  // pending = password was right, waiting for the email code
  const [pending, setPending] = useState(null);
  // session = fully logged in (login pass + when it ends)
  const [session, setSession] = useState(loadSession);
  const [loginNotice, setLoginNotice] = useState('');
  // Enforcer to open on the Monitoring page (from the Overview or an alert)
  const [focusEnforcerId, setFocusEnforcerId] = useState(null);

  // LOG OUT: TELL THE BACKEND, FORGET THE LOGIN PASS AND GO BACK TO THE LOGIN PAGE
  const logout = (notice = '') => {
    adminLogout();
    clearSession();
    setSession(null);
    setPending(null);
    setLoginNotice(notice);
    setCurrentStep('login');
  };

  // The admin stays logged in until Log out. This only runs if a login pass ever has an end time.
  useEffect(() => {
    if (!session || !session.expiresAt) return undefined;
    const timer = setTimeout(
      () => logout('You were signed out automatically. Please log in again.'),
      Math.max(session.expiresAt - Date.now(), 0)
    );
    return () => clearTimeout(timer);
  }, [session]);

  // KEEP THE ADDRESS IN STEP WITH THE PAGE (only while logged in and on a dashboard page)
  useEffect(() => {
    if (currentStep === 'splash') return;
    if (session && DASHBOARD_STEPS.includes(currentStep)) {
      if (window.location.hash !== `#/${currentStep}`) window.location.hash = `#/${currentStep}`;
    } else if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentStep, session]);

  // BROWSER BACK / FORWARD CHANGES THE PAGE
  useEffect(() => {
    if (!session) return undefined;
    const onHashChange = () => {
      const name = window.location.hash.replace(/^#\//, '');
      if (DASHBOARD_STEPS.includes(name)) setCurrentStep(name);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [session]);

  // HANDLE TAB NAVIGATION BETWEEN DASHBOARD PAGES
  const handleTabChange = (tabName) => {
    if (tabName === 'Overview') setCurrentStep('overview');
    if (tabName === 'Monitoring') {
      setFocusEnforcerId(null);
      setCurrentStep('monitoring');
    }
    if (tabName === 'Alerts') setCurrentStep('alerts');
    if (tabName === 'Camera') setCurrentStep('camera');
    if (tabName === 'Activity Log') setCurrentStep('activityLog');
    if (tabName === 'Settings') setCurrentStep('settings');
  };

  const openEnforcer = (enforcerId) => {
    setFocusEnforcerId(enforcerId);
    setCurrentStep('monitoring');
  };

  if (currentStep === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setCurrentStep(session ? stepFromHash() : 'login')}
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

  // Props every dashboard page gets
  const pageProps = {
    onTabChange: handleTabChange,
    onLogout: () => logout(),
    onSessionEnded: (notice) => logout(notice),
    onOpenEnforcer: openEnforcer,
  };

  const pages = {
    overview: <OverviewPage {...pageProps} />,
    monitoring: <MonitoringPage {...pageProps} focusEnforcerId={focusEnforcerId} />,
    alerts: <AlertsPage {...pageProps} />,
    camera: <CameraPage {...pageProps} />,
    activityLog: <ActivityPage {...pageProps} />,
    settings: <SettingsPage {...pageProps} />,
  };

  // The alert watcher stays mounted while moving between pages, so polling and the siren keep going.
  return (
    <AlertsProvider isLoggedIn={Boolean(session) && DASHBOARD_STEPS.includes(currentStep)} onSessionEnded={(notice) => logout(notice)}>
      <Suspense fallback={<div role="status" style={{ padding: 24 }}>Loading...</div>}>
        {pages[currentStep] || null}
      </Suspense>
      <SosPopup onOpenAlerts={() => setCurrentStep('alerts')} />
    </AlertsProvider>
  );
}
