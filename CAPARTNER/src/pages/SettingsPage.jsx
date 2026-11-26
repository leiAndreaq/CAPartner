import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { getSettings, saveSettings, savePreferences, loadSession } from '../api';
import { useAlerts } from '../alertsWatcher';
import { formatDateTime } from '../format';
import './SettingsPage.css';

const logOutIcon = new URL('../assets/auth/log-out.svg', import.meta.url).href;

// The system limits, grouped as they appear on the form. The allowed ranges come from the backend
// (the same CHECK rules as database/schema.sql).
const SETTING_GROUPS = [
  {
    title: 'Vital-sign alert limits',
    note: 'The phones fetch these on their next sync and raise a health alert when a reading goes over.',
    keys: ['heart_rate_max_bpm', 'body_temp_max_c', 'low_battery_threshold_pct'],
  },
  {
    title: 'Login security',
    note: 'Applies to admins and enforcers.',
    keys: ['max_failed_logins', 'otp_valid_minutes', 'temp_password_valid_hours'],
  },
  {
    title: 'Accounts',
    note: 'Cannot be set lower than the number of active enforcers.',
    keys: ['max_enforcers'],
  },
];

const PREFERENCE_ROWS = [
  { key: 'audibleSiren', title: 'Audible SOS siren', note: 'Repeats until the SOS is acknowledged' },
  { key: 'desktopNotifications', title: 'Desktop notifications', note: 'A system notification for each new SOS' },
  { key: 'loraFallbackAlerts', title: 'LoRa fallback alerts', note: 'When a cap loses internet' },
  { key: 'lowBatteryWarnings', title: 'Low battery warnings', note: 'Below the low battery limit' },
  { key: 'gpsSync', title: 'GPS sync', note: 'Show cap positions on the map' },
];

