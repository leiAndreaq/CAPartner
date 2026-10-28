import { useState, useRef } from 'react';
import { Activity, MapPin, Shield, Eye, EyeOff, User, Lock, ChevronRight, ArrowLeft, Check, Smartphone, Sparkles, Mail } from 'lucide-react';
import capLogo from '../assets/CAP LOGO.png';
import mapBg from '../assets/location_pins.png';

export default function LoginPage({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'forgot' | 'success' | 'otp'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  // State para sa verification method (email o phone)
  const [verifyMethod, setVerifyMethod] = useState('email');
  
  // States para sa 6-digit OTP at custom toast message
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [toastMessage, setToastMessage] = useState('');
  const inputRefs = useRef([]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setCurrentView('otp');
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setCurrentView('success');
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    onLoginSuccess();
  };

  const triggerResendToast = () => {
    // Dynamic toast message depende sa pinili
    setToastMessage(`New code sent to your ${verifyMethod === 'email' ? 'email' : 'phone number'}!`);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  return (
    <div className="h-screen w-full flex font-sans text-gray-800 overflow-hidden bg-white">
      
      {/* Left Panel - Green Branding Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#082B1A] text-white flex-col justify-between p-10 xl:p-16 relative h-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-50 grayscale sepia hue-rotate-90 saturate-[3] contrast-125"
          style={{ backgroundImage: `url(${mapBg})` }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#082B1A] via-[#082B1A]/95 to-[#082B1A]/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#082B1A] via-transparent to-transparent opacity-80"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="flex items-center gap-4 xl:gap-5 mb-16 xl:mb-20">
            <img src={capLogo} alt="CAPartner Logo" className="w-16 xl:w-20 h-auto relative z-10" />
            <div className="flex flex-col justify-center mt-1">
              <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white mb-0.5">
                CAPartner
              </h1>
              <p className="text-[9px] xl:text-[10px] font-medium tracking-[0.15em] text-emerald-100/70 uppercase max-w-[260px] leading-snug">
                CAPartner sa kalusugan, CAPartner sa kaligtasan
              </p>
            </div>
          </div>

          <div className="space-y-4 xl:space-y-5 max-w-2xl mb-10 xl:mb-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-[2px] bg-emerald-400"></div>
              <p className="text-[10px] xl:text-[11px] font-bold tracking-[0.15em] text-emerald-400 uppercase">
                IoT-Powered Operations
              </p>
            </div>
            
            <h2 className="text-5xl xl:text-[56px] font-medium tracking-tight leading-[1.1] text-white">
              Safer streets start with <br/> better visibility.
            </h2>
            <p className="text-base xl:text-[16px] text-emerald-50/70 leading-relaxed font-light max-w-md pt-2">
              Real-time enforcer monitoring, incident response, and connected field operations—all in one secure platform.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Activity, text: "Health and movement at a glance" },
              { icon: MapPin, text: "Clearly marked last-known locations" },
              { icon: Shield, text: "Alerts and activity in one workspace" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 text-emerald-50">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm backdrop-blur-sm">
                  <feature.icon className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                </div>
                <span className="text-sm xl:text-[15px] font-medium tracking-wide text-emerald-50">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form / OTP Section */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 sm:p-12 relative overflow-hidden bg-white">
        
        {/* Modern Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px] bg-[#0A3320] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top-4 duration-300">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium tracking-wide">{toastMessage}</p>
          </div>
        )}

        <div className="max-w-[400px] w-full relative z-10 transition-all duration-300">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={capLogo} alt="CAPartner Logo" className="w-12 h-auto" />
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-[#0A3320]">CAPartner</h1>
              <p className="text-[8px] font-semibold tracking-[0.18em] text-gray-500 uppercase">Secure Access</p>
            </div>
          </div>
          
          {currentView === 'login' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-[2px] bg-[#0A3320]"></div>
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase">
                    Secure Access
                  </p>
                </div>
                <h2 className="text-3xl xl:text-4xl font-medium text-gray-900 mb-3 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-gray-500 text-sm">
                  Sign in to access the PSTMD command center.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900" htmlFor="username">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="username" type="text" placeholder="Enter your username" defaultValue="Alex Mendoza" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none transition-colors text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" defaultValue="••••••••" className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none transition-colors text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0A3320] focus:ring-[#0A3320] accent-[#0A3320] cursor-pointer transition-all" />
                    <span className="text-xs text-gray-600 font-medium">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setCurrentView('forgot')} className="text-xs font-bold text-[#0A3320] hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0A3320]/20">
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* --- TWO-FACTOR VERIFICATION (OTP) VIEW --- */}
          {currentView === 'otp' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1.5 text-xs font-bold text-[#0A3320] hover:underline mb-6">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>

              {/* Dynamic Icon Header depende sa napiling method */}
              <div className="w-14 h-14 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-6 text-[#0A3320] transition-colors">
                {verifyMethod === 'email' ? <Mail className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Verification
              </h2>

              {/* Toggle Switch para sa Email / Phone */}
              <div className="flex p-1 mb-5 bg-gray-100/80 rounded-xl border border-gray-200/50">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    verifyMethod === 'email' 
                      ? 'bg-white text-[#0A3320] shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Via Email
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    verifyMethod === 'phone' 
                      ? 'bg-white text-[#0A3320] shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Via SMS
                </button>
              </div>

              {/* Dynamic Description Text */}
              <p className="text-gray-500 text-xs mb-8 leading-relaxed min-h-[40px]">
                {verifyMethod === 'email' ? (
                  <>Enter the 6-digit code sent to your registered email address (<span className="font-semibold text-gray-700">al*****@gmail.com</span>). The code expires in 5 minutes.</>
                ) : (
                  <>Enter the 6-digit code sent to your registered phone number (<span className="font-semibold text-gray-700">+63 9** *** ****</span>). The code expires in 5 minutes.</>
                )}
              </p>

              <form onSubmit={handleOtpVerify} className="space-y-6">
                {/* 6 Digit Inputs - Mobile Responsiveness Maintained */}
                <div className="flex justify-center sm:justify-between gap-1.5 sm:gap-2">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#0A3320] focus:ring-2 focus:ring-[#0A3320]/20 outline-none transition-all text-gray-900 bg-gray-50/50 focus:bg-white shadow-sm"
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-[#0A3320]/20"
                >
                  Verify Code
                </button>

                <div className="text-xs text-gray-500 text-center pt-1">
                  Didn't receive the code?{' '}
                  <button type="button" onClick={triggerResendToast} className="font-bold text-[#0A3320] hover:underline">
                    Resend OTP
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentView === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1.5 text-xs font-bold text-[#0A3320] hover:underline mb-8">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <div className="w-14 h-14 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-[#0A3320]" />
              </div>
              <h2 className="text-3xl xl:text-4xl font-medium text-gray-900 mb-3 tracking-tight">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Enter your work email and we'll send you secure recovery instructions.
              </p>
              <form className="space-y-6" onSubmit={handleRecoverySubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900" htmlFor="recovery-email">Work email</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="recovery-email" type="email" required value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="name@gmail.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none transition-colors text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0A3320]/20">
                  Send recovery link
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {currentView === 'success' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1.5 text-xs font-bold text-[#0A3320] hover:underline mb-8">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <div className="w-14 h-14 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-6">
                <Check className="w-6 h-6 text-[#0A3320]" />
              </div>
              <h2 className="text-3xl xl:text-4xl font-medium text-gray-900 mb-3 tracking-tight">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                We've sent recovery instructions to <span className="font-semibold text-gray-700">{recoveryEmail || 'your email'}</span>.
              </p>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 tracking-wide">
              CAPartner all rights reserved
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}