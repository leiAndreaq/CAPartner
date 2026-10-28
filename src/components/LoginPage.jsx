import { useState, useRef } from 'react';
import { Activity, MapPin, Shield, Eye, EyeOff, User, Lock, ChevronRight, ArrowLeft, Check, Smartphone, Sparkles, Mail, Building, Briefcase, UserPlus, Phone } from 'lucide-react';
import capLogo from '../assets/CAP LOGO.png';
import mapBg from '../assets/location_pins.png';

export default function LoginPage({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'signup' | 'forgot' | 'success' | 'otp'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  // State para sa verification method (email o phone)
  const [verifyMethod, setVerifyMethod] = useState('email');
  
  // States para sa 6-digit OTP at custom toast message
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [toastMessage, setToastMessage] = useState('');
  const inputRefs = useRef([]);

  // State para sa Admin Account Sign Up Form
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    employeeId: '',
    contactNumber: '',
    department: 'Command Operations',
    role: 'System Administrator',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setCurrentView('otp');
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      setToastMessage('Passwords do not match. Please check again.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    setToastMessage(`Admin account for ${signUpData.fullName} registered! Please log in.`);
    setTimeout(() => {
      setToastMessage('');
      setCurrentView('login');
    }, 2500);
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
    setToastMessage(`New code sent to your ${verifyMethod === 'email' ? 'email' : 'phone number'}!`);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  return (
    <div className="h-[100dvh] w-full flex font-sans text-gray-800 overflow-hidden bg-white">
      
      {/* Left Panel - Green Branding Panel (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 bg-[#082B1A] text-white flex-col justify-between p-10 xl:p-14 relative h-full overflow-hidden shrink-0">
        <div 
          className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-50 grayscale sepia hue-rotate-90 saturate-[3] contrast-125"
          style={{ backgroundImage: `url(${mapBg})` }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#082B1A] via-[#082B1A]/95 to-[#082B1A]/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#082B1A] via-transparent to-transparent opacity-80"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="flex items-center gap-4 xl:gap-5 mb-12 xl:mb-16">
            <img src={capLogo} alt="CAPartner Logo" className="w-14 xl:w-16 h-auto relative z-10" />
            <div className="flex flex-col justify-center mt-1">
              <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white mb-0.5">
                CAPartner
              </h1>
              <p className="text-[9px] xl:text-[10px] font-medium tracking-[0.15em] text-emerald-100/70 uppercase max-w-[260px] leading-snug">
                CAPartner sa kalusugan, CAPartner sa kaligtasan
              </p>
            </div>
          </div>

          <div className="space-y-3 xl:space-y-4 max-w-2xl mb-8 xl:mb-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-[2px] bg-emerald-400"></div>
              <p className="text-[10px] xl:text-[11px] font-bold tracking-[0.15em] text-emerald-400 uppercase">
                IoT-Powered Operations
              </p>
            </div>
            
            <h2 className="text-4xl xl:text-[48px] font-medium tracking-tight leading-[1.1] text-white">
              Safer streets start with <br/> better visibility.
            </h2>
            <p className="text-sm xl:text-[15px] text-emerald-50/70 leading-relaxed font-light max-w-md pt-1">
              Real-time enforcer monitoring, incident response, and connected field operations—all in one secure platform.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Activity, text: "Health and movement at a glance" },
              { icon: MapPin, text: "Clearly marked last-known locations" },
              { icon: Shield, text: "Alerts and activity in one workspace" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-emerald-50">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm backdrop-blur-sm shrink-0">
                  <feature.icon className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                </div>
                <span className="text-xs xl:text-sm font-medium tracking-wide text-emerald-50">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Fixed & Non-scrollable Wrapper */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-4 sm:p-8 lg:p-10 relative overflow-hidden bg-white shrink-0">
        
        {/* Modern Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px] bg-[#0A3320] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-emerald-500/30 animate-in slide-in-from-top-4 duration-300">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-medium tracking-wide">{toastMessage}</p>
          </div>
        )}

        {/* Mobile Header Branding */}
        <div className="lg:hidden flex items-center justify-center gap-2.5 pt-1 pb-2 shrink-0">
          <img src={capLogo} alt="CAPartner Logo" className="w-9 h-auto" />
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight text-[#0A3320]">CAPartner</h1>
            <p className="text-[8px] font-semibold tracking-[0.18em] text-gray-500 uppercase">Secure Access</p>
          </div>
        </div>

        {/* Form Container Area (Centered & Compact) */}
        <div className="max-w-[400px] w-full mx-auto my-auto relative z-10 transition-all duration-300 flex flex-col justify-center">
          
          {/* --- LOGIN VIEW --- */}
          {currentView === 'login' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-[2px] bg-[#0A3320]"></div>
                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#0A3320] uppercase">
                    Secure Access
                  </p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-gray-500 text-xs">
                  Sign in to access the PSTMD command center.
                </p>
              </div>

              <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-900" htmlFor="username">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="username" type="text" placeholder="Enter your username" defaultValue="Alex Mendoza" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs sm:text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-900" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" defaultValue="••••••••" className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs sm:text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A3320] focus:ring-[#0A3320] accent-[#0A3320] cursor-pointer" />
                    <span className="text-[11px] text-gray-600 font-medium">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setCurrentView('forgot')} className="text-[11px] font-bold text-[#0A3320] hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0A3320]/20 cursor-pointer text-xs sm:text-sm">
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              {/* NOTICEABLE CREATE ADMIN ACCOUNT BUTTON */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 text-center">
                  <p className="text-[11px] font-bold text-gray-700 mb-2">New Command Center Personnel?</p>
                  <button
                    type="button"
                    onClick={() => setCurrentView('signup')}
                    className="w-full py-2.5 rounded-xl border-2 border-[#0A3320] text-[#0A3320] bg-white hover:bg-[#0A3320] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" /> Create Admin Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- CREATE ADMIN ACCOUNT VIEW --- */}
          {currentView === 'signup' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <button 
                onClick={() => setCurrentView('login')} 
                className="flex items-center gap-1 text-[11px] font-bold text-[#0A3320] hover:underline mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3.5 h-[2px] bg-[#0A3320]"></div>
                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#0A3320] uppercase">
                    Admin Registration
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  Create Admin Account
                </h2>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-2">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Juan Dela Cruz" 
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs" 
                    />
                  </div>
                </div>

                {/* Admin Employee ID & Contact Number */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Employee ID</label>
                    <div className="relative">
                      <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        required 
                        placeholder="ADM-2026-001" 
                        value={signUpData.employeeId}
                        onChange={(e) => setSignUpData({ ...signUpData, employeeId: e.target.value })}
                        className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Contact No.</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        required 
                        placeholder="09123456789" 
                        value={signUpData.contactNumber}
                        onChange={(e) => setSignUpData({ ...signUpData, contactNumber: e.target.value })}
                        className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs" 
                      />
                    </div>
                  </div>
                </div>

                {/* Department & Role */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Department</label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select 
                        value={signUpData.department}
                        onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                        className="w-full pl-8 pr-1 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] outline-none text-[11px] bg-white cursor-pointer"
                      >
                        <option>Command Operations</option>
                        <option>IT & Support</option>
                        <option>Emergency Dispatch</option>
                        <option>Field Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Role</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select 
                        value={signUpData.role}
                        onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                        className="w-full pl-8 pr-1 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] outline-none text-[11px] bg-white cursor-pointer"
                      >
                        <option>System Administrator</option>
                        <option>Field Dispatcher</option>
                        <option>Support Officer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Admin Email */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Official Admin Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      required 
                      placeholder="admin@capartner.sys" 
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs" 
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        placeholder="••••••••" 
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] outline-none text-xs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Confirm Pass</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        required 
                        placeholder="••••••••" 
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-gray-200 focus:border-[#0A3320] outline-none text-xs" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#0A3320]/20 cursor-pointer mt-3 text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  Register Admin Account
                </button>
              </form>
            </div>
          )}

          {/* --- TWO-FACTOR VERIFICATION (OTP) VIEW --- */}
          {currentView === 'otp' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1 text-[11px] font-bold text-[#0A3320] hover:underline mb-4 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>

              <div className="w-12 h-12 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-4 text-[#0A3320]">
                {verifyMethod === 'email' ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Verification
              </h2>

              <div className="flex p-1 mb-4 bg-gray-100/80 rounded-xl border border-gray-200/50">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    verifyMethod === 'phone' 
                      ? 'bg-white text-[#0A3320] shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Via SMS
                </button>
              </div>

              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                {verifyMethod === 'email' ? (
                  <>Enter the 6-digit code sent to (<span className="font-semibold text-gray-700">al*****@gmail.com</span>).</>
                ) : (
                  <>Enter the 6-digit code sent to (<span className="font-semibold text-gray-700">+63 9** *** ****</span>).</>
                )}
              </p>

              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-9 sm:w-11 h-11 sm:h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-[#0A3320] focus:ring-2 focus:ring-[#0A3320]/20 outline-none text-gray-900 bg-gray-50/50 focus:bg-white shadow-xs"
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-[#0A3320]/20 cursor-pointer text-xs sm:text-sm"
                >
                  Verify Code
                </button>

                <div className="text-xs text-gray-500 text-center">
                  Didn't receive the code?{' '}
                  <button type="button" onClick={triggerResendToast} className="font-bold text-[#0A3320] hover:underline cursor-pointer">
                    Resend OTP
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- FORGOT PASSWORD VIEW --- */}
          {currentView === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1 text-[11px] font-bold text-[#0A3320] hover:underline mb-6 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <div className="w-12 h-12 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-4 text-[#0A3320]">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Reset password</h2>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                Enter your work email and we'll send recovery instructions.
              </p>
              <form className="space-y-4" onSubmit={handleRecoverySubmit}>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-900" htmlFor="recovery-email">Work email</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="recovery-email" type="email" required value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="name@gmail.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs sm:text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#0A3320] hover:bg-[#061E12] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0A3320]/20 cursor-pointer text-xs sm:text-sm">
                  Send recovery link
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* --- RECOVERY SUCCESS VIEW --- */}
          {currentView === 'success' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-1 text-[11px] font-bold text-[#0A3320] hover:underline mb-6 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <div className="w-12 h-12 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-4 text-[#0A3320]">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Check your inbox</h2>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                We've sent recovery instructions to <span className="font-semibold text-gray-700">{recoveryEmail || 'your email'}</span>.
              </p>
            </div>
          )}

        </div>

        {/* Footer (Fixed at bottom) */}
        <div className="pt-2 text-center shrink-0">
          <p className="text-[10px] text-gray-400 tracking-wide">
            CAPartner all rights reserved
          </p>
        </div>

      </div>

    </div>
  );
}