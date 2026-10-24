import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  listEnforcers,
  createEnforcer,
  deleteEnforcer,
  forceLogoutEnforcer,
  resendEnforcerLogin,
  unlockEnforcer,
  listSectors,
  listCaps,
} from '../api';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  badgeNo: '',
  contactNo: '',
  sectorId: '',
  capCode: '',
};

// TURN ONE ENFORCER FROM THE BACKEND INTO ONE ROW OF THE TABLE.
// Vitals, battery and GPS show "—" until the cap sends real readings.
function toRow(enforcer, index) {
  const no = index + 1;
  return {
    id: enforcer.id,
    no,
    capId: enforcer.capCode || '—',
    filterTag: `Enforcer ${String(no).padStart(2, '0')}`,
    fullName: enforcer.fullName,
    email: enforcer.email,
    badgeNo: enforcer.badgeNo || '—',
    location: enforcer.sector || '—',
    isLocked: enforcer.isLocked,
    hasSetPassword: enforcer.hasSetPassword,
    tempPasswordExpired: enforcer.tempPasswordExpired,
    phoneRegistered: enforcer.phoneRegistered,
    heartRate: '—',
    temp: '—',
    battery: '—',
    lastSync: '—',
    connection: 'Offline',
    coords: '—',
    alertsCount: 0,
    mediaCount: 0,
  };
}

