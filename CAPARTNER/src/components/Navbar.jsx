import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import capLogo from '../assets/CAP LOGO.png';

export default function Navbar({
  activeTab = 'Overview',
  onTabChange,
  userInitials = 'JC',
  userName = 'Jeremy Pretzel 213',
  userRole = 'Administrator',
  onLogout,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // DYNAMIC DATE AND TIME FORMATTER (e.g. "Oct 11 - 2026, 01:54 PM")
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const monthStr = now.toLocaleDateString('en-US', { month: 'short' });
      const dayStr = String(now.getDate()).padStart(2, '0');
      const yearStr = now.getFullYear();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setCurrentTime(`${monthStr} ${dayStr} - ${yearStr}, ${timeStr}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // CLOSE PROFILE DROPDOWN WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Overview', icon: 'tdesign:app' },
    { name: 'Monitoring', icon: 'lucide:activity' },
    { name: 'Camera', icon: 'lucide:video' },
    { name: 'Activity Log', icon: 'lucide:map' },
    { name: 'Settings', icon: 'lucide:settings' },
  ];

  return (
    <header
      className="w-full text-white px-6 py-3 font-sans box-border relative"
      style={{
        width: '100%',
        backgroundColor: '#043114',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <div
        className="max-w-[1400px] mx-auto flex items-center justify-between gap-4"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* LEFT SECTION: BRAND LOGO + TITLE + BADGE + DATE */}
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={capLogo}
            alt="CAPartner Logo"
            className="w-12 h-auto object-contain select-none"
            style={{ width: '62px', height: 'auto', objectFit: 'contain' }}
          />
          <div className="flex flex-col justify-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* ROW 1: BRAND NAME & EXACT MATCH ADMINISTRATOR BADGE */}
            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="font-black text-lg tracking-tight text-white leading-none"
                style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}
              >
                CAPartner
              </span>

              {/* UPDATED BADGE STYLING */}
              <span
                className="rounded-full font-black uppercase tracking-wider inline-flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  color: '#00FF2A',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  letterSpacing: '0.08em',
                  lineHeight: '1',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                ADMINISTRATOR
              </span>
            </div>
            
            {/* ROW 2: FORMATTED DATE */}
            <span
              className="font-medium opacity-90"
              style={{ fontSize: '0.75rem', color: '#8ba29a', marginTop: '4px', lineHeight: 1 }}
            >
              {currentTime || 'Oct 11 - 2026, 01:54 PM'}
            </span>
          </div>
        </div>

        {/* CENTER SECTION: NAVIGATION LINKS */}
        <nav
          className="flex items-center gap-6"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '72px',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onTabChange && onTabChange(item.name)}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer transition-colors"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#00FF38' : '#8ba29a',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '0.95rem',
                  padding: '6px 0',
                }}
              >
                <Icon
                  icon={item.icon}
                  width="20"
                  height="20"
                  color={isActive ? '#00FF38' : '#8ba29a'}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT SECTION: ALERTS BUTTON + USER AVATAR & DROPDOWN */}
        <div className="flex items-center gap-4 relative" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }} ref={dropdownRef}>
          
          {/* ALERTS BUTTON */}
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('Alerts')}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-none"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#382317',
              color: '#ff4d4d',
              borderRadius: '12px',
              padding: '8px 16px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:siren" width="18" height="18" color="#ff4d4d" />
            <span>ALERTS</span>

            {/* RED NOTIFICATION DOT */}
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ff0000',
                border: '2px solid #043114',
              }}
            />
          </button>

          {/* USER INITIALS CIRCLE (TOGGLES POPOVER) */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black select-none cursor-pointer border-none outline-none"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: '#043114',
              fontWeight: 900,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
            title="User Profile"
          >
            {userInitials}
          </button>

          {/* PROFILE POPOVER CARD */}
          {isProfileOpen && (
            <div
              className="absolute right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl p-4 w-60 text-slate-800 z-50"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                width: '240px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                boxSizing: 'border-box',
                zIndex: 50,
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                className="flex items-center gap-3 mb-4"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#043114',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon icon="fluent:person-24-filled" width="28" height="28" color="#ffffff" />
                </div>
                <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    className="font-extrabold text-sm leading-tight"
                    style={{ fontWeight: 800, fontSize: '0.92rem', color: '#043114', lineHeight: '1.2' }}
                  >
                    {userName}
                  </span>
                  <span
                    className="text-xs text-slate-500 font-medium"
                    style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}
                  >
                    {userRole}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider cursor-pointer border-none transition-colors"
                style={{
                  width: '100%',
                  padding: '10px 0',
                  backgroundColor: '#fcdcdc',
                  color: '#ff4d4d',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                LOG OUT
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}