import { useMemo } from 'react';
import { Icon } from '@iconify/react';

const tabs = ['Overview', 'Monitoring', 'Camera', 'Activity Log', 'Settings'];

function StatCard({ label, value, accent = '#16a34a' }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '12px 10px',
        minHeight: '86px',
      }}
    >
      <div style={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700, marginBottom: '8px' }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ color: accent }}>{value}</span>
      </div>
    </div>
  );
}

export default function MobileDashboardPage({ currentStep = 'overview', onTabChange, onLogout }) {
  const activeTab = useMemo(() => {
    if (currentStep === 'overview') return 'Overview';
    if (currentStep === 'monitoring') return 'Monitoring';
    if (currentStep === 'camera') return 'Camera';
    if (currentStep === 'activityLog') return 'Activity Log';
    if (currentStep === 'settings') return 'Settings';
    return 'Overview';
  }, [currentStep]);

  const renderOverview = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <StatCard label="Heart rate" value="132 BPM" accent="#ef4444" />
        <StatCard label="Temp" value="36.7°C" accent="#f59e0b" />
        <StatCard label="Motion" value="Moving" accent="#22c55e" />
        <StatCard label="Sector" value="1" accent="#0369a1" />
      </div>

      <div style={{ background: '#053D1C', borderRadius: '18px', padding: '14px 12px', color: '#fff', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 700 }}>Enforcer 02</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>L. Barcelona</div>
          </div>
          <span
            style={{
              background: 'rgba(234,179,8,0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(234,179,8,0.4)',
              fontSize: '0.62rem',
              fontWeight: 800,
              borderRadius: '999px',
              padding: '4px 8px',
            }}
          >
            • Attention
          </span>
        </div>

        <div style={{ height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(148,163,184,.08)), url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(0.18) contrast(1.04)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: '#0b1f13',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 800,
              borderRadius: '999px',
              padding: '6px 8px',
            }}
          >
            Expand map
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ background: '#053D1C', color: '#fff', padding: '12px 14px', fontWeight: 800, fontSize: '0.88rem' }}>Recent alerts</div>
        <div style={{ padding: '10px 12px' }}>
          {[
            ['Battery low', 'CAP-02 - 18% battery'],
            ['Connection switched', 'LoRa fallback active'],
            ['SOS on hold', 'Manual SOS reported'],
          ].map(([title, desc], index) => (
            <div key={title} style={{ display: 'flex', gap: '8px', padding: '10px 0', borderBottom: index < 2 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', marginTop: '5px' }} />
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderMonitoring = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {['Enforcer 01', 'Enforcer 02', 'Enforcer 03'].map((item, index) => (
        <div key={item} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{item}</strong>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: index === 1 ? '#f59e0b' : '#16a34a', background: index === 1 ? '#fef3c7' : '#dcfce7', borderRadius: '999px', padding: '4px 7px' }}>
              {index === 1 ? 'Attention' : 'Normal'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.68rem', color: '#475569' }}>
            <div>Temp: 36.7°C</div>
            <div>Pulse: 132 BPM</div>
            <div>Motion: Moving</div>
            <div>Signal: Online</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCamera = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {['CAP-A17', 'CAP-B04', 'CAP-C22'].map((unit, index) => (
        <div key={unit} style={{ background: '#0f172a', borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{ height: '120px', background: index === 2 ? '#1e293b' : 'linear-gradient(135deg, #111827, #0f172a)', position: 'relative' }}>
            {index !== 2 && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(148,163,184,.03))' }} />}
            <div style={{ position: 'absolute', inset: '10px auto auto 10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: index === 2 ? '#ef4444' : '#22c55e' }} />
              {index === 2 ? 'OFFLINE' : 'LIVE'}
            </div>
          </div>
          <div style={{ padding: '10px 12px', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>{unit}</div>
        </div>
      ))}
    </div>
  );

  const renderActivity = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[
        ['Admin sign-in', 'PSSg. Milo Reyes', '20:07:02'],
        ['Auto sign-out', 'PSSg. Milo Reyes', '19:56:59'],
        ['Admin sign-in', 'PSSg. Milo Reyes', '19:44:55'],
      ].map(([title, user, time]) => (
        <div key={`${title}-${time}`} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>{title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.68rem', color: '#64748b' }}>
            <span>{user}</span>
            <span>{time}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[
        ['GPS sync', 'Enabled'],
        ['Notification sound', 'On'],
        ['Auto sign-out', '15 minutes'],
      ].map(([label, value]) => (
        <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{label}</span>
          <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 800 }}>{value}</span>
        </div>
      ))}
    </div>
  );

  const contentMap = {
    Overview: renderOverview(),
    Monitoring: renderMonitoring(),
    Camera: renderCamera(),
    'Activity Log': renderActivity(),
    Settings: renderSettings(),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #4f52d6 0%, #7572df 100%)', padding: '18px 12px 28px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', background: '#0b1220', borderRadius: '22px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 40px rgba(15, 23, 42, 0.28)' }}>
        <header style={{ background: '#033015', padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#033015', fontSize: '0.72rem', fontWeight: 900 }}>C</div>
              <div>
                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>CAPartner</div>
                <div style={{ color: '#8ba29a', fontSize: '0.6rem' }}>Administrator</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onLogout && onLogout()}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                color: '#033015',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              J
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.62rem', color: '#8ba29a' }}>Oct 12, 2026 • 06:25 PM</div>
            <button
              type="button"
              style={{
                background: '#382317',
                color: '#ff4d4d',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.68rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Icon icon="lucide:siren" width="14" height="14" />
              ALERTS
            </button>
          </div>
        </header>

        <nav style={{ background: '#042d15', padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {tabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange && onTabChange(tab)}
                style={{
                  background: selected ? 'rgba(34,197,94,0.12)' : 'transparent',
                  border: selected ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(148,163,184,0.18)',
                  color: selected ? '#7ef59f' : '#dbeafe',
                  borderRadius: '999px',
                  padding: '6px 10px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        <main style={{ background: '#f8fafc', padding: '16px 12px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>{activeTab}</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
              Health, location, and emergency status.
            </p>
          </div>

          {contentMap[activeTab]}
        </main>
      </div>
    </div>
  );
}
