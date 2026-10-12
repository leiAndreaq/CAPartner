import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import capLogo from '../assets/CAP LOGO.png';

export default function Navbar({
  activeTab = 'Overview',
  onTabChange,
  userInitials = 'JC',
  userName = 'Jeremy Pretzel 213',
  userRole = 'Administrator',
  hasAlerts = true,
  onLogout,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  // DYNAMIC DATE AND TIME FORMATTER
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
    <>
      <header
        style={{
          width: '100%',
          backgroundColor: '#033015',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 24px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* BRAND LOGO & TITLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={capLogo}
              alt="CAPartner Logo"
              style={{ width: '60px', height: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                  CAPartner
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.14)',
                    color: '#00FF2A',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    letterSpacing: '0.08em',
                  }}
                >
                  ADMINISTRATOR
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8ba29a', marginTop: '4px', lineHeight: 1 }}>
                {currentTime || 'Oct 12, 2026 - 03:00 PM'}
              </span>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onTabChange && onTabChange(item.name)}
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
                  <Icon icon={item.icon} width="20" height="20" color={isActive ? '#00FF38' : '#8ba29a'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* ALERTS & USER PROFILE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('Alerts')}
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
                cursor: 'pointer',
              }}
            >
              <Icon icon="lucide:siren" width="18" height="18" color="#ff4d4d" />
              <span>ALERTS</span>
              {hasAlerts && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ff0000',
                    boxShadow: '0 0 6px rgba(255, 0, 0, 0.6)',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#033015',
                fontWeight: 900,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {userInitials}
            </button>

            {/* PROFILE POPOVER CARD */}
            {isProfileOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  width: '240px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  zIndex: 50,
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#033015',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon icon="fluent:person-24-filled" width="28" height="28" color="#ffffff" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#033015' }}>{userName}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{userRole}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    backgroundColor: '#fcdcdc',
                    color: '#ff4d4d',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  LOG OUT
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #033015', 
              borderRadius: '24px',
              padding: '36px 32px 0px 32px',
              width: '100%',
              maxWidth: '360px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              boxSizing: 'border-box',
              overflow: 'hidden', 
            }}
          >
            {/* TITLE */}
            <h2
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#033015',
                margin: '0 0 6px 0',
                lineHeight: 1.2,
              }}
            >
              Are you sure?
            </h2>

            {/* SUBTITLE */}
            <p
              style={{
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: '#4a5568',
                margin: '0 0 28px 0',
              }}
            >
              Are you sure you want to LOG OUT?
            </p>

            {/* BUTTON ACTION GROUP */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              {/* SOLID LOG OUT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  backgroundColor: '#033015',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '10px 26px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
              >
                Log Out
              </button>

              {/* CANCEL BUTTON */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#033015',
                  border: '2px solid #033015',
                  borderRadius: '9999px',
                  padding: '8px 24px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
              >
                CANCEL
              </button>
            </div>

            {/* SOLID GREEN DECORATIVE BOTTOM BAND */}
            <div
              style={{
                height: '24px',
                backgroundColor: '#033015',
                margin: '0 -32px',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}