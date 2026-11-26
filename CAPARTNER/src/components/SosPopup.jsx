import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAlerts } from '../alertsWatcher';
import { formatTime } from '../format';

// FULL-SCREEN POP-UP FOR AN SOS THAT NOBODY HAS ACKNOWLEDGED YET (SHOWN ON EVERY PAGE)
export default function SosPopup({ onOpenAlerts }) {
  const watcher = useAlerts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sos = watcher?.activeSos;
  if (!sos) return null;

  const acknowledge = async () => {
    setBusy(true);
    const problem = await watcher.acknowledge(sos.id);
    setBusy(false);
    setError(problem);
  };

  const place =
    sos.locationText ||
    (sos.latitude !== null ? `${sos.latitude.toFixed(5)}, ${sos.longitude.toFixed(5)}` : 'Location not sent');

  return (
    <div
      role="alertdialog"
      aria-label="SOS alert"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 18, 22, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          background: '#ef4b4b',
          borderRadius: '20px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.38)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: '#ffffff', fontWeight: 800, letterSpacing: '0.02em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block' }} />
            <span>SOS ALERT · #{sos.id}</span>
          </div>
          <span style={{ opacity: 0.9, fontSize: '0.78rem' }}>{formatTime(sos.occurredAt)}</span>
        </div>

        <div style={{ background: '#081d2e', padding: '22px 20px 18px', color: '#ffffff' }}>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '4px' }}>
            {sos.enforcer?.fullName || 'Unknown enforcer'}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
            {sos.capCode || 'No cap'} · {sos.origin === 'cap_button' ? `Cap button${sos.sosHoldSeconds ? ` held ${sos.sosHoldSeconds}s` : ''}` : 'Phone app SOS button'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dfeaf0', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 600 }}>
            <span style={{ color: '#f87171' }}>◉</span>
            <span>{place}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                <Icon icon="mdi:heart-pulse" width="16" height="16" style={{ color: '#f87171' }} />
                Heart rate
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                {sos.heartRateBpm ?? '—'} <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>BPM</span>
              </div>
            </div>
            <div style={{ background: 'rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                <Icon icon="fluent:temperature-24-filled" width="16" height="16" style={{ color: '#fbbf24' }} />
                Temperature
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                {sos.bodyTempC ?? '—'} <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>°C</span>
              </div>
            </div>
          </div>

          {watcher.sirenOn && !watcher.soundReady && (
            <div style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 700, marginBottom: '12px' }}>
              Click anywhere on the page once to allow the siren sound.
            </div>
          )}
          {error && (
            <div role="alert" style={{ fontSize: '0.8rem', color: '#fecaca', fontWeight: 700, marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={acknowledge}
            disabled={busy}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '14px',
              padding: '16px 18px',
              background: '#ef4b4b',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              cursor: busy ? 'wait' : 'pointer',
              marginBottom: '10px',
            }}
          >
            {busy ? 'Acknowledging...' : 'Acknowledge alert'}
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                watcher.mute(sos.id);
                onOpenAlerts?.();
              }}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '12px', background: 'transparent', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
            >
              Open Alerts page
            </button>
            <button
              type="button"
              onClick={() => watcher.mute(sos.id)}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '12px', background: 'transparent', color: '#cbd5e1', fontWeight: 700, cursor: 'pointer' }}
            >
              Hide and mute (stays unacknowledged)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
