import { useState } from 'react';
import './index.css'; // Ensures Tailwind styles are loaded across the entire application
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import TwoFactorPage from './pages/TwoFactorPage';
import OverviewPage from './pages/OverviewPage';

export default function App() {
  const [currentStep, setCurrentStep] = useState('splash');

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
        onBackToLogin={() => setCurrentStep('login')} // Allows returning to Login from 2FA
      />
    );
  }

  if (currentStep === 'overview') {
    return (
      <OverviewPage
        onLogout={() => setCurrentStep('login')}
      />
    );
  }

  return null;
}