export default function MonitoringPage({ onTabChange, onLogout, onSessionEnded }) {
  // Always default to 'All' when arriving at or navigating back to Monitoring
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // REAL ENFORCERS, SECTORS AND CAPS FROM THE BACKEND
  const [enforcers, setEnforcers] = useState([]);
  const [maxEnforcers, setMaxEnforcers] = useState(3);
  const [sectors, setSectors] = useState([]);
  const [caps, setCaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // notice = message on the page: { type: 'success' | 'error', text }
  const [notice, setNotice] = useState(null);
  const [busyAction, setBusyAction] = useState('');

  // NEW ENFORCER FORM STATE
  const [newEnforcer, setNewEnforcer] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // A 401 ANSWER MEANS THE ADMIN LOGIN PASS ENDED: GO BACK TO LOGIN
  const handleApiError = (err, showError) => {
    if (err.status === 401 && onSessionEnded) {
      onSessionEnded('Your login ended. Please log in again.');
      return;
    }
    showError(err.message);
  };

  // LOAD (OR RELOAD) EVERYTHING THIS PAGE NEEDS
  const fetchAll = () => Promise.all([listEnforcers(), listSectors(), listCaps()]);

  const applyData = ([enforcerData, sectorData, capData]) => {
    setEnforcers(enforcerData.enforcers.map(toRow));
    setMaxEnforcers(enforcerData.maxEnforcers);
    setSectors(sectorData.sectors);
    setCaps(capData.caps);
  };

  const showLoadError = (err) => handleApiError(err, (text) => setNotice({ type: 'error', text }));

  const loadData = async () => {
    try {
      applyData(await fetchAll());
    } catch (err) {
      showLoadError(err);
    }
  };

  // FIRST LOAD WHEN THE PAGE OPENS
  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((data) => {
        if (!cancelled) applyData(data);
      })
      .catch((err) => {
        if (!cancelled) showLoadError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterTabs = ['All', ...enforcers.map((item) => item.filterTag)];

  // If the selected enforcer was deleted, fall back to the table
  const selectedEnforcerData = enforcers.find((item) => item.filterTag === activeFilter);
  const currentFilter = selectedEnforcerData ? activeFilter : 'All';

  const filteredEnforcers =
    currentFilter === 'All'
      ? enforcers
      : enforcers.filter((item) => item.filterTag === currentFilter);

  const isFull = enforcers.length >= maxEnforcers;

  // DELETE HANDLER (HIDES THE ACCOUNT; HISTORY IS KEPT, CAP IS FREED)
  const handleDelete = async (item) => {
    const sure = window.confirm(
      `Delete ${item.fullName}?\n\nThey will be logged out and can no longer log in. Their history is kept, and ${item.capId} becomes free.`
    );
    if (!sure) return;
    setBusyAction(`delete-${item.id}`);
    try {
      const result = await deleteEnforcer(item.id);
      setNotice({ type: 'success', text: result.message });
      setActiveFilter('All');
      await loadData();
    } catch (err) {
      handleApiError(err, (text) => setNotice({ type: 'error', text }));
    } finally {
      setBusyAction('');
    }
  };

  // FORCE LOGOUT / RESEND LOGIN / UNLOCK FOR ONE ENFORCER
  const runAction = async (item, action) => {
    const actions = {
      forceLogout: {
        call: forceLogoutEnforcer,
        confirm: `Force logout ${item.fullName}?\n\nTheir phone is logged out now. Next login needs password + email code.`,
      },
      resend: {
        call: resendEnforcerLogin,
        confirm: `Send ${item.fullName} a NEW temporary password?\n\nTheir current password stops working and their phone is logged out.`,
      },
      unlock: { call: unlockEnforcer, confirm: null },
    };
    const chosen = actions[action];
    if (chosen.confirm && !window.confirm(chosen.confirm)) return;
    setBusyAction(`${action}-${item.id}`);
    try {
      const result = await chosen.call(item.id);
      setNotice({ type: 'success', text: result.message });
      await loadData();
    } catch (err) {
      handleApiError(err, (text) => setNotice({ type: 'error', text }));
    } finally {
      setBusyAction('');
    }
  };

  // CLEAR FORM HANDLER
  const handleClearForm = () => {
    setNewEnforcer(EMPTY_FORM);
    setFormError('');
  };

  const openAddModal = () => {
    handleClearForm();
    setIsAddModalOpen(true);
  };

  // ADD ENFORCER HANDLER: THE BACKEND MAKES THE ACCOUNT AND EMAILS THE TEMPORARY PASSWORD
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newEnforcer.fullName.trim() || !newEnforcer.email.trim()) {
      setFormError('Full name and email are required.');
      return;
    }
    if (!newEnforcer.sectorId) {
      setFormError('Please select a sector.');
      return;
    }

    setFormError('');
    setIsSaving(true);
    try {
      const result = await createEnforcer({
        fullName: newEnforcer.fullName.trim(),
        email: newEnforcer.email.trim(),
        sectorId: Number(newEnforcer.sectorId),
        badgeNo: newEnforcer.badgeNo.trim(),
        contactNo: newEnforcer.contactNo.trim(),
        capCode: newEnforcer.capCode,
      });
      setNotice({ type: result.emailSent ? 'success' : 'error', text: result.message });
      handleClearForm();
      setIsAddModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, setFormError);
    } finally {
      setIsSaving(false);
    }
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
      <main className="monitoring-main" style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* PAGE TITLE */}
        <div className="monitoring-header" style={{ marginBottom: '24px' }}>
          <h1
            className="monitoring-title"
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
          <p className="monitoring-subtitle" style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
            Vitals, connection and health history
          </p>
        </div>

        {/* CONTROLS ROW: FILTER TABS + ADD ENFORCER BUTTON */}
        <div
          className="monitoring-controls"
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
          <div className="monitoring-filters" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {filterTabs.map((tab) => {
              const isActive = currentFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className="monitoring-filter-btn"
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
            onClick={openAddModal}
            disabled={isFull || isLoading}
            title={isFull ? `Only ${maxEnforcers} enforcer accounts are allowed. Delete one first.` : ''}
            className="monitoring-add-btn"
            style={{
              backgroundColor: isFull ? '#94a3b8' : '#033015',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 28px',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: isFull ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(3, 48, 21, 0.25)',
            }}
          >
            + Add Enforcer ({enforcers.length}/{maxEnforcers})
          </button>
        </div>

        {/* MESSAGE FROM THE LAST ACTION (SUCCESS OR ERROR) */}
        {notice && (
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${notice.type === 'error' ? '#fca5a5' : '#86efac'}`,
              color: notice.type === 'error' ? '#dc2626' : '#033015',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon={notice.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'} width="18" height="18" />
              {notice.text}
            </span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Close message"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 900 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* CONDITION 1: IF 'All' IS SELECTED -> SHOW TABLE */}
        {currentFilter === 'All' ? (
          <div
            className="monitoring-table-wrap"
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
              className="monitoring-table"
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
                      {isLoading ? 'Loading enforcers...' : 'No enforcers yet. Click "+ Add Enforcer" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredEnforcers.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: index !== filteredEnforcers.length - 1 ? '1px solid #033015' : 'none',
                      }}
                    >
                      <td data-label="No." style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.no}
                      </td>
                      <td data-label="CAP ID No." style={{ padding: '18px 16px', fontWeight: 900, color: '#033015', borderRight: '1px solid #033015' }}>
                        {item.capId}
                      </td>
                      <td
                        data-label="Email"
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
                      <td data-label="Badge No." style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.badgeNo}
                      </td>
                      <td data-label="Location" style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #033015' }}>
                        {item.location}
                      </td>
                      <td data-label="Action" style={{ padding: '18px 16px' }}>
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
                            onClick={() => handleDelete(item)}
                            disabled={busyAction === `delete-${item.id}`}
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
                            {busyAction === `delete-${item.id}` ? '...' : 'Delete'}
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
                    No readings yet · waiting for {selectedEnforcerData.capId} to connect · Sampled every 60s
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

            {/* CARD: ACCOUNT (ADMIN ACTIONS FOR THIS ENFORCER) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', color: '#033015', fontSize: '1.1rem', fontWeight: 900 }}>
                Account
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                {selectedEnforcerData.fullName} · {selectedEnforcerData.email}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>First login</span>
                  <span style={{ fontWeight: 800, color: selectedEnforcerData.tempPasswordExpired ? '#dc2626' : '#0f172a' }}>
                    {selectedEnforcerData.hasSetPassword
                      ? 'Done (own password set)'
                      : selectedEnforcerData.tempPasswordExpired
                        ? 'Temporary password expired: use Resend login'
                        : 'Waiting (temporary password sent)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Phone</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {selectedEnforcerData.phoneRegistered ? 'Logged in on a registered phone' : 'Not logged in'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Account</span>
                  <span
                    style={{
                      backgroundColor: selectedEnforcerData.isLocked ? '#fee2e2' : '#dcfce7',
                      color: selectedEnforcerData.isLocked ? '#dc2626' : '#15803d',
                      padding: '4px 16px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                    }}
                  >
                    {selectedEnforcerData.isLocked ? 'Locked (3 wrong passwords)' : 'Active'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
                {[
                  { action: 'forceLogout', label: 'Force logout', icon: 'lucide:log-out', show: selectedEnforcerData.phoneRegistered },
                  { action: 'resend', label: 'Resend login', icon: 'lucide:mail', show: true },
                  { action: 'unlock', label: 'Unlock', icon: 'lucide:unlock', show: selectedEnforcerData.isLocked },
                ]
                  .filter((b) => b.show)
                  .map((b) => (
                    <button
                      key={b.action}
                      type="button"
                      onClick={() => runAction(selectedEnforcerData, b.action)}
                      disabled={busyAction !== ''}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #033015',
                        borderRadius: '12px',
                        padding: '10px 18px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: '#033015',
                        cursor: busyAction ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Icon icon={b.icon} width="16" height="16" />
                      {busyAction === `${b.action}-${selectedEnforcerData.id}` ? 'Please wait...' : b.label}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => handleDelete(selectedEnforcerData)}
                  disabled={busyAction !== ''}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #dc2626',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    cursor: busyAction ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Icon icon="lucide:trash-2" width="16" height="16" />
                  Delete account
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
                Internet / LoRa switch events for {selectedEnforcerData.capId}
              </p>

              {/* REAL EVENTS COME WITH THE CAP CONNECTION STEP (connection_events TABLE) */}
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                No connection events yet. They appear here once the cap is paired and starts sending.
              </p>
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
            <form onSubmit={handleAddSubmit} noValidate style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: '0 0 2px 0', color: '#033015', fontSize: '0.95rem', fontWeight: 900 }}>
                Personal Information
              </h3>

              {/* ERROR FROM THE BACKEND (EXAMPLE: EMAIL ALREADY USED, MAX 3 REACHED) */}
              {formError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Icon icon="mdi:alert-circle" width="16" height="16" />
                  {formError}
                </div>
              )}

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
                    value={newEnforcer.sectorId}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, sectorId: e.target.value })}
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
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#033015', display: 'block', marginBottom: '6px' }}>
                    Smart Cap
                  </label>
                  <select
                    value={newEnforcer.capCode}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, capCode: e.target.value })}
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
                    <option value="">No cap yet</option>
                    {caps.map((c) => (
                      <option key={c.capCode} value={c.capCode} disabled={!!c.assignedTo}>
                        {c.assignedTo ? `${c.capCode} (taken)` : c.capCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#033015',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 32px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: isSaving ? 'wait' : 'pointer',
                  }}
                >
                  {isSaving ? 'ADDING...' : 'ADD'}
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