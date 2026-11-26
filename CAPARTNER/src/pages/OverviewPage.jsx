import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import { getOverview, listAudit, listMedia } from '../api';
import { useAlerts } from '../alertsWatcher';
import { formatDayClock, formatTime, timeAgo } from '../format';
import './OverviewPage.css';

// Icons from the Figma design (downloaded into src/assets/overview)
const asset = (name) => new URL(`../assets/overview/${name}`, import.meta.url).href;
const ICON = {
  heart: asset('heart.svg'),
  thermometer: asset('thermometer.svg'),
  location: asset('location.svg'),
  connection: asset('connection.svg'),
  arrowUpRight: asset('arrow-up-right.svg'),
  arrowRightDark: asset('arrow-right-dark.svg'),
  arrowRightSmall: asset('arrow-right-small.svg'),
  cloudOff: asset('cloud-off.svg'),
  running: asset('running.png'),
  radioWaves: asset('radio-waves.png'),
  lowBattery: asset('low-battery.png'),
  noBattery: asset('no-battery.png'),
  chargedBattery: asset('charged-battery.png'),
  protect: asset('protect.png'),
  mediaImage: asset('media-image.png'),
};

const POLL_MS = 5000; // refreshes by itself every 5 seconds
// Camarin Road, North Caloocan: where the map starts when no cap has sent a position yet.
const DEFAULT_CENTER = [14.7534, 121.0437];

// Colors from the Figma design: bright green, amber and grey on the dark green cards
const STATUS = {
  normal: { label: 'Normal', color: '#26ff00' },
  attention: { label: 'Attention', color: '#f59e0b' },
  offline: { label: 'Offline', color: '#7d8ea3' },
};

function hasPosition(cap) {
  return cap.latitude !== null && cap.longitude !== null;
}

function lastUpdateText(value) {
  return value ? timeAgo(value) : 'No data yet';
}

