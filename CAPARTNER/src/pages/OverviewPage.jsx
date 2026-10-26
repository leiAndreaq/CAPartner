import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

{/* INTERNAL ENFORCER CARD COMPONENT */}
function EnforcerCard({
  id = 'Enforcer 01',
  name = 'J. Denzo',
  status = 'Normal',
  heartRate = '132',
  temp = '36.7',
  motionStatus = 'Moving',
  sector = 'Sector 1',
  connection = 'Internet • Online',
  connectionType = 'online',
  lastUpdate = '02:32 PM',
  battery = '70%',
  mapBbox = '121.0300%2C14.7500%2C121.0500%2C14.7700',
  onOpenMonitoring,
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'Normal':
        return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.4)', text: '• Normal' };
      case 'Attention':
        return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.4)', text: '• Attention' };
      default:
        return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', text: '• Offline' };
    }
  };

  const badge = getStatusBadge();
  const isOffline = status === 'Offline';

  return (
    <div 
      style={{
        backgroundColor: '#053D1C',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
      }}
      className="bg-[#053D1C] text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl border border-white/10"
    >
      <div>
        {/* ENFORCER CARD HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              {id}
            </h3>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', margin: '2px 0 0 0' }}>
              {name}
            </p>
          </div>

          <span 
            style={{
              color: badge.color,
              backgroundColor: badge.bg,
              borderColor: badge.border,
              borderWidth: '1px',
              borderStyle: 'solid',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {badge.text}
          </span>
        </div>

        {/* VITALS METRICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
              <Icon icon="mdi:heart-pulse" width="14" height="14" style={{ color: '#f87171' }} />
              Heart rate
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
              {isOffline ? '—' : heartRate}{' '}
              {!isOffline && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>BPM</span>}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
              <Icon icon="fluent:temperature-24-filled" width="14" height="14" style={{ color: '#fbbf24' }} />
              Temp
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
              {isOffline ? '—' : temp}{' '}
              {!isOffline && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>°C</span>}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
              <Icon icon="directions-run" width="14" height="14" style={{ color: '#34d399' }} />
              Motion Status
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, paddingTop: '4px' }}>
              {isOffline ? '—' : motionStatus}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

        {/* LOCATION & CONNECTION DATA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon icon="mdi:map-marker-outline" width="16" height="16" style={{ color: '#94a3b8' }} />
              Location
            </span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{sector}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon icon="carbon:connection-signal-alt" width="16" height="16" style={{ color: '#94a3b8' }} />
              Connection
            </span>
            <span style={{ color: connectionType === 'offline' ? '#f87171' : connectionType === 'attention' ? '#facc15' : '#4ade80', fontWeight: 700 }}>
              {connection}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1' }}>Last update</span>
            <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{lastUpdate}</span>
          </div>
        </div>

        <div 
          style={{
            height: '170px', 
            borderRadius: '16px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '18px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#e5e7eb',
            pointerEvents: 'none',
          }}
        >
          <iframe
            title={`OpenStreetMap Preview - ${id}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'calc(100% + 50px)',
              height: 'calc(100% + 32px)',
              border: 0,
              pointerEvents: 'none',
            }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&amp;layer=mapnik`}
          />
        </div>
      </div>

      {/* ENFORCER CARD FOOTER ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
        <button 
          onClick={onOpenMonitoring}
          style={{
            background: 'none',
            border: 'none',
            color: '#4ade80',
            fontWeight: 800,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: 0,
          }}
          className="hover:underline"
        >
          Open monitoring <Icon icon="akar-icons:arrow-up-right" width="14" height="14" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1' }}>
          {isOffline ? (
            <Icon icon="mdi:battery-off-outline" width="20" height="20" style={{ color: '#94a3b8' }} />
          ) : (
            <>
              <Icon icon="mdi:battery-70" width="20" height="20" style={{ color: '#4ade80' }} />
              <span>{battery}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

{/* MAIN OVERVIEW PAGE COMPONENT */}
export default function OverviewPage({ onTabChange, onLogout }) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedEnforcer, setSelectedEnforcer] = useState(null);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return undefined;

    const timer = setTimeout(() => {
      setShowEmergencyPopup(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const enforcerData = [
    {
      id: 'Enforcer 01',
      name: 'J. Denzo',
      status: 'Normal',
      heartRate: '132',
      temp: '36.7',
      motionStatus: 'Moving',
      sector: 'Sector 1',
      locationName: 'Camarin Road – Zabarte',
      connection: 'Internet • Online',
      connectionType: 'online',
      lastUpdate: '02:32 PM',
      battery: '70%',
      mapBbox: '121.0300%2C14.7500%2C121.0500%2C14.7700',
    },
    {
      id: 'Enforcer 02',
      name: 'L. Barcelona',
      status: 'Attention',
      heartRate: '132',
      temp: '36.7',
      motionStatus: 'Stationary',
      sector: 'Sector 2',
      locationName: 'Camarin Road – Deparo',
      connection: 'LoRa • Online',
      connectionType: 'attention',
      lastUpdate: '02:32 PM',
      battery: '18%',
      mapBbox: '121.0100%2C14.7400%2C121.0300%2C14.7600',
    },
    {
      id: 'Enforcer 03',
      name: 'J. Santos',
      status: 'Offline',
      heartRate: '—',
      temp: '—',
      motionStatus: '—',
      sector: 'Sector 3',
      locationName: 'Camarin Road – Susano',
      connection: 'Offline',
      connectionType: 'offline',
      lastUpdate: '—',
      battery: '0%',
      mapBbox: '121.0350%2C14.7350%2C121.0550%2C14.7550',
    },
  ];

  const alertsData = [
    {
      unit: 'CAP-02 · Liza Marquez',
      status: 'pending',
      desc: 'Battery at 18% — unit may power down before shift end',
      time: '14:11:32',
      date: 'Today',
      ack: 'Pending ack',
      isWarning: true,
    },
    {
      unit: 'CAP-02 · Liza Marquez',
      status: 'ack',
      desc: 'Connection switched to LoRa fallback',
      time: '13:50:04',
      date: 'Today',
      ack: 'Ack · PSSg. Milo Reyes',
    },
    {
      unit: 'CAP-03 · Arnel Bautista',
      status: 'ack',
      desc: 'Manual SOS button held 3s — reported road obstruction',
      time: '11:24:17',
      date: 'Today',
      ack: 'Ack · PSSg. Milo Reyes',
    },
    {
      unit: 'CAP-01 · Ramon Dizon',
      status: 'ack',
      desc: 'Body temperature 38.2 °C — above configured threshold',
      time: '10:48:55',
      date: 'Today',
      ack: 'Ack · PSSg. Grace Villamor',
    },
    {
      unit: 'CAP-02 · Liza Marquez',
      status: 'ack',
      desc: 'Manual SOS button held 3s — assisted vehicular accident',
      time: '17:02:41',
      date: 'Yesterday',
      ack: 'Ack · PSSg. Milo Reyes',
    },
  ];

  const deployedPosts = [
    { id: 'Enforcer 01', location: 'Camarin Road – Zabarte', time: '02:48', color: '#22c55e' },
    { id: 'Enforcer 02', location: 'Camarin Road – Deparo', time: '2:50 PM', color: '#eab308' },
    { id: 'Enforcer 03', location: 'Camarin Road – Susano', time: '02:48 PM', color: '#94a3b8' },
  ];

  const handleOpenMap = (enforcerItem = null) => {
    setSelectedEnforcer(enforcerItem);
    setIsMapModalOpen(true);
  };

  const activeBbox = selectedEnforcer 
    ? selectedEnforcer.mapBbox 
    : '121.0200%2C14.7450%2C121.0500%2C14.7700';

  return (
    <div 
      style={{
        background: 'transparent',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
      className="min-h-screen flex flex-col"
    >
      {/* INJECTED AUTO-HIDING SCROLLBAR STYLES */}
      <style>{`
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Auto-hiding modern scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(5, 61, 28, 0.25);
          border-radius: 9999px;
          transition: background 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(5, 61, 28, 0.7);
        }

        /* Firefox support */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(5, 61, 28, 0.3) transparent;
        }
      `}</style>

      {/* NAVBAR COMPONENT */}
      <Navbar
        activeTab="Overview"
        onTabChange={onTabChange}
        onLogout={onLogout}
        showEmergencyPopup={showEmergencyPopup}
      />

      {showEmergencyPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 18, 22, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowEmergencyPopup(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
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
                <span>SOS ALERT</span>
              </div>
              <span style={{ opacity: 0.9, fontSize: '0.78rem' }}>9:43 PM</span>
            </div>

            <div style={{ background: '#081d2e', padding: '22px 20px 18px', color: '#ffffff' }}>
              <div style={{ fontSize: '2.35rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '10px' }}>
                Enforcer 02
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dfeaf0', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 600 }}>
                <span style={{ color: '#f87171' }}>◉</span>
                <span>Camarin Road – Deparo – Intersection 2</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '22px' }}>
                <div style={{ background: 'rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px 16px', minHeight: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                    <Icon icon="mdi:heart-pulse" width="16" height="16" style={{ color: '#f87171' }} />
                    Heart rate
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em' }}>
                    124 <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>BPM</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px 16px', minHeight: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                    <Icon icon="fluent:temperature-24-filled" width="16" height="16" style={{ color: '#fbbf24' }} />
                    Temperature
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em' }}>
                    38.1 <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>°C</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEmergencyPopup(false);
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  background: '#ef4b4b',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                }}
              >
                Acknowledge alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT BODY */}
      <main className="overview-main" style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* PAGE TITLE HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 
            style={{ color: '#012b10', fontSize: '2.75rem', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.03em' }}
            className="text-4xl md:text-5xl font-black text-[#012b10] m-0 mb-1 leading-none tracking-tight"
          >
            OVERVIEW
          </h1>
          <p style={{ color: '#475569', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
            Monitor the health, location, and emergency status.
          </p>
        </div>

        {/* ENFORCERS GRID SECTION */}
        <div 
          className="overview-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}
        >
          {enforcerData.map((item) => (
            <EnforcerCard 
              key={item.id} 
              {...item} 
              onOpenMonitoring={() => handleOpenMap(item)}
            />
          ))}
        </div>

        {/* LIVE MAP SECTION */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: '#012b10', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 4px 0' }}>
              Live Map
            </h2>
            <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
              Real-time positions along Camarin Road
            </p>
          </div>

          <div className="map-grid overview-map-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            
            {/* LARGE EMBEDDED OPENSTREETMAP DISPLAY */}
            <div 
              className="overview-map-panel"
              onClick={() => handleOpenMap(null)}
              style={{
                gridColumn: 'span 8',
                borderRadius: '24px',
                border: '4px solid #053D1C',
                height: '400px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
              }}
              className="lg:col-span-8 rounded-3xl border-4 border-[#053D1C] h-[400px] relative overflow-hidden"
            >
              <iframe
                title="OpenStreetMap - Camarin Road Sector"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 'calc(100% + 32px)',
                  border: 0,
                  pointerEvents: 'none',
                }}
                src="https://www.openstreetmap.org/export/embed.html?bbox=121.0200%2C14.7450%2C121.0500%2C14.7700&amp;layer=mapnik"
              />

              {/* Click to Expand Badge Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  backgroundColor: '#053D1C',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  zIndex: 20,
                }}
              >
                <Icon icon="heroicons:arrows-pointing-out-20-solid" width="16" height="16" />
                Click to expand map
              </div>
            </div>

            {/* DEPLOYED POSTS PANEL */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '12px' }} className="overview-posts-panel lg:col-span-4 flex flex-col gap-3">
              <div>
                <h3 style={{ color: '#012b10', fontSize: '1.1rem', fontWeight: 900, margin: '0 0 4px 0' }}>
                  Deployed posts
                </h3>
                <p style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 500, margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Markers update as caps report GPS. Offline caps hold their last known position.
                </p>
              </div>

              {deployedPosts.map((post) => (
                <div 
                  key={post.id}
                  style={{
                    backgroundColor: '#053D1C',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  className="bg-[#053D1C] text-white rounded-2xl p-4 flex items-center justify-between"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: post.color }} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>{post.id}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{post.location}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{post.time}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* BOTTOM DASHBOARD GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }} className="overview-dashboard-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* RECENT ALERTS */}
          <div 
            style={{
              gridColumn: 'span 7',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
            className="overview-alert-card lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          >
            <div 
              style={{
                backgroundColor: '#053D1C',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Recent Alerts</h3>
              <a href="#alerts" style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.8rem', textDecoration: 'none' }}>View all</a>
            </div>

            <div style={{ padding: '8px 20px' }}>
              {alertsData.map((alertItem, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '14px 0',
                    borderBottom: idx !== alertsData.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span 
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: alertItem.isWarning ? '#f59e0b' : '#cbd5e1',
                        marginTop: '6px',
                        flexShrink: 0,
                      }} 
                    />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '0.85rem' }}>{alertItem.unit}</h4>
                      <p style={{ margin: '2px 0 0 0', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{alertItem.desc}</p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '12px' }}>
                    <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>
                      {alertItem.date} · <span style={{ fontFamily: 'monospace' }}>{alertItem.time}</span>
                    </div>
                    <div style={{ color: alertItem.isWarning ? '#d97706' : '#94a3b8', fontWeight: 800, fontSize: '0.7rem', marginTop: '2px' }}>
                      {alertItem.ack}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MEDIA QUEUE & ADMIN ACTIONS */}
          <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '20px' }} className="overview-side-stack lg:col-span-5 flex flex-col gap-5">
            
            {/* MEDIA QUEUE CARD */}
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div 
                style={{
                  backgroundColor: '#053D1C',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#ffffff',
                }}
              >
                <Icon icon="ic:baseline-photo-library" width="20" height="20" />
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Media queue</h3>
              </div>

              <div style={{ padding: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 12px 0' }}>Items submitted this shift</p>
                
                <div 
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 900, fontSize: '0.82rem', marginBottom: '4px' }}>
                    <Icon icon="mdi:camera-sync-outline" width="18" height="18" />
                    2 awaiting upload
                  </div>
                  <p style={{ margin: 0, color: '#b45309', fontSize: '0.72rem', fontWeight: 600, paddingLeft: '26px' }}>
                    — captured on LoRa, will sync when Internet returns.
                  </p>
                </div>

                <button 
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#012b10',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Open media review <Icon icon="lucide:arrow-right" width="14" height="14" />
                </button>
              </div>
            </div>

            {/* LATEST ADMIN ACTIONS CARD */}
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                fontFamily: "'Inter', sans-serif",
              }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* CARD HEADER */}
              <div 
                style={{
                  backgroundColor: '#053D1C',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#ffffff',
                }}
              >
                <Icon icon="ph:check-circle-fill" width="22" height="22" style={{ color: '#ffffff' }} />
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                  Latest admin actions
                </h3>
              </div>

              {/* ACTIONS LIST */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* ITEM 1: ADMIN SIGN-IN */}
                <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    Admin sign-in
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span>PSSg. Milo Reyes</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>20:07:02</span>
                  </p>
                </div>

                {/* ITEM 2: AUTO SIGN-OUT */}
                <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    Auto sign-out
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span>PSSg. Milo Reyes</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>19:56:59</span>
                  </p>
                </div>

                {/* ITEM 3: ADMIN SIGN-IN */}
                <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    Admin sign-in
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span>PSSg. Milo Reyes</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>19:44:55</span>
                  </p>
                </div>

                {/* AUDIT LOG LINK */}
                <div style={{ paddingTop: '4px' }}>
                  <a 
                    href="#audit" 
                    style={{
                      color: '#053D1C',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    className="hover:underline"
                  >
                    Full audit log <Icon icon="lucide:arrow-right" width="16" height="16" />
                  </a>
                </div>

              </div>
            </div>

          </div>

        </div>

      </main>


      {/* FULL-SCREEN INTERACTIVE OPENSTREETMAP MODAL */}
      {isMapModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsMapModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '1150px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '2px solid #053D1C',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div 
              style={{ 
                backgroundColor: '#053D1C', 
                color: '#ffffff', 
                padding: '18px 24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
                  {selectedEnforcer 
                    ? `Live Map — ${selectedEnforcer.id} (${selectedEnforcer.name})`
                    : 'Live Map — Camarin Road Sector'
                  }
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#8ca39f', fontWeight: 600 }}>
                  {selectedEnforcer 
                    ? `${selectedEnforcer.locationName} • ${selectedEnforcer.connection}`
                    : 'Interactive OpenStreetMap view along Camarin Road'
                  }
                </p>
              </div>

              <button 
                onClick={() => setIsMapModalOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ffffff', 
                  cursor: 'pointer', 
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="mdi:close" width="28" height="28" />
              </button>
            </div>

            {/* Modal OpenStreetMap Viewport */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              <iframe
                title="Interactive OpenStreetMap Modal"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 'calc(100% + 32px)',
                  border: 0,
                }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeBbox}&amp;layer=mapnik`}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}