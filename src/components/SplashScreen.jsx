import { useState, useEffect } from 'react';
import capLogo from '../assets/CAP LOGO.png';

export default function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 1200); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center w-full h-screen bg-[#0A3320] transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`flex flex-col items-center transition-all duration-500 ${isExiting ? '-translate-y-8 scale-105 opacity-0' : 'animate-in slide-in-from-bottom-4 duration-700 fade-in zoom-in-95'}`}>
        
        {/* Logo */}
        <img 
          src={capLogo} 
          alt="CAPartner Logo" 
          className="w-48 h-48 object-contain mb-8 drop-shadow-[0_10px_25px_rgba(0,0,0,0.25)]" 
        />
        
        {/* Branding */}
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
          CAPartner
        </h1>
        
        {/*  Tagline */}
        <p className="text-[11px] tracking-[0.25em] text-white uppercase font-semibold drop-shadow-sm text-center">
          CAPartner sa kalusugan, CAPartner sa kaligtasan
        </p>

        {/* Loading indicator */}
        <div className={`mt-14 flex gap-2 transition-opacity duration-200 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

      </div>
    </div>
  );
}