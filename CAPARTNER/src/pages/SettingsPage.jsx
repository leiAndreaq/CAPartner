import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SettingsPage({ onTabChange, onLogout }) {
  // ADMIN PROFILE FORM STATE
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

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
      <main style={{ flex: 1, maxWidth: '1150px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
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
                  <button
                    type="button"
                    onClick={() => toggleNotification('audibleSiren')}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: notifications.audibleSiren ? '#033015' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: notifications.audibleSiren ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => toggleNotification('desktopNotifications')}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: notifications.desktopNotifications ? '#033015' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: notifications.desktopNotifications ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => toggleNotification('loraFallback')}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: notifications.loraFallback ? '#033015' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: notifications.loraFallback ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => toggleNotification('lowBattery')}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: notifications.lowBattery ? '#033015' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: notifications.lowBattery ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
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

              {/* LOGOUT BUTTON */}
              <button
                type="button"
                onClick={onLogout}
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
    </div>
  );
}