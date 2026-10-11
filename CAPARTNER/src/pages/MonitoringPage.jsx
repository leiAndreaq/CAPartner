import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MonitoringPage({ onTabChange, onLogout }) {
  // Always default to 'All' when arriving at or navigating back to Monitoring
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // MOCK ENFORCER TABLE DATA
  const [enforcers, setEnforcers] = useState([
    {
      no: 1,
      capId: 'CAP 001',
      filterTag: 'Enforcer 01',
      fullName: 'Jeremy Denzo',
      email: 'jeypi.denzo31@gmail.com',
      badgeNo: 'PSTMD 2026 084',
      location: 'Sector 4 - Vicas Market',
      heartRate: '132',
      temp: '38.4',
      battery: '46%',
      lastSync: '14:32:08',
      connection: 'Internet',
      coords: '14.7539° N, 121.0513° E',
      alertsCount: 2,
      mediaCount: 2,
    },
    {
      no: 2,
      capId: 'CAP 002',
      filterTag: 'Enforcer 02',
      fullName: 'Lei Aguila',
      email: 'lei.aguila@gmail.com',
      badgeNo: 'PSTMD 2026 083',
      location: 'Sector 5 - Almar, Zabarte',
      heartRate: '98',
      temp: '36.8',
      battery: '18%',
      lastSync: '14:30:15',
      connection: 'LoRa fallback',
      coords: '14.7482° N, 121.0421° E',
      alertsCount: 1,
      mediaCount: 0,
    },
    {
      no: 3,
      capId: 'CAP 003',
      filterTag: 'Enforcer 03',
      fullName: 'Juban Bamba',
      email: 'juban.bamba@gmail.com',
      badgeNo: 'PSTMD 2026 082',
      location: 'Sector 6 - Zapote Road',
      heartRate: '—',
      temp: '—',
      battery: '0%',
      lastSync: '11:15:00',
      connection: 'Offline',
      coords: '14.7391° N, 121.0380° E',
      alertsCount: 0,
      mediaCount: 0,
    },
  ]);

  // NEW ENFORCER FORM STATE
  const [newEnforcer, setNewEnforcer] = useState({
    fullName: '',
    email: '',
    badgeNo: '',
    contactNo: '',
    sector: '',
    capId: '',
  });

  const filterTabs = ['All', 'Enforcer 01', 'Enforcer 02', 'Enforcer 03'];

  const selectedEnforcerData =
    enforcers.find((item) => item.filterTag === activeFilter) || enforcers[0];

  const filteredEnforcers =
    activeFilter === 'All'
      ? enforcers
      : enforcers.filter((item) => item.filterTag === activeFilter);

  // DELETE HANDLER
  const handleDelete = (capId) => {
    setEnforcers((prev) => prev.filter((item) => item.capId !== capId));
  };

  // CLEAR FORM HANDLER
  const handleClearForm = () => {
    setNewEnforcer({
      fullName: '',
      email: '',
      badgeNo: '',
      contactNo: '',
      sector: '',
      capId: '',
    });
  };

  // ADD ENFORCER HANDLER
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEnforcer.email || !newEnforcer.fullName) return;

    const nextNo = enforcers.length + 1;
    const addedItem = {
      no: nextNo,
      capId: newEnforcer.capId || `CAP 00${nextNo}`,
      filterTag: `Enforcer 0${nextNo}`,
      fullName: newEnforcer.fullName,
      email: newEnforcer.email,
      badgeNo: newEnforcer.badgeNo || 'PSTMD 2026 088',
      location: newEnforcer.sector || 'Sector 4 - Vicas Market',
      heartRate: '75',
      temp: '36.5',
      battery: '100%',
      lastSync: 'Just now',
      connection: 'Internet',
      coords: '14.7500° N, 121.0500° E',
      alertsCount: 0,
      mediaCount: 0,
    };

    setEnforcers((prev) => [...prev, addedItem]);
    handleClearForm();
    setIsAddModalOpen(false);
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
        /* Fixes page jump/glitch when navigating across different pages */
        html {
          scroll-behavior: smooth;
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }

        /* Auto-hiding custom scrollbar */
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

        /* Firefox support */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(3, 48, 21, 0.3) transparent;
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar activeTab="Monitoring" onTabChange={onTabChange} onLogout={onLogout} />

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* PAGE TITLE */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              color: '#033015',
              fontSize: '2.5rem',
              fontWeight: 900,
              margin: '0 0 6px 0',
              letterSpacing: '-0.03em',
            }}
          >
            Enforcer Monitoring
          </h1>
          <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
            Vitals, connection and health history
          </p>
        </div>

        {/* CONTROLS ROW: FILTER TABS + ADD ENFORCER BUTTON */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* FILTER BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    backgroundColor: isActive ? '#033015' : '#e2e8f0',
                    color: isActive ? '#ffffff' : '#334155',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* ADD ENFORCER BUTTON */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 28px',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(3, 48, 21, 0.25)',
            }}
          >
            + Add Enforcer
          </button>
        </div>

        {/* CONDITION 1: IF 'All' IS SELECTED -> SHOW TABLE */}
        {activeFilter === 'All' ? (
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              borderRadius: '18px',
              border: '2px solid #033015',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#ffffff',
            }}
          >
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                textAlign: 'center',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#033015', color: '#ffffff' }}>
                  <th style={{ padding: '16px', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', width: '60px' }}>No.</th>
                  <th style={{ padding: '16px', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', width: '130px' }}>CAP ID No.</th>
                  <th style={{ padding: '16px', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', width: '240px' }}>Email</th>
                  <th style={{ padding: '16px', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', width: '160px' }}>Badge No.</th>
                  <th style={{ padding: '16px', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', width: '220px' }}>Location</th>
                  <th style={{ padding: '16px', fontWeight: 800, width: '170px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnforcers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', color: '#64748b', fontWeight: 600 }}>
                      No enforcers found.
                    </td>
                  </tr>
                ) : (
                  filteredEnforcers.map((item, index) => (
                    <tr
                      key={item.capId}
                      style={{
                        borderBottom: index !== filteredEnforcers.length - 1 ? '1px solid #033015' : 'none',
                      }}
                    >
                      <td style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.no}
                      </td>
                      <td style={{ padding: '18px 16px', fontWeight: 900, color: '#033015', borderRight: '1px solid #033015' }}>
                        {item.capId}
                      </td>
                      <td
                        title={item.email}
                        style={{
                          padding: '18px 16px',
                          fontWeight: 700,
                          color: '#033015',
                          textDecoration: 'underline',
                          borderRight: '1px solid #033015',
                          maxWidth: '240px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.email}
                      </td>
                      <td style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.badgeNo}
                      </td>
                      <td style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.location}
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setActiveFilter(item.filterTag)}
                            style={{
                              backgroundColor: '#033015',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '9999px',
                              padding: '6px 20px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.capId)}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#033015',
                              border: '1px solid #033015',
                              borderRadius: '9999px',
                              padding: '6px 20px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* CONDITION 2: INDIVIDUAL ENFORCER MONITORING DASHBOARD (ENFORCER 01 / 02 / 03) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* CARD 1: VITALS ACROSS THIS SHIFT */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#033015', fontSize: '1.15rem', fontWeight: 900 }}>
                    Vitals across this shift
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                    09:05 - 14:35 · Sampled every 60s
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '32px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      Heart rate
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                        {selectedEnforcerData.heartRate}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>bpm</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                      Temperature
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                        {selectedEnforcerData.temp}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BODY TEMP GRAPH */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Body temperature (°C)
                </span>
                <div style={{ width: '100%', height: '80px', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 80" preserveAspectRatio="none">
                    <line x1="0" y1="28" x2="500" y2="28" stroke="#f2ca65" strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 0 38 Q 200 25, 500 22" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* HEART RATE GRAPH */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Heart rate (bpm)
                </span>
                <div style={{ width: '100%', height: '80px', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 80" preserveAspectRatio="none">
                    <line x1="0" y1="52" x2="500" y2="52" stroke="#f2ca65" strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 0 70 Q 250 58, 500 35" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* CARD 2: UNIT STATUS */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: '#033015', fontSize: '1.1rem', fontWeight: 900 }}>
                Unit status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon icon="lucide:battery" width="18" height="18" /> Battery
                  </span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedEnforcerData.battery}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon icon="lucide:rotate-cw" width="18" height="18" /> Last sync
                  </span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedEnforcerData.lastSync}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Connection</span>
                  <span
                    style={{
                      backgroundColor: selectedEnforcerData.connection === 'Internet' ? '#dcfce7' : '#fef3c7',
                      color: selectedEnforcerData.connection === 'Internet' ? '#15803d' : '#b45309',
                      padding: '4px 16px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                    }}
                  >
                    {selectedEnforcerData.connection}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon icon="lucide:map-pin" width="18" height="18" /> Coordinates
                  </span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {selectedEnforcerData.coords}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Icon icon="lucide:bell" width="16" height="16" />
                  Alerts ({selectedEnforcerData.alertsCount})
                </button>

                <button
                  type="button"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Icon icon="lucide:image" width="16" height="16" />
                  Media ({selectedEnforcerData.mediaCount})
                </button>
              </div>
            </div>

            {/* CARD 3: LOCATION & MOVEMENT */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#033015', fontSize: '1.1rem', fontWeight: 900 }}>
                  Location & movement
                </h3>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Last 90 minutes</span>
              </div>

              <div
                style={{
                  height: '220px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#e2e8f0',
                }}
              >
                <iframe
                  title="OpenStreetMap Location Movement"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 'calc(100% + 32px)',
                    border: 0,
                    pointerEvents: 'none',
                  }}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=121.0300%2C14.7450%2C121.0600%2C14.7650&amp;layer=mapnik"
                />

                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                  <path d="M 180 180 L 320 120 L 400 65" fill="none" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="400" cy="65" r="9" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                </svg>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Currently at </span>
                <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800 }}>
                  {selectedEnforcerData.location}
                </span>
              </div>
            </div>

            {/* CARD 4: CONNECTION HISTORY */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ margin: 0, color: '#033015', fontSize: '1.1rem', fontWeight: 900 }}>
                Connection history
              </h3>
              <p style={{ margin: '4px 0 18px 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                Internet / LoRa switch events for {selectedEnforcerData.capId} this shift
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', width: '45px' }}>14:02</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                    <strong style={{ color: '#0f172a' }}>Internet</strong> — Restored — LTE signal regained
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', width: '45px' }}>13:18</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                    <strong style={{ color: '#0f172a' }}>LoRa fallback</strong> — Fallback — LTE dropped below threshold
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', width: '45px' }}>11:47</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                    <strong style={{ color: '#0f172a' }}>Internet</strong> — Restored — LTE signal regained
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', width: '45px' }}>09:05</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                    <strong style={{ color: '#0f172a' }}>Internet</strong> — Shift start — unit paired
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <Footer />

      {/* ADD NEW ENFORCER MODAL FORM */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                backgroundColor: '#033015',
                color: '#ffffff',
                padding: '24px 20px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  position: 'absolute',
                  right: '18px',
                  top: '18px',
                  backgroundColor: '#ffffff',
                  color: '#033015',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Add New Enforcer
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', opacity: 0.85, fontWeight: 500 }}>
                Enter the enforcer's information and assign a Smart Cap.
              </p>
            </div>

            {/* MODAL FORM BODY */}
            <form onSubmit={handleAddSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: '0 0 2px 0', color: '#033015', fontSize: '0.95rem', fontWeight: 900 }}>
                Personal Information
              </h3>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your Last Name, First Name and Middle Initial"
                  value={newEnforcer.fullName}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #033015',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={newEnforcer.email}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #033015',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '4px' }}>
                  Badge Number
                </label>
                <input
                  type="text"
                  placeholder="Enter your badge number"
                  value={newEnforcer.badgeNo}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, badgeNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #033015',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '4px' }}>
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={newEnforcer.contactNo}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, contactNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #033015',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '6px' }}>
                    Assigned Sector
                  </label>
                  <select
                    value={newEnforcer.sector}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, sector: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select sector ↓</option>
                    <option value="Sector 4 - Vicas Market">Sector 4</option>
                    <option value="Sector 5 - Almar, Zabarte">Sector 5</option>
                    <option value="Sector 6 - Zapote Road">Sector 6</option>
                  </select>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '6px' }}>
                    Smart Cap
                  </label>
                  <select
                    value={newEnforcer.capId}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, capId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select CAP ↓</option>
                    <option value="CAP 001">CAP 001</option>
                    <option value="CAP 002">CAP 002</option>
                    <option value="CAP 003">CAP 003</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#033015',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 32px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ADD
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#033015',
                    border: '2px solid #033015',
                    borderRadius: '9999px',
                    padding: '10px 32px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  CLEAR
                </button>
              </div>
            </form>

            <div style={{ height: '20px', backgroundColor: '#033015', width: '100%' }} />
          </div>
        </div>
      )}

    </div>
  );
}