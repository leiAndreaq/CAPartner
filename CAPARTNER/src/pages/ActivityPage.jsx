import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ActivityPage({ onTabChange, onLogout }) {
  const [filters, setFilters] = useState({
    dateRange: '',
    adminUser: '',
    actionType: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  // MOCK AUDIT ENTRIES DATA
  const auditEntries = [
    {
      id: 1,
      time: '19:02:08',
      date: 'Today · 13 Sep',
      icon: 'lucide:log-in',
      badgeBg: '#f1f5f9',
      iconColor: '#475569',
      title: 'Admin sign-in',
      description: 'Password + 2FA verified · console CALOOCAN-SSB-01',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 2,
      time: '18:50:05',
      date: 'Today · 13 Sep',
      icon: 'lucide:log-out',
      badgeBg: '#f1f5f9',
      iconColor: '#475569',
      title: 'Auto sign-out',
      description: 'Inactivity timeout reached — session token invalidated',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 3,
      time: '18:25:00',
      date: 'Today · 13 Sep',
      icon: 'lucide:shield-check',
      badgeBg: '#dcfce7',
      iconColor: '#16a34a',
      title: 'Alert acknowledged',
      description: 'ALR-2291 · CAP-01 auto-detected SOS — responding',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 4,
      time: '18:24:57',
      date: 'Today · 13 Sep',
      icon: 'lucide:log-in',
      badgeBg: '#f1f5f9',
      iconColor: '#475569',
      title: 'Admin sign-in',
      description: 'Password + 2FA verified · console CALOOCAN-SSB-01',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 5,
      time: '13:58:22',
      date: 'Today · 13 Sep',
      icon: 'lucide:shield-check',
      badgeBg: '#dcfce7',
      iconColor: '#16a34a',
      title: 'Alert acknowledged',
      description: 'ALR-2289 · CAP-02 LoRa fallback — responded from station console',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 6,
      time: '09:14:47',
      date: 'Today · 13 Sep',
      icon: 'lucide:sliders',
      badgeBg: '#fef3c7',
      iconColor: '#d97706',
      title: 'Settings changed',
      description: 'Heart-rate auto-alert ceiling changed from 125 bpm to 120 bpm',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 7,
      time: '06:02:10',
      date: 'Today · 13 Sep',
      icon: 'lucide:log-in',
      badgeBg: '#f1f5f9',
      iconColor: '#475569',
      title: 'Admin sign-in',
      description: 'Password + 2FA verified · console CALOOCAN-SSB-01',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 8,
      time: '05:59:38',
      date: 'Today · 13 Sep',
      icon: 'lucide:shield-alert',
      badgeBg: '#fee2e2',
      iconColor: '#dc2626',
      title: 'Failed sign-in attempt',
      description: '2 failed attempts · console CALOOCAN-SSB-01 · no lockout triggered',
      user: 'unknown (n.reyez)',
    },
    {
      id: 9,
      time: '18:30:07',
      date: 'Yesterday · 12 Sep',
      icon: 'lucide:key-round',
      badgeBg: '#fef3c7',
      iconColor: '#d97706',
      title: 'Admin account locked',
      description: 'mj.santos locked after 3 consecutive failed sign-in attempts',
      user: 'PSSg. Nilo Reyes',
    },
    {
      id: 10,
      time: '17:03:09',
      date: 'Yesterday · 12 Sep',
      icon: 'lucide:shield-check',
      badgeBg: '#dcfce7',
      iconColor: '#16a34a',
      title: 'Alert acknowledged',
      description: 'ALR-2286 · CAP-02 manual SOS — vehicular accident assistance',
      user: 'PSSg. Nilo Reyes',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* NAVBAR */}
      <Navbar activeTab="Activity Log" onTabChange={onTabChange} onLogout={onLogout} />

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, maxWidth: '1180px', width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        
        {/* HEADER SECTION */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#033015',
              margin: '0 0 4px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Activity Log
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            View recent admin actions and system activities.
          </p>
        </div>

        {/* AUDIT CARD CONTAINER */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* CARD FILTER HEADER */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  Audit entries
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                  27 of 27 entries match the current filters
                </p>
              </div>

              {/* FILTERS INPUT GROUP */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    Date range
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    style={{
                      width: '120px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    Admin user
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={filters.adminUser}
                    onChange={(e) => setFilters({ ...filters, adminUser: e.target.value })}
                    style={{
                      width: '120px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    Action type
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={filters.actionType}
                    onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                    style={{
                      width: '120px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AUDIT ENTRIES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {auditEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 28px',
                  borderBottom: '1px solid #f1f5f9',
                  gap: '24px',
                }}
              >
                {/* TIME & DATE COLUMN */}
                <div style={{ minWidth: '110px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    {entry.time}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                    {entry.date}
                  </div>
                </div>

                {/* CATEGORY ICON BADGE */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: entry.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={entry.icon} width="18" height="18" color={entry.iconColor} />
                </div>

                {/* DETAILS COLUMN */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                    {entry.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                    {entry.description}
                  </div>
                </div>

                {/* ADMIN USER COLUMN */}
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    textAlign: 'right',
                    minWidth: '140px',
                  }}
                >
                  {entry.user}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAGINATION CONTROLS */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:chevrons-left" width="18" height="18" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:chevron-left" width="18" height="18" />
          </button>

          {/* ACTIVE PAGE BUTTON */}
          <button
            type="button"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {currentPage}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:chevron-right" width="18" height="18" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(3)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#033015',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:chevrons-right" width="18" height="18" />
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}