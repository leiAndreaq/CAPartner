import { useState } from 'react';
import { Activity, MapPin, Shield, Eye, EyeOff, User, Lock, ChevronRight, ArrowLeft, Check } from 'lucide-react';
import capLogo from '../assets/CAP LOGO.png';
import mapBg from '../assets/location_pins.png';

export default function LoginPage({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState('login'); 
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess();
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setCurrentView('success');
  };

  return (
    <div className="h-screen w-full flex font-sans text-gray-800 overflow-hidden bg-white">
      
      {/* Left Panel */}
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

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 sm:p-12 relative overflow-y-auto">
        <div className="max-w-[400px] w-full relative z-10 transition-all duration-300">
          
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
                    <input id="username" type="text" placeholder="Enter your username" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none transition-colors text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none transition-colors text-sm" />
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