import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import VitalsPanel from '../components/VitalsPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  assignCap,
  listEnforcers,
  createEnforcer,
  deleteEnforcer,
  forceLogoutEnforcer,
  resendEnforcerLogin,
  unlockEnforcer,
  listSectors,
  listCaps,
} from '../api';
import './MonitoringPage.css';

const modalClose = new URL('../assets/monitoring/modal-close.png', import.meta.url).href;

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

export default function MonitoringPage({ onTabChange, onLogout, onSessionEnded, focusEnforcerId }) {
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
  // confirm = the "Are you sure?" pop-up: { kind: 'delete' | 'add' | 'clear', item? }
  const [confirm, setConfirm] = useState(null);

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
        if (cancelled) return;
        applyData(data);
        // Opened from the Overview or an alert: go straight to that enforcer.
        const index = data[0].enforcers.findIndex((e) => e.id === focusEnforcerId);
        if (index >= 0) setActiveFilter(toRow(data[0].enforcers[index], index).filterTag);
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
  const handleDelete = (item) => setConfirm({ kind: 'delete', item });

  const performDelete = async (item) => {
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

  // ASSIGN OR REMOVE THE CAP (THE PHONE SHOWS THE CAP THE ADMIN ASSIGNED)
  const handleAssignCap = async (item, capCode) => {
    const sure = window.confirm(
      capCode
        ? `Assign ${capCode} to ${item.fullName}?\n\nTheir phone will show ${capCode} and send readings under it.`
        : `Remove ${item.capId} from ${item.fullName}?\n\nTheir phone cannot send readings until a cap is assigned again.`
    );
    if (!sure) return;
    setBusyAction(`cap-${item.id}`);
    try {
      const result = await assignCap(item.id, capCode || null);
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
  const handleAddSubmit = (e) => {
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
    setConfirm({ kind: 'add' });
  };

  const performAdd = async () => {
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

  // WORDS FOR THE "ARE YOU SURE?" POP-UPS (delete, add and clear)
  const confirmCopy = {
    delete: {
      title: 'Do you want to DELETE?',
      text: confirm?.item
        ? `Are you sure you want to delete this account? ${confirm.item.fullName} will be logged out and can no longer log in. Their history is kept, and ${confirm.item.capId} becomes free.`
        : '',
      yes: 'Delete',
      no: 'Cancel',
    },
    add: { title: 'Are you sure?', text: 'Are you sure you want to ADD this account?', yes: 'ADD', no: 'CANCEL' },
    clear: { title: 'Are you sure?', text: 'Are you sure you want to CLEAR the form?', yes: 'CLEAR', no: 'CANCEL' },
  };

  const runConfirm = () => {
    const chosen = confirm;
    setConfirm(null);
    if (chosen.kind === 'delete') performDelete(chosen.item);
    if (chosen.kind === 'add') performAdd();
    if (chosen.kind === 'clear') handleClearForm();
  };

  return (
    <div className="ui-page mon-page">
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
      <main className="monitoring-main ui-main">
        {/* PAGE TITLE */}
        <div className="monitoring-header">
          <h1 className="monitoring-title">Enforcer Monitoring</h1>
          <p className="monitoring-subtitle">Vitals, connection and health history</p>
          <p className="monitoring-summary">
            <span><b>{enforcers.length}</b> of {maxEnforcers} enforcer accounts</span>
            <span><b>{enforcers.filter((e) => e.phoneRegistered).length}</b> signed in on a phone</span>
            {enforcers.some((e) => e.isLocked) && (
              <span className="is-bad"><b>{enforcers.filter((e) => e.isLocked).length}</b> locked</span>
            )}
          </p>
        </div>

        {/* CONTROLS ROW: FILTER TABS + ADD ENFORCER BUTTON */}
        <div className="monitoring-controls">
          <div className="monitoring-filters">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`monitoring-filter-btn${currentFilter === tab ? ' is-active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={isFull || isLoading}
            title={isFull ? `Only ${maxEnforcers} enforcer accounts are allowed. Delete one first.` : ''}
            className="monitoring-add-btn"
          >
            + Add Enforcer ({enforcers.length}/{maxEnforcers})
          </button>
        </div>

        {/* MESSAGE FROM THE LAST ACTION (SUCCESS OR ERROR) */}
        {notice && (
          <div role={notice.type === 'error' ? 'alert' : 'status'} className={`ui-message ui-message-${notice.type === 'error' ? 'error' : 'success'}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon={notice.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'} width="18" height="18" />
              {notice.text}
            </span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Close message" className="mon-close-text">
              ✕
            </button>
          </div>
        )}

        {/* CONDITION 1: IF 'All' IS SELECTED -> SHOW TABLE */}
        {currentFilter === 'All' ? (
          <div className="monitoring-table-wrap">
            <table className="monitoring-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>No.</th>
                  <th style={{ width: '180px' }}>Enforcer</th>
                  <th style={{ width: '110px' }}>CAP ID No.</th>
                  <th style={{ width: '230px' }}>Email</th>
                  <th style={{ width: '140px' }}>Badge No.</th>
                  <th style={{ width: '170px' }}>Location</th>
                  <th style={{ width: '140px' }}>Status</th>
                  <th style={{ width: '170px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnforcers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="mon-empty">
                      {isLoading ? 'Loading enforcers...' : 'No enforcers yet. Click "+ Add Enforcer" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredEnforcers.map((item) => (
                    <tr key={item.id}>
                      <td data-label="No." className="mon-strong">{item.no}</td>
                      <td data-label="Enforcer" className="mon-name">
<div className="mon-name-inner">
                        <span className="mon-avatar" aria-hidden="true">
                          {item.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')}
                        </span>
                        <span>{item.fullName}</span>
                        </div>
                      </td>
                      <td data-label="CAP ID No." className="mon-strong">{item.capId}</td>
                      <td data-label="Email" title={item.email} className="mon-email">
                        {item.email}
                      </td>
                      <td data-label="Badge No.">{item.badgeNo}</td>
                      <td data-label="Location">{item.location}</td>
                      <td data-label="Status">
                        <span
                          className={`mon-status ${
                            item.isLocked ? 'is-red' : item.phoneRegistered ? 'is-green' : 'is-grey'
                          }`}
                        >
                          {item.isLocked ? 'Locked' : item.phoneRegistered ? 'Signed in' : item.hasSetPassword ? 'Signed out' : 'Invite sent'}
                        </span>
                      </td>
                      <td data-label="Action">
                        <div className="mon-actions">
                          <button type="button" className="mon-pill mon-pill-solid" onClick={() => setActiveFilter(item.filterTag)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="mon-pill mon-pill-outline"
                            onClick={() => handleDelete(item)}
                            disabled={busyAction === `delete-${item.id}`}
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
          <div className="mon-detail">
            {/* VITALS, UNIT STATUS AND LOCATION (REAL READINGS) */}
            <VitalsPanel key={selectedEnforcerData.id} enforcerId={selectedEnforcerData.id} onSessionEnded={onSessionEnded} onTabChange={onTabChange} />

            {/* CARD: ACCOUNT (ADMIN ACTIONS FOR THIS ENFORCER) */}
            <div className="mon-card">
              <h3>Account</h3>
              <p className="mon-card-sub">
                {selectedEnforcerData.fullName} · {selectedEnforcerData.email}
              </p>

              <div className="mon-facts">
                <div>
                  <span>First login</span>
                  <b className={selectedEnforcerData.tempPasswordExpired ? 'mon-bad' : ''}>
                    {selectedEnforcerData.hasSetPassword
                      ? 'Done (own password set)'
                      : selectedEnforcerData.tempPasswordExpired
                        ? 'Temporary password expired: use Resend login'
                        : 'Waiting (temporary password sent)'}
                  </b>
                </div>
                <div>
                  <span>Phone</span>
                  <b>{selectedEnforcerData.phoneRegistered ? 'Logged in on a registered phone' : 'Not logged in'}</b>
                </div>
                <div>
                  <span>Account</span>
                  <b className={`mon-tag ${selectedEnforcerData.isLocked ? 'mon-tag-red' : 'mon-tag-green'}`}>
                    {selectedEnforcerData.isLocked ? 'Locked (3 wrong passwords)' : 'Active'}
                  </b>
                </div>
                <div>
                  <label htmlFor="assign-cap">Smart Cap</label>
                  <select
                    id="assign-cap"
                    className="mon-select-small"
                    value={selectedEnforcerData.capId === '—' ? '' : selectedEnforcerData.capId}
                    disabled={busyAction !== ''}
                    onChange={(e) => handleAssignCap(selectedEnforcerData, e.target.value)}
                  >
                    <option value="">No cap</option>
                    {caps.map((c) => {
                      const takenByOther = c.assignedTo && c.capCode !== selectedEnforcerData.capId;
                      return (
                        <option key={c.capCode} value={c.capCode} disabled={Boolean(takenByOther)}>
                          {takenByOther ? `${c.capCode} (${c.assignedTo})` : c.capCode}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="mon-buttons">
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
                      className="mon-button"
                      onClick={() => runAction(selectedEnforcerData, b.action)}
                      disabled={busyAction !== ''}
                    >
                      <Icon icon={b.icon} width="16" height="16" />
                      {busyAction === `${b.action}-${selectedEnforcerData.id}` ? 'Please wait...' : b.label}
                    </button>
                  ))}
                <button
                  type="button"
                  className="mon-button mon-button-danger"
                  onClick={() => handleDelete(selectedEnforcerData)}
                  disabled={busyAction !== ''}
                >
                  <Icon icon="lucide:trash-2" width="16" height="16" />
                  Delete account
                </button>
              </div>
            </div>

            {/* CARD 4: CONNECTION HISTORY */}
            <div className="mon-card">
              <h3>Connection history</h3>
              <p className="mon-card-sub">Internet / LoRa switch events for {selectedEnforcerData.capId}</p>
              {/* REAL EVENTS COME WITH THE CAP CONNECTION STEP (connection_events TABLE) */}
              <p className="mon-muted">No connection events yet. They appear here once the cap is paired and starts sending.</p>
            </div>
          </div>
        )}
      </main>


      {/* ADD NEW ENFORCER MODAL FORM */}
      {isAddModalOpen && (
        <div className="mon-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="mon-modal" role="dialog" aria-labelledby="add-enforcer-title" onClick={(e) => e.stopPropagation()}>
            <div className="mon-modal-head">
              <button type="button" className="mon-modal-close" onClick={() => setIsAddModalOpen(false)} aria-label="Close">
                <img src={modalClose} alt="" />
              </button>
              <h2 id="add-enforcer-title">Add New Enforcer</h2>
              <p>Enter the enforcer's information and assign a Smart Cap.</p>
            </div>

            <form onSubmit={handleAddSubmit} noValidate className="mon-form">
              <h3>Personal Information</h3>

              {/* ERROR FROM THE BACKEND (EXAMPLE: EMAIL ALREADY USED, MAX 3 REACHED) */}
              {formError && (
                <div role="alert" className="mon-form-error">
                  <Icon icon="mdi:alert-circle" width="16" height="16" />
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="enf-name">Full Name</label>
                <input
                  id="enf-name"
                  type="text"
                  placeholder="Enter your Last Name, First Name and Middle Initial"
                  value={newEnforcer.fullName}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, fullName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="enf-email">Email Address</label>
                <input
                  id="enf-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={newEnforcer.email}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="enf-badge">Badge Number</label>
                <input
                  id="enf-badge"
                  type="text"
                  placeholder="Enter your badge number"
                  value={newEnforcer.badgeNo}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, badgeNo: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="enf-contact">Contact Number (Optional)</label>
                <input
                  id="enf-contact"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={newEnforcer.contactNo}
                  onChange={(e) => setNewEnforcer({ ...newEnforcer, contactNo: e.target.value })}
                />
              </div>

              <div className="mon-form-pair">
                <div>
                  <label htmlFor="enf-sector">Assigned Sector</label>
                  <select
                    id="enf-sector"
                    value={newEnforcer.sectorId}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, sectorId: e.target.value })}
                  >
                    <option value="">Select sector ↓</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enf-cap">Smart Cap</label>
                  <select
                    id="enf-cap"
                    value={newEnforcer.capCode}
                    onChange={(e) => setNewEnforcer({ ...newEnforcer, capCode: e.target.value })}
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

              <div className="mon-form-buttons">
                <button type="submit" className="mon-pill-large mon-pill-solid" disabled={isSaving}>
                  {isSaving ? 'ADDING...' : 'ADD'}
                </button>
                <button type="button" className="mon-pill-large mon-pill-outline" onClick={() => setConfirm({ kind: 'clear' })}>
                  CLEAR
                </button>
              </div>
            </form>

            <div className="mon-modal-foot" />
          </div>
        </div>
      )}

      {/* "ARE YOU SURE?" POP-UP */}
      {confirm && (
        <ConfirmDialog
          title={confirmCopy[confirm.kind].title}
          text={confirmCopy[confirm.kind].text}
          yesLabel={confirmCopy[confirm.kind].yes}
          noLabel={confirmCopy[confirm.kind].no}
          onYes={runConfirm}
          onNo={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