// Keeps every cap in view when the positions change.
function FitToCaps({ caps }) {
  const map = useMap();
  const key = caps.filter(hasPosition).map((c) => `${c.latitude},${c.longitude}`).join('|');
  useEffect(() => {
    const points = caps.filter(hasPosition).map((c) => [c.latitude, c.longitude]);
    if (points.length === 1) map.setView(points[0], 16);
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    // Only refit when a position really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

// LIVE MAP: one dot per cap at its last known position (offline caps keep their last position).
function CapsMap({ caps, interactive = true }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToCaps caps={caps} />
      {caps.filter(hasPosition).map((cap) => (
        <CircleMarker
          key={cap.capCode}
          center={[cap.latitude, cap.longitude]}
          radius={interactive ? 10 : 8}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: STATUS[cap.status].color, fillOpacity: 1 }}
        >
          {interactive && (
            <Tooltip direction="top" offset={[0, -8]}>
              <b>{cap.capCode}</b>
              {cap.enforcer ? ` · ${cap.enforcer.fullName}` : ''}
              <br />
              {STATUS[cap.status].label} · {lastUpdateText(cap.lastSyncAt)}
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </MapContainer>
  );
}


// "enforcer_force_logout" -> "Enforcer force logout"
function typeLabel(type) {
  const text = type.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function batteryIcon(pct) {
  if (pct === null) return ICON.noBattery;
  return pct < 20 ? ICON.lowBattery : ICON.chargedBattery;
}

const CONNECTION = {
  internet: { text: 'Internet • Online', tone: 'ov-conn-internet' },
  lora: { text: 'LoRa • Online', tone: 'ov-conn-lora' },
  offline: { text: 'Offline', tone: 'ov-conn-offline' },
};

// ONE CAP: dark green card with who wears it, latest vitals, connection, a small map and the battery.
function CapCard({ cap, onOpen }) {
  const latest = cap.latest;
  const highHr = cap.attentionReasons.includes('High heart rate');
  const highTemp = cap.attentionReasons.includes('High body temperature');
  const connection = CONNECTION[cap.connection] || CONNECTION.offline;
  const lowBattery = cap.batteryPct !== null && cap.attentionReasons.includes('Low battery');

  return (
    <article className="ov-cap">
      <div className="ov-cap-head">
        <div style={{ minWidth: 0 }}>
          <h3 className="ov-cap-code">{cap.capCode}</h3>
          <p className="ov-cap-who">{cap.enforcer ? cap.enforcer.fullName : 'Not given to an enforcer'}</p>
        </div>
        <div className="ov-status-col">
          <span className={`ov-status ov-status-${cap.status}`}>
            <i aria-hidden="true" />
            {STATUS[cap.status].label}
          </span>
          {cap.attentionReasons.length > 0 && <span className="ov-reasons">{cap.attentionReasons.join(' · ')}</span>}
        </div>
      </div>

      <div className="ov-vitals">
        <div className="ov-vital">
          <div className="ov-vital-label"><img src={ICON.heart} alt="" width="20" height="20" /> Heart rate</div>
          <div className={`ov-vital-value${highHr ? ' ov-vital-over' : ''}`}>
            {latest?.heartRateBpm ?? '—'}<small>BPM</small>
          </div>
        </div>
        <div className="ov-vital">
          <div className="ov-vital-label"><img src={ICON.thermometer} alt="" width="20" height="20" /> Temp</div>
          <div className={`ov-vital-value${highTemp ? ' ov-vital-over' : ''}`}>
            {latest?.bodyTempC ?? '—'}<small>°C</small>
          </div>
        </div>
        <div className="ov-vital">
          <div className="ov-vital-label"><img src={ICON.running} alt="" width="26" height="26" /> Motion Status</div>
          <div className="ov-vital-motion">{latest?.motion || '—'}</div>
        </div>
      </div>

      <div className="ov-rows">
        <div className="ov-row">
          <span><img src={ICON.location} alt="" width="22" height="22" /> Location</span>
          <span>{cap.enforcer?.sector || '—'}</span>
        </div>
        <div className="ov-row">
          <span><img src={ICON.radioWaves} alt="" width="28" height="21" /> Connection</span>
          <span className={connection.tone}>{connection.text}</span>
        </div>
        <div className="ov-row">
          <span>Last update</span>
          <span className="ov-mono" title={cap.lastSyncAt ? timeAgo(cap.lastSyncAt) : ''}>{cap.lastSyncAt ? formatTime(cap.lastSyncAt) : '—'}</span>
        </div>
      </div>

      <div className="ov-mini-map">
        {hasPosition(cap) ? (
          <CapsMap caps={[cap]} interactive={false} />
        ) : (
          <div className="ov-no-map">
            <Icon icon="lucide:map-pin-off" width="20" />
            No location yet
          </div>
        )}
      </div>

      <div className="ov-cap-foot">
        <button type="button" className="ov-open" onClick={onOpen} disabled={!cap.enforcer}>
          Open monitoring <img src={ICON.arrowUpRight} alt="" width="20" height="20" />
        </button>
        <span className={`ov-mono ov-battery${lowBattery ? ' ov-battery-low' : ''}`}>
          <img src={batteryIcon(cap.batteryPct)} alt="" width="28" height="28" />
          {cap.batteryPct === null ? '' : `${cap.batteryPct}%`}
        </span>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="ov-cap" style={{ minHeight: '300px', gap: '12px' }}>
      <span className="ui-skeleton" style={{ width: '40%', height: '20px', opacity: 0.3 }} />
      <span className="ui-skeleton" style={{ width: '60%', height: '14px', opacity: 0.3 }} />
      <span className="ui-skeleton" style={{ width: '100%', height: '60px', opacity: 0.3 }} />
      <span className="ui-skeleton" style={{ width: '100%', height: '120px', opacity: 0.3 }} />
    </div>
  );
}

export default function OverviewPage({ onTabChange, onLogout, onSessionEnded, onOpenEnforcer }) {
  const watcher = useAlerts();
  const [overview, setOverview] = useState(null);
  const [media, setMedia] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      // The admin actions list is an extra: if it fails, the rest of the page still shows.
      const [ov, clips, log] = await Promise.all([
        getOverview(),
        listMedia(),
        listAudit({ page: 1, limit: 3 }).catch(() => null),
      ]);
      setOverview(ov);
      setMedia(clips);
      if (log) setAudit(log.entries || []);
      setUpdatedAt(new Date());
      setError('');
    } catch (err) {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      setError(err.message);
    }
  }, [onSessionEnded]);

  // LOAD NOW, THEN KEEP IT LIVE
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

  const loading = !overview && !error;
  const caps = overview?.caps || [];
  const recentAlerts = (watcher?.alerts || []).slice(0, 5);
  const clipsToday = media.filter((m) => new Date(m.recorded_at).toDateString() === new Date().toDateString());
  const uploading = media.filter((m) => m.upload_status === 'uploading').length;
  const openEnforcer = (cap) => cap.enforcer && onOpenEnforcer?.(cap.enforcer.id);

  return (
    <div className="ui-page ov-page">
      <Navbar activeTab="Overview" onTabChange={onTabChange} onLogout={onLogout} />

      <main className="ui-main">
        {/* PAGE TITLE */}
        <div className="ui-page-header">
          <div>
            <h1 className="ui-title">Overview</h1>
            <p className="ui-subtitle">Monitor the health, location, and emergency status.</p>
          </div>
          <div className="ov-updated">
            <span className="ov-live-dot" aria-hidden="true" />
            <span>{updatedAt ? `Live · updated ${formatTime(updatedAt)}` : 'Loading...'}</span>
          </div>
        </div>

        {error && (
          <div role="alert" className="ui-message ui-message-error">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="lucide:circle-alert" width="18" /> {error}
            </span>
            <button type="button" className="ui-button" onClick={load}>Try again</button>
          </div>
        )}

        {/* CAPS */}
        <section className="ov-caps" aria-label="Smart Caps">
          {loading && [1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          {overview && caps.length === 0 && (
            <div className="ui-card ui-empty">
              <span className="ui-empty-icon"><Icon icon="mdi:hard-hat" width="24" /></span>
              <strong>No caps yet</strong>
              Caps show up here once they are registered.
            </div>
          )}
          {caps.map((cap) => (
            <CapCard key={cap.capCode} cap={cap} onOpen={() => openEnforcer(cap)} />
          ))}
        </section>

        {/* LIVE MAP + DEPLOYED POSTS */}
        <section className="ov-live">
          <div className="ov-live-left">
            <div className="ov-live-title">
              <h2 className="ov-heading">Live Map</h2>
              <p className="ov-caption">Real-time positions along Camarin Road</p>
            </div>
            <div className="ov-live-map">
              <CapsMap caps={caps} />
            </div>
          </div>
          <aside className="ov-posts">
            <h3 className="ov-posts-title">Deployed posts</h3>
            <p className="ov-caption ov-posts-note">Markers update as caps report GPS. Offline caps hold their last known position.</p>
            {caps.map((cap) => (
              <button key={cap.capCode} type="button" className="ov-post" onClick={() => openEnforcer(cap)} disabled={!cap.enforcer}>
                <span className="ov-post-dot" style={{ background: STATUS[cap.status].color }} />
                <span className="ov-post-text">
                  <b>{cap.enforcer ? cap.enforcer.fullName : cap.capCode}</b>
                  <small>{cap.enforcer?.sector || 'No sector yet'}</small>
                </span>
                <span className="ov-mono ov-post-time">{cap.lastSyncAt ? formatTime(cap.lastSyncAt) : '—'}</span>
              </button>
            ))}
          </aside>
        </section>

        {/* RECENT ALERTS, MEDIA QUEUE, LATEST ADMIN ACTIONS */}
        <section className="ov-panels">
          <div className="ov-panel ov-panel-alerts">
            <div className="ov-panel-head">
              <h3>Recent Alerts</h3>
              <button type="button" onClick={() => onTabChange?.('Alerts')}>View all</button>
            </div>
            {recentAlerts.length === 0 && <div className="ov-panel-empty">No alerts yet.</div>}
            {recentAlerts.map((a) => (
              <div key={a.id} className="ov-alert-row">
                <span className={`ov-alert-dot${a.status === 'new' ? ' ov-alert-dot-new' : ''}`} />
                <div className="ov-alert-main">
                  <b>{a.capCode || '—'} · {a.enforcer?.fullName || 'Unknown'}</b>
                  <span>{a.title}{a.detail ? ` — ${a.detail}` : ''}</span>
                </div>
                <div className="ov-alert-side">
                  <span className="ov-mono-alt">{formatDayClock(a.occurredAt)}</span>
                  {a.status === 'new' ? (
                    <em className="ov-alert-pending">Pending ack</em>
                  ) : (
                    <em>{a.acknowledgedBy ? `Ack · ${a.acknowledgedBy}` : 'Resolved'}</em>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ov-side">
            <div className="ov-panel">
              <div className="ov-panel-head ov-panel-head-small">
                <h3><img src={ICON.mediaImage} alt="" width="25" height="25" /> Media queue</h3>
              </div>
              <div className="ov-panel-body">
                <p className="ov-muted">clips recorded today</p>
                <div className="ov-big-number">{clipsToday.length}</div>
                {uploading > 0 && (
                  <div className="ov-notice">
                    <img src={ICON.cloudOff} alt="" width="16" height="16" />
                    <div>
                      <b>{uploading} awaiting upload</b>
                      <span>— still sending from the phone. They appear in Camera when done.</span>
                    </div>
                  </div>
                )}
                <button type="button" className="ov-outline-button" onClick={() => onTabChange?.('Camera')}>
                  Open media review <img src={ICON.arrowRightSmall} alt="" width="14" height="14" />
                </button>
              </div>
            </div>

            <div className="ov-panel">
              <div className="ov-panel-head ov-panel-head-small">
                <h3><img src={ICON.protect} alt="" width="25" height="25" /> Latest admin actions</h3>
              </div>
              <div className="ov-panel-body">
                {audit.length === 0 && <p className="ov-muted">Nothing recorded yet.</p>}
                <ul className="ov-actions">
                  {audit.map((e) => (
                    <li key={e.id}>
                      <b>{typeLabel(e.type)}</b>
                      <span>{e.actor.name} · <span className="ov-mono-alt">{formatDayClock(e.occurredAt)}</span></span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="ov-text-link" onClick={() => onTabChange?.('Activity Log')}>
                  Full audit log <img src={ICON.arrowRightDark} alt="" width="14" height="14" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
