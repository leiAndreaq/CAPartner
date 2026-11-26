import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import { listAlerts } from '../api';
import { useAlerts } from '../alertsWatcher';
import { ALERT_STATUS_LABELS, ALERT_TYPE_LABELS, alertTone, formatDateTime, statusTone } from '../format';

const STATUS_FILTERS = [
  { label: 'Open', value: 'open' },
  { label: 'New', value: 'new' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: '' },
];
const TYPE_FILTERS = [
  { label: 'All types', value: '' },
  { label: 'SOS', value: 'sos' },
  { label: 'Health', value: 'health' },
  { label: 'Connection', value: 'connection' },
  { label: 'Device', value: 'device' },
  { label: 'Camera', value: 'camera' },
];
const POLL_MS = 5000;

function chip(active) {
  return {
    backgroundColor: active ? '#033015' : '#e2e8f0',
    color: active ? '#ffffff' : '#334155',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 18px',
    fontWeight: 800,
    fontSize: '0.82rem',
    cursor: 'pointer',
  };
}

function actionButton(color, filled) {
  return {
    backgroundColor: filled ? color : '#ffffff',
    color: filled ? '#ffffff' : color,
    border: `1.5px solid ${color}`,
    borderRadius: '9999px',
    padding: '7px 16px',
    fontWeight: 800,
    fontSize: '0.78rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };
}

// ALERTS PAGE: every alert from the phones, newest first, with the admin's actions.
export default function AlertsPage({ onTabChange, onLogout, onSessionEnded, onOpenEnforcer }) {
  const watcher = useAlerts();
  const [status, setStatus] = useState('open');
  const [type, setType] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState('');

  const handleError = useCallback(
    (err) => {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      setNotice({ type: 'error', text: err.message });
    },
    [onSessionEnded]
  );

  const load = useCallback(async () => {
    try {
      const data = await listAlerts({ status, type, limit: 200 });
      setAlerts(data.alerts);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [status, type, handleError]);

  // LOAD NOW, THEN EVERY FEW SECONDS SO NEW ALERTS APPEAR WITHOUT RELOADING
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled) load();
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const act = async (alert, action, label) => {
    setBusy(`${action}-${alert.id}`);
    const problem = await watcher[action](alert.id);
    setBusy('');
    setNotice(problem ? { type: 'error', text: problem } : { type: 'success', text: `${label}: alert #${alert.id}.` });
    await load();
  };

  const summary = watcher?.summary || { open: 0, unacknowledged: 0, unread: 0 };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      <Navbar activeTab="Alerts" onTabChange={onTabChange} onLogout={onLogout} />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#033015', fontSize: '2.5rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>Alerts</h1>
          <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
            SOS and health alerts from the enforcers. Updates every 5 seconds.
          </p>
        </div>

        {/* SUMMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Open alerts', value: summary.open, color: '#033015' },
            { label: 'Waiting for acknowledgement', value: summary.unacknowledged, color: '#dc2626' },
            { label: 'Unread by you', value: summary.unread, color: '#b45309' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: '#053D1C', borderRadius: '18px', padding: '18px 20px', color: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color === '#033015' ? '#ffffff' : s.color === '#dc2626' ? '#fca5a5' : '#fde68a' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((f) => (
              <button key={f.label} type="button" onClick={() => setStatus(f.value)} style={chip(status === f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by type"
            style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #033015', fontWeight: 700, color: '#033015', backgroundColor: '#ffffff' }}
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {notice && (
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${notice.type === 'error' ? '#fca5a5' : '#86efac'}`,
              color: notice.type === 'error' ? '#dc2626' : '#033015',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Close message" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 900 }}>✕</button>
          </div>
        )}

        {/* LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {alerts.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 600, border: '1.5px dashed #cbd5e1', borderRadius: '18px' }}>
              {isLoading ? 'Loading alerts...' : 'No alerts here.'}
            </div>
          )}

          {alerts.map((a) => {
            const tone = alertTone(a.type);
            const st = statusTone(a.status);
            const hasPosition = a.latitude !== null && a.longitude !== null;
            return (
              <div
                key={a.id}
                style={{
                  border: `1.5px solid ${a.type === 'sos' && a.status === 'new' ? '#ef4444' : '#e2e8f0'}`,
                  borderLeft: `6px solid ${tone.tone}`,
                  borderRadius: '18px',
                  padding: '18px 20px',
                  backgroundColor: a.isRead ? '#ffffff' : '#fffbeb',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: tone.badgeBg, color: tone.badgeText, borderRadius: '8px', padding: '4px 10px', fontWeight: 900, fontSize: '0.75rem' }}>
                      {ALERT_TYPE_LABELS[a.type]}
                    </span>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{a.title}</span>
                    {!a.isRead && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309' }}>● Unread</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>#{a.id} · {formatDateTime(a.occurredAt)}</span>
                    <span style={{ backgroundColor: st.bg, color: st.text, borderRadius: '9999px', padding: '4px 12px', fontWeight: 800, fontSize: '0.72rem' }}>
                      {ALERT_STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem', color: '#334155', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>ENFORCER</div>
                    <div style={{ fontWeight: 800 }}>{a.enforcer?.fullName || '—'}{a.capCode ? ` · ${a.capCode}` : ''}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>LOCATION</div>
                    <div style={{ fontWeight: 700 }}>
                      {a.locationText || (hasPosition ? `${a.latitude.toFixed(5)}, ${a.longitude.toFixed(5)}` : 'Not sent')}
                      {hasPosition && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=18/${a.latitude}/${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginLeft: '8px', color: '#16a34a', fontWeight: 800 }}
                        >
                          Map ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>VITALS</div>
                    <div style={{ fontWeight: 700 }}>
                      {a.heartRateBpm ?? '—'} BPM · {a.bodyTempC ?? '—'} °C
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>HANDLED</div>
                    <div style={{ fontWeight: 700 }}>
                      {a.acknowledgedBy ? `Ack by ${a.acknowledgedBy}, ${formatDateTime(a.acknowledgedAt)}` : 'Not acknowledged'}
                      {a.responderDispatched && <div style={{ color: '#15803d' }}>Responder dispatched {formatDateTime(a.responderDispatchedAt)}</div>}
                    </div>
                  </div>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#475569' }}>{a.detail}</p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {a.status === 'new' && (
                    <button type="button" disabled={busy !== ''} onClick={() => act(a, 'acknowledge', 'Acknowledged')} style={actionButton('#dc2626', true)}>
                      <Icon icon="lucide:check" width="16" /> Acknowledge
                    </button>
                  )}
                  {!a.responderDispatched && a.status !== 'resolved' && (
                    <button type="button" disabled={busy !== ''} onClick={() => act(a, 'dispatch', 'Responder dispatched')} style={actionButton('#b45309', false)}>
                      <Icon icon="lucide:ambulance" width="16" /> Responder dispatched
                    </button>
                  )}
                  {a.status !== 'resolved' && (
                    <button type="button" disabled={busy !== ''} onClick={() => act(a, 'resolve', 'Resolved')} style={actionButton('#033015', false)}>
                      <Icon icon="lucide:circle-check-big" width="16" /> Resolve
                    </button>
                  )}
                  {!a.isRead && (
                    <button type="button" disabled={busy !== ''} onClick={() => act(a, 'markRead', 'Marked as read')} style={actionButton('#64748b', false)}>
                      Mark as read
                    </button>
                  )}
                  {a.enforcer && onOpenEnforcer && (
                    <button type="button" onClick={() => onOpenEnforcer(a.enforcer.id)} style={actionButton('#16a34a', false)}>
                      View enforcer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

    </div>
  );
}
