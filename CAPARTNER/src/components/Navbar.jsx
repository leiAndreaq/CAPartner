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
  showEmergencyPopup = false,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEmergencyToast, setShowEmergencyToast] = useState(false);
  const [isEmergencyToastDismissed, setIsEmergencyToastDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [alertItems, setAlertItems] = useState([
    {
      type: 'SOS Alert',
      title: 'SOS Alert',
      detail: 'Enforcer 02 - Camarin Road - Department 2 - Intersection 2',
      time: 'Today 9:35 PM',
      status: 'New',
      tone: '#ef4444',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
    },
    {
      type: 'Camera',
      title: 'Camera opened',
      detail: 'Enforcer 02 - CAP-B04 started streaming from Intersection 2.',
      time: 'Today 9:35 PM',
      status: 'New',
      tone: '#f59e0b',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
    },
    {
      type: 'SOS Alert',
      title: 'SOS Alert',
      detail: 'Enforcer 01 - Manual SOS held for 35s at Intersection 1.',
      time: 'Today 11:24 AM',
      status: 'Acknowledged',
      tone: '#ef4444',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
    },
    {
      type: 'Health',
      title: 'High Temperature',
      detail: 'Enforcer 02 - Body temperature reached 38.7°C for 6 minutes.',
      time: 'Today 9:47 AM',
      status: 'Resolved',
      tone: '#f59e0b',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
    },
    {
      type: 'Connection',
      title: 'Connection Lost',
      detail: 'Enforcer 03 - Cap dropped from internet to no signal.',
      time: 'Yesterday 4:08 PM',
      status: 'Resolved',
      tone: '#22c55e',
      badgeBg: '#dcfce7',
      badgeText: '#15803d',
    },
  ]);
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEmergencyToastDismissed || isMobile) return undefined;

    const timer = setTimeout(() => {
      setShowEmergencyToast(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isEmergencyToastDismissed, isMobile]);

  // CLOSE POPUPS WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsAlertsOpen(false);
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
        className="cap-header"
        style={{
          width: '100%',
          backgroundColor: '#033015',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: isMobile ? 'max(12px, env(safe-area-inset-top)) 12px 10px' : '12px 24px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <div
          className="cap-header-inner"
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
          <div className="cap-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={capLogo}
              alt="CAPartner Logo"
              style={{ width: isMobile ? '44px' : '60px', height: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="cap-brand-name" style={{ fontSize: isMobile ? '1.05rem' : '1.45rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                  CAPartner
                </span>
                {!isMobile && (
                  <span
                    className="cap-brand-badge"
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
                )}
              </div>
              <span className="cap-brand-time" style={{ fontSize: isMobile ? '0.62rem' : '0.75rem', color: '#8ba29a', marginTop: '4px', lineHeight: 1 }}>
                {currentTime || 'Oct 12, 2026 - 03:00 PM'}
              </span>
            </div>
          </div>

          {!isMobile && (
            <nav className="cap-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
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
          )}

          {/* ALERTS & USER PROFILE */}
          <div className="cap-header-actions" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', position: 'relative' }} ref={dropdownRef}>
            <div style={{ position: 'relative' }}>
              <button
                className="cap-alert-button"
                type="button"
                onClick={() => {
                  setIsAlertsOpen((prev) => !prev);
                  setIsProfileOpen(false);
                  setShowEmergencyToast(false);
                  setIsEmergencyToastDismissed(true);
                }}
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

              {!showEmergencyPopup && !isAlertsOpen && showEmergencyToast && (
                <div
                  style={{
                    position: 'absolute',
                    right: 'calc(100% + 12px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '300px',
                    background: '#ef4b4b',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 14px 28px rgba(239, 75, 75, 0.22)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    zIndex: 20,
                  }}
                  onClick={() => {
                    setShowEmergencyToast(false);
                    setIsEmergencyToastDismissed(true);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: 800, opacity: 0.95, marginBottom: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block' }} />
                    <span>Active SOS · unacknowledged</span>
                    <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 7px', borderRadius: '999px', fontSize: '0.58rem', fontWeight: 800 }}>ALR-2291</span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '4px' }}>CAP-01 — Ramon Dizon</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                    Auto-detected abnormal heart rate (132 bpm)
                  </div>
                </div>
              )}

              {isAlertsOpen && (
                isMobile ? (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: '#031d12',
                      zIndex: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: 'max(16px, env(safe-area-inset-top))',
                      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 12px', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
                      <button
                        type="button"
                        onClick={() => setIsAlertsOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          minWidth: '44px',
                          minHeight: '44px',
                        }}
                      >
                        Back
                      </button>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Notifications</div>
                      <button
                        type="button"
                        onClick={() => setAlertItems([])}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          minWidth: '44px',
                          minHeight: '44px',
                        }}
                      >
                        Clear all
                      </button>
                    </div>

                    <div style={{ padding: '12px 12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {['All', 'S0S', 'Health', 'Connection', 'Device'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            style={{
                              backgroundColor: tab === 'All' ? '#1e293b' : 'transparent',
                              color: tab === 'All' ? '#f8fafc' : '#cbd5e1',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '9999px',
                              padding: '7px 12px',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 20px' }}>
                      {alertItems.length === 0 ? (
                        <div style={{ padding: '32px 16px', color: '#cbd5e1', textAlign: 'center', fontSize: '0.95rem' }}>
                          No notifications.
                        </div>
                      ) : (
                        alertItems.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            style={{
                              backgroundColor: '#0f172a',
                              border: '1px solid rgba(148,163,184,0.18)',
                              borderRadius: '16px',
                              padding: '12px',
                              marginBottom: '10px',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                backgroundColor: item.badgeBg,
                                color: item.badgeText,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {item.type === 'SOS Alert' ? 'SOS' : item.type === 'Health' ? '!' : item.type === 'Camera' ? 'C' : item.type === 'Connection' ? 'C' : 'A'}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.82rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>{item.time}</div>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.detail}</div>
                              <div
                                style={{
                                  marginTop: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: item.badgeBg,
                                  color: item.badgeText,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                }}
                              >
                                {item.status}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="cap-alert-panel"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: '760px',
                      maxWidth: '92vw',
                      backgroundColor: '#0f172a',
                      borderRadius: '18px',
                      boxShadow: '0 24px 48px rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      overflow: 'hidden',
                      zIndex: 60,
                    }}
                  >
                    <div className="cap-alert-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="cap-alert-header-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Notifications</span>
                      </div>
                      <div className="cap-alert-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setAlertItems([])}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f8fafc',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Clear all
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAlertsOpen(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="cap-alert-content" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', minHeight: '420px' }}>
                      <div style={{ padding: '16px 0 0', backgroundColor: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 18px 12px' }}>
                          {['All', 'S0S', 'Health', 'Connection', 'Device'].map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              style={{
                                backgroundColor: tab === 'All' ? '#1e293b' : 'transparent',
                                color: tab === 'All' ? '#f8fafc' : '#cbd5e1',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '9999px',
                                padding: '7px 12px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        <div className="cap-alert-list" style={{ maxHeight: '360px', overflowY: 'auto', padding: '0 8px 12px' }}>
                          {alertItems.length === 0 ? (
                            <div style={{ padding: '24px 16px', color: '#cbd5e1', fontSize: '0.9rem', textAlign: 'center' }}>
                              No notifications.
                            </div>
                          ) : (
                            alertItems.map((item, index) => (
                              <div
                                className="cap-alert-item"
                                key={`${item.title}-${index}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '12px 12px',
                                  borderBottom: index < alertItems.length - 1 ? '1px solid rgba(148, 163, 184, 0.12)' : 'none',
                                }}
                              >
                                <div
                                  className="cap-alert-item-badge"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    backgroundColor: item.badgeBg,
                                    color: item.badgeText,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.type === 'SOS Alert' ? 'SOS' : item.type === 'Health' ? '!' : item.type === 'Camera' ? 'C' : item.type === 'Connection' ? 'C' : 'A'}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                    <div className="cap-alert-item-title" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>{item.title}</div>
                                    <div className="cap-alert-item-meta" style={{ fontSize: '0.68rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{item.time}</div>
                                  </div>
                                  <div className="cap-alert-item-copy" style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '6px' }}>{item.detail}</div>
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '4px 8px',
                                      borderRadius: '9999px',
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      backgroundColor: item.badgeBg,
                                      color: item.badgeText,
                                    }}
                                  >
                                    {item.status}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="cap-alert-side" style={{ backgroundColor: '#111827', padding: '18px 20px', borderLeft: '1px solid rgba(148, 163, 184, 0.12)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                          Background
                        </div>
                        <div style={{ backgroundColor: '#0f172a', borderRadius: '14px', padding: '16px', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
                          <div style={{ color: '#f8fafc', fontWeight: 800, marginBottom: '8px' }}>Live event feed</div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.7 }}>
                            Multiple patrol units are reporting active conditions.
                            <br />
                            Recent activity includes a manual emergency trigger, camera activation, and a dropped signal from one mobile unit.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              className="cap-profile-button"
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

      {isMobile && (
        <nav className="cap-mobile-bottom-nav" style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '4px',
          padding: '10px calc(12px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))',
          background: 'rgba(3, 48, 21, 0.94)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          zIndex: 90,
          boxShadow: '0 -10px 28px rgba(2, 16, 11, 0.2)',
        }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={`${item.name}-bottom`}
                type="button"
                onClick={() => onTabChange && onTabChange(item.name)}
                style={{
                  minHeight: '44px',
                  border: 'none',
                  background: isActive ? 'rgba(0, 255, 56, 0.12)' : 'transparent',
                  color: isActive ? '#00FF38' : '#cfe2db',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontWeight: isActive ? 800 : 700,
                  fontSize: '0.62rem',
                  cursor: 'pointer',
                  padding: '6px 4px',
                }}
              >
                <Icon icon={item.icon} width="18" height="18" color={isActive ? '#00FF38' : '#cfe2db'} />
                <span>{item.name === 'Activity Log' ? 'Activity' : item.name}</span>
              </button>
            );
          })}
        </nav>
      )}

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