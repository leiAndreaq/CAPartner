import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SettingsPage({ onTabChange, onLogout }) {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    office: '',
    position: '',
  });

  // NOTIFICATION TOGGLES STATE
  const [notifications, setNotifications] = useState({
    audibleSiren: true,
    desktopNotifications: true,
    loraFallback: true,
    lowBattery: true,
  });

  // LOGOUT CONFIRMATION MODAL STATE
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSwitch = (enabled, onToggle) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={enabled ? 'Enabled' : 'Disabled'}
      style={{
        width: '52px',
        height: '30px',
        borderRadius: '9999px',
        backgroundColor: enabled ? '#033015' : '#dff7e9',
        border: `1px solid ${enabled ? '#033015' : '#a7f3d0'}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        padding: 0,
        boxShadow: enabled ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'inset 0 0 0 1px rgba(3, 48, 21, 0.06)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '4px',
          left: enabled ? '26px' : '4px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
        }}
      />
    </button>
  );

  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert('Admin profile updated successfully!');
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
      className="min-h-screen flex flex-col bg-white"
    >
      {/* INJECTED AUTO-HIDING SCROLLBAR & NAVIGATION STABILIZER */}
      <style>{`
        html {
          scroll-behavior: smooth;
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(3, 48, 21, 0.25);
          border-radius: 9999px;
          transition: background 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(3, 48, 21, 0.7);
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(3, 48, 21, 0.3) transparent;
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar activeTab="Settings" onTabChange={onTabChange} onLogout={onLogout} />

      {/* MAIN CONTENT AREA */}
      <main className="settings-main" style={{ flex: 1, maxWidth: '1150px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* PAGE HEADER */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              color: '#033015',
              fontSize: '2.5rem',
              fontWeight: 900,
              margin: '0 0 4px 0',
              letterSpacing: '-0.03em',
            }}
          >
            Settings
          </h1>
          <p style={{ color: '#475569', fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
            Admin profile and notification preferences
          </p>
        </div>

        {/* TWO-COLUMN SETTINGS GRID */}
        <div
          className="settings-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          
          {/* LEFT COLUMN: ADMIN PROFILE CARD */}
          <div
            style={{
              backgroundColor: '#033015',
              borderRadius: '20px',
              padding: '36px 32px',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
                Admin profile
              </h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 500 }}>
                Displayed on acknowledgements and audit entries.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* FULL NAME */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* EMAIL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* OFFICE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                  Office
                </label>
                <input
                  type="text"
                  value={profile.office}
                  onChange={(e) => setProfile({ ...profile, office: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* POSITION */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                  Position
                </label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* SAVE BUTTON */}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#033015',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 28px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  Save profile
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: NOTIFICATIONS & END SESSION CARDS */}
          <div className="settings-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* NOTIFICATIONS CARD */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                Notifications
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* TOGGLE 1 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Audible SOS siren
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                      Plays until acknowledged
                    </p>
                  </div>
                  {renderSwitch(notifications.audibleSiren, () => toggleNotification('audibleSiren'))}
                </div>

                {/* TOGGLE 2 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Desktop notifications
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                      Station console only
                    </p>
                  </div>
                  {renderSwitch(notifications.desktopNotifications, () => toggleNotification('desktopNotifications'))}
                </div>

                {/* TOGGLE 3 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      LoRa fallback alerts
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                      When a cap loses internet
                    </p>
                  </div>
                  {renderSwitch(notifications.loraFallback, () => toggleNotification('loraFallback'))}
                </div>

                {/* TOGGLE 4 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0 4px 0',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Low battery warnings
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                      Below 20% remaining
                    </p>
                  </div>
                  {renderSwitch(notifications.lowBattery, () => toggleNotification('lowBattery'))}
                </div>

              </div>
            </div>

            {/* END SESSION CARD */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                textAlign: 'center',
              }}
            >
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                End Session
              </h2>
              <p style={{ margin: '0 0 18px 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                Are you sure you want to end your current admin session?
              </p>

              {/* LOGOUT BUTTON - TRIGGERS CONFIRMATION MODAL */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                style={{
                  width: '100%',
                  backgroundColor: '#fcdcdc',
                  color: '#ff4d4d',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <Icon icon="lucide:log-out" width="18" height="18" color="#ff4d4d" />
                Log out
              </button>

              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                You will need to log in again to access the admin dashboard.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <Footer />

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
              overflow: 'hidden', // Clips the bottom green band perfectly
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
    </div>
  );
}