export default function SettingsPage({ onTabChange, onLogout, onSessionEnded }) {
  const watcher = useAlerts();
  const admin = loadSession()?.admin;
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [prefBusy, setPrefBusy] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleError = (err) => {
    if (err.status === 401 && onSessionEnded) {
      onSessionEnded('Your login ended. Please log in again.');
      return;
    }
    setNotice({ type: 'error', text: err.message });
  };

  const applySettings = (data) => {
    setSettings(data);
    setForm(Object.fromEntries(Object.entries(data.values).map(([k, v]) => [k, String(v)])));
    setFieldErrors({});
  };

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((data) => !cancelled && applySettings(data))
      .catch((err) => !cancelled && handleError(err));
    watcher?.reloadPreferences();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SAME LIMITS AS THE DATABASE, CHECKED BEFORE SENDING
  const validate = (key, text) => {
    const rule = settings.rules[key];
    const value = Number(text);
    if (text.trim() === '' || !Number.isFinite(value)) return 'Enter a number.';
    if (!rule.decimals && !Number.isInteger(value)) return 'Enter a whole number.';
    if (rule.decimals && Math.abs(Math.round(value * 10) - value * 10) > 1e-9) return 'Use at most 1 decimal.';
    if (value < rule.min || value > rule.max) return `Must be from ${rule.min} to ${rule.max}.`;
    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    const changes = {};
    for (const key of Object.keys(settings.rules)) {
      const problem = validate(key, form[key] ?? '');
      if (problem) errors[key] = problem;
      else if (Number(form[key]) !== settings.values[key]) changes[key] = Number(form[key]);
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice({ type: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }
    if (Object.keys(changes).length === 0) {
      setNotice({ type: 'success', text: 'Nothing changed.' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveSettings(changes);
      applySettings(result);
      setNotice({ type: 'success', text: `${result.message} The phones get the new limits on their next sync.` });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = async (key) => {
    const current = watcher?.preferences;
    if (!current) return;
    setPrefBusy(key);
    try {
      const result = await savePreferences({ [key]: !current[key] });
      watcher.setPreferences(result);
    } catch (err) {
      handleError(err);
    } finally {
      setPrefBusy('');
    }
  };

  const renderSwitch = (enabled, onToggle, disabled) => (
    <button
      type="button"
      className={`set-switch${enabled ? ' is-on' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={enabled ? 'Enabled' : 'Disabled'}
    >
      <span />
    </button>
  );

  return (
    <div className="ui-page set-page">
      <style>{`
        html { scroll-behavior: smooth; overflow-y: scroll; scrollbar-gutter: stable; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(3, 48, 21, 0.25); border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(3, 48, 21, 0.7); }
        * { scrollbar-width: thin; scrollbar-color: rgba(3, 48, 21, 0.3) transparent; }
      `}</style>

      <Navbar activeTab="Settings" onTabChange={onTabChange} onLogout={onLogout} />

      <main className="settings-main ui-main">
        <div className="ui-page-header">
          <div>
            <h1 className="ui-title">Settings</h1>
            <p className="ui-subtitle">Admin profile and notification preferences</p>
          </div>
        </div>

        {notice && (
          <div role={notice.type === 'error' ? 'alert' : 'status'} className={`ui-message ui-message-${notice.type === 'error' ? 'error' : 'success'}`}>
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Close message" className="set-close">✕</button>
          </div>
        )}

        <div className="settings-grid set-grid">
          {/* LEFT: SYSTEM LIMITS (app_settings) */}
          <div className="set-dark">
            <h2>System limits</h2>
            <p className="set-dark-note">
              {settings?.updatedBy ? `Last changed by ${settings.updatedBy}, ${formatDateTime(settings.updatedAt)}` : 'Shared by every admin.'}
            </p>

            {!settings ? (
              <p className="set-dark-note">Loading...</p>
            ) : (
              <form onSubmit={handleSave} noValidate>
                {SETTING_GROUPS.map((group) => (
                  <fieldset key={group.title}>
                    <legend>{group.title}</legend>
                    <p className="set-dark-note">{group.note}</p>
                    {group.keys.map((key) => {
                      const rule = settings.rules[key];
                      return (
                        <div key={key} className="set-field">
                          <label htmlFor={key}>
                            {rule.label} <span>({rule.min}–{rule.max})</span>
                          </label>
                          <input
                            id={key}
                            type="number"
                            inputMode="decimal"
                            min={rule.min}
                            max={rule.max}
                            step={rule.decimals ? 0.1 : 1}
                            value={form[key] ?? ''}
                            onChange={(e) => {
                              setForm({ ...form, [key]: e.target.value });
                              if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: validate(key, e.target.value) });
                            }}
                            aria-invalid={Boolean(fieldErrors[key])}
                          />
                          {fieldErrors[key] && <div className="set-field-error">{fieldErrors[key]}</div>}
                        </div>
                      );
                    })}
                  </fieldset>
                ))}

                <div className="set-save">
                  <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save limits'}</button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT: PREFERENCES, PROFILE, END SESSION */}
          <div className="settings-stack set-stack">
            <div className="set-card">
              <div className="set-card-head">
                <h2>Notifications</h2>
              </div>
              <p className="set-card-note">Only for your account. Saved right away.</p>
              {!watcher?.preferences ? (
                <p className="set-card-note">Loading...</p>
              ) : (
                PREFERENCE_ROWS.map((row) => (
                  <div key={row.key} className="set-pref">
                    <div>
                      <b>{row.title}</b>
                      <span>{row.note}</span>
                    </div>
                    {renderSwitch(watcher.preferences[row.key], () => togglePreference(row.key), prefBusy !== '')}
                  </div>
                ))
              )}
            </div>

            <div className="set-card">
              <div className="set-card-head">
                <h2>Admin profile</h2>
              </div>
              <div className="set-profile">
                <div><span>Name</span><b>{admin?.fullName || '—'}</b></div>
                <div><span>Email</span><b>{admin?.email || '—'}</b></div>
              </div>
            </div>

            <div className="set-card set-session">
              <h2>End Session</h2>
              <p>Are you sure you want to end your current admin session?</p>
              <button type="button" onClick={() => setShowLogoutModal(true)}>
                <img src={logOutIcon} alt="" width="16" height="16" />
                Log out
              </button>
              <small>You will need to log in again to access the admin dashboard.</small>
            </div>
          </div>
        </div>
      </main>


      {showLogoutModal && (
        <ConfirmDialog
          title="Are you sure?"
          text="Are you sure you want to LOG OUT?"
          yesLabel="Log Out"
          noLabel="CANCEL"
          onYes={() => {
            setShowLogoutModal(false);
            if (onLogout) onLogout();
          }}
          onNo={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
