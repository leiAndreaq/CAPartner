import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CameraPage({ onTabChange, onLogout }) {
  const [activeEnforcerTab, setActiveEnforcerTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('all'); // 'all' or 'clip'

  // MOCK RECORDINGS DATA 
  const clips = [
    {
      id: '344543',
      time: 'Yesterday 3:47 PM · 11:36',
      badge: 'Enforcer 01',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
    },
    {
      id: '454533',
      time: 'Yesterday 8:12 AM · 07:04',
      badge: 'Enforcer 02',
      badgeBg: '#fce7f3',
      badgeColor: '#be185d',
    },
    {
      id: '344543',
      time: 'Yesterday 3:47 PM · 11:36',
      badge: 'Enforcer 03',
      badgeBg: '#ccfbf1',
      badgeColor: '#0f766e',
    },
    {
      id: '454533',
      time: 'Yesterday 8:12 AM · 07:04',
      badge: 'Enforcer 01',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
    },
    {
      id: '344543',
      time: 'Yesterday 3:47 PM · 11:36',
      badge: 'Enforcer 02',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
    },
  ];

  const filteredClips = clips.filter((clip) => {
    const matchesTab = activeEnforcerTab === 'All' || clip.badge === activeEnforcerTab;
    const matchesSearch =
      clip.id.includes(searchQuery) ||
      clip.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleTriggerExport = (type) => {
    setExportType(type);
    setShowExportModal(true);
  };

  const confirmExport = () => {
    setShowExportModal(false);
    alert(`${exportType === 'all' ? 'All records' : 'Video clip'} exported successfully!`);
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
    >
      {/* NAVBAR */}
      <Navbar activeTab="Camera" onTabChange={onTabChange} onLogout={onLogout} />

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, maxWidth: '1180px', width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        
        {/* PAGE HEADER */}
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
            Camera
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            View live camera feeds from assigned Smart Caps.
          </p>
        </div>

        {/* LIVE CAMERA FEEDS GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* FEED 1: CAP 01 */}
          <div
            style={{
              backgroundColor: '#000000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', height: '180px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>LIVE</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>CAP-A17</span>
              </div>
              <div style={{ textAlign: 'right', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                00:29:52
              </div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700 }}>Cap - 01 Streaming</span>
            </div>
          </div>

          {/* FEED 2: CAP 02 */}
          <div
            style={{
              backgroundColor: '#000000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', height: '180px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>LIVE</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>CAP-B04</span>
              </div>
              <div style={{ textAlign: 'right', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                00:30:12
              </div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700 }}>Cap - 02 Streaming</span>
            </div>
          </div>

          {/* FEED 3: CAP 03 OFFLINE */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <Icon icon="lucide:video-off" width="28" height="28" color="#64748b" style={{ marginBottom: '8px' }} />
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 700 }}>No signal — cap offline</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginTop: '2px' }}>CAP-C22</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700 }}>Cap - 03 offline</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: VIDEO RECORD CLIPS */}
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#033015',
              margin: '0 0 20px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Video Record Clips
          </h2>

          {/* FILTERS & SEARCH ROW */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* ENFORCER FILTER TABS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Enforcer 01', 'Enforcer 02', 'Enforcer 03'].map((tab) => {
                const isActive = activeEnforcerTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveEnforcerTab(tab)}
                    style={{
                      backgroundColor: isActive ? '#033015' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* SEARCH & ACTION BUTTONS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* SEARCH INPUT */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  minWidth: '220px',
                }}
              >
                <Icon icon="lucide:search" width="16" height="16" color="#64748b" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    width: '100%',
                  }}
                />
              </div>

              {/* FILTER TIME & DATE */}
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#033015',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <span>Filter: Time & Date</span>
                <Icon icon="lucide:arrow-down" width="14" height="14" />
              </button>

              {/* EXPORT ALL - TRIGGERS MODAL */}
              <button
                type="button"
                onClick={() => handleTriggerExport('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#033015',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Icon icon="lucide:download" width="14" height="14" />
                <span>Export All</span>
              </button>
            </div>
          </div>
        </div>

        {/* RECORDINGS CONTAINER */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* HEADER BANNER */}
          <div
            style={{
              backgroundColor: '#033015',
              color: '#ffffff',
              padding: '20px 24px',
              borderRadius: '14px 14px 0 0',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Saved recordings</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 500 }}>
              6 submissions - items captured on LoRa are tagged and upload when internet returns
            </p>
          </div>

          {/* RECORDINGS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredClips.map((clip, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: index !== filteredClips.length - 1 ? '1px solid #f1f5f9' : 'none',
                  gap: '16px',
                }}
              >
                {/* THUMBNAIL & METADATA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '32px',
                      backgroundColor: '#000000',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon icon="lucide:play" width="16" height="16" color="#ffffff" />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>{clip.id}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                      {clip.time}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: clip.badgeBg,
                        color: clip.badgeColor,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                      }}
                    >
                      {clip.badge}
                    </span>
                  </div>
                </div>

                {/* EXPORT CLIP BUTTON - TRIGGERS MODAL */}
                <button
                  type="button"
                  onClick={() => handleTriggerExport('clip')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#033015',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Icon icon="lucide:download" width="14" height="14" />
                  <span>Export clip</span>
                </button>
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

      {/* EXPORT CONFIRMATION MODAL */}
      {showExportModal && (
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
              overflow: 'hidden', 
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
              {exportType === 'all' 
                ? 'Are you sure you want to EXPORT ALL?' 
                : 'Are you sure you want to EXPORT THIS CLIP?'
              }
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
              {/* EXPORT BUTTON */}
              <button
                type="button"
                onClick={confirmExport}
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
                Export
              </button>

              {/* CANCEL BUTTON  */}
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#033015',
                  border: '2px solid #033015', // GREEN STROKE
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

            {/* BOTTOM SOLID GREEN DECORATIVE BAND */}
            <div
              style={{
                height: '24px',
                backgroundColor: '#033015',
                margin: '0 -32px', // Pulls out to the edges of the card
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}