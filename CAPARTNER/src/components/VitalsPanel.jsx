import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getEnforcerVitals } from '../api';
import { CONNECTION_LABELS, formatDateTime, formatTime, timeAgo } from '../format';
import './VitalsPanel.css';

const RANGES = [
  { key: '8h', label: 'Last 8 hours' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: 'custom', label: 'Custom' },
];
const REFRESH_MS = 30000;

function rangeTimes(range, custom) {
  const now = new Date();
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }
  if (range === '7d') return { from: new Date(now - 7 * 24 * 3600e3), to: now };
  if (range === 'custom' && custom.from && custom.to) return { from: new Date(custom.from), to: new Date(custom.to) };
  return { from: new Date(now - 8 * 3600e3), to: now };
}

// <input type="datetime-local"> wants local time without seconds: 2026-10-26T14:30
function toLocalInput(date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

// A small line chart (SVG) with the admin's limit as a dashed line.
function LineChart({ points, valueKey, limit, color, unit, from, to, height = 140 }) {
  const width = 600;
  const pad = { left: 40, right: 10, top: 10, bottom: 22 };
  const values = points.map((p) => p[valueKey]).filter((v) => v !== null && v !== undefined);
  if (values.length === 0) {
    return (
      <div className="vp-chart-empty" style={{ height }}>
        No readings in this time range
      </div>
    );
  }
  let min = Math.min(...values, limit ?? Infinity);
  let max = Math.max(...values, limit ?? -Infinity);
  if (max - min < 2) {
    min -= 1;
    max += 1;
  }
  const t0 = new Date(from).getTime();
  const t1 = new Date(to).getTime();
  const x = (t) => pad.left + ((new Date(t).getTime() - t0) / Math.max(t1 - t0, 1)) * (width - pad.left - pad.right);
  const y = (v) => pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom);

  // Break the line where readings are missing.
  const segments = [];
  let current = [];
  for (const p of points) {
    const v = p[valueKey];
    if (v === null || v === undefined) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push(`${x(p.t).toFixed(1)},${y(v).toFixed(1)}`);
    }
  }
  if (current.length) segments.push(current);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={`${valueKey} chart`}>
      <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="#edeeed" />
      <text x={pad.left - 6} y={pad.top + 8} textAnchor="end" fontSize="10" fill="#6e6e6e">{Math.round(max * 10) / 10}</text>
      <text x={pad.left - 6} y={height - pad.bottom} textAnchor="end" fontSize="10" fill="#6e6e6e">{Math.round(min * 10) / 10}</text>
      <text x={pad.left} y={height - 6} fontSize="10" fill="#6e6e6e">{formatDateTime(from)}</text>
      <text x={width - pad.right} y={height - 6} textAnchor="end" fontSize="10" fill="#6e6e6e">{formatDateTime(to)}</text>
      {limit != null && (
        <>
          <line x1={pad.left} x2={width - pad.right} y1={y(limit)} y2={y(limit)} stroke="#f2ca65" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={width - pad.right} y={y(limit) - 4} textAnchor="end" fontSize="10" fill="#b45309">limit {limit} {unit}</text>
        </>
      )}
      {segments.map((seg, i) =>
        seg.length === 1 ? (
          <circle key={i} cx={seg[0].split(',')[0]} cy={seg[0].split(',')[1]} r="3" fill={color} />
        ) : (
          <polyline key={i} points={seg.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )
      )}
    </svg>
  );
}


// Icons from the Figma design (downloaded into src/assets/vitals)
const asset = (name) => new URL(`../assets/vitals/${name}`, import.meta.url).href;
const ICON = {
  battery: asset('battery.svg'),
  lastSync: asset('last-sync.svg'),
  connection: asset('connection.svg'),
  chipInternet: asset('chip-internet.svg'),
  coordinates: asset('coordinates.svg'),
  alerts: asset('alerts.svg'),
  media: asset('media.svg'),
};

// VITALS, UNIT STATUS AND LOCATION OF ONE ENFORCER, FROM THEIR REAL READINGS
export default function VitalsPanel({ enforcerId, onSessionEnded, onTabChange }) {
  const [range, setRange] = useState('8h');
  const [custom, setCustom] = useState(() => ({
    from: toLocalInput(new Date(Date.now() - 24 * 3600e3)),
    to: toLocalInput(new Date()),
  }));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { from, to } = rangeTimes(range, custom);
    if (!(from < to)) {
      setError('The start must be before the end.');
      return;
    }
    try {
      setData(await getEnforcerVitals(enforcerId, from, to));
      setError('');
    } catch (err) {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      setError(err.message);
    }
  }, [enforcerId, range, custom, onSessionEnded]);

  // Load now; the moving ranges also refresh every 30 seconds.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = range === 'custom' ? null : setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      if (timer) clearInterval(timer);
    };
  }, [load, range]);

  const latest = data?.latest;
  const unit = data?.enforcer;
  const hasPosition = latest && latest.latitude !== null && latest.longitude !== null;
  const coordsText = hasPosition ? `${latest.latitude.toFixed(5)}° N, ${latest.longitude.toFixed(5)}° E` : '—';
  const connectionTone = unit?.connection === 'internet' ? 'vp-chip-green' : unit?.connection === 'lora' ? 'vp-chip-amber' : 'vp-chip-grey';

  return (
    <>
      {/* VITALS */}
      <div className="vp-card">
        <div className="vp-head">
          <div>
            <h3>Vitals</h3>
            <p>
              {latest ? `Latest reading ${timeAgo(latest.recordedAt)} (${formatDateTime(latest.recordedAt)})` : 'No readings yet'}
              {data?.bucketSeconds ? ` · averaged every ${Math.round(data.bucketSeconds / 60)} min` : ''}
            </p>
          </div>
          <div className="vp-now">
            <div>
              <span className="vp-now-label">Heart rate</span>
              <span className="vp-now-value">{latest?.heartRateBpm ?? '—'}</span>
              <small>bpm</small>
            </div>
            <div>
              <span className="vp-now-label">Temperature</span>
              <span className="vp-now-value">{latest?.bodyTempC ?? '—'}</span>
              <small>°C</small>
            </div>
          </div>
        </div>

        <div className="vp-body">
          <div className="vp-ranges">
            {RANGES.map((r) => (
              <button key={r.key} type="button" className={`vp-range${range === r.key ? ' is-active' : ''}`} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
            {range === 'custom' && (
              <>
                <input type="datetime-local" aria-label="From" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
                <span className="vp-to">to</span>
                <input type="datetime-local" aria-label="To" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
              </>
            )}
          </div>

          {error && <div role="alert" className="vp-error">{error}</div>}

          {data && (
            <>
              <span className="vp-chart-title">Body temperature (°C)</span>
              <LineChart points={data.points} valueKey="temp" limit={data.limits.bodyTempMaxC} color="#1f7a3d" unit="°C" from={data.from} to={data.to} />
              <span className="vp-chart-title vp-chart-title-next">Heart rate (bpm)</span>
              <LineChart points={data.points} valueKey="hr" limit={data.limits.heartRateMaxBpm} color="#d32f2f" unit="bpm" from={data.from} to={data.to} />
            </>
          )}
        </div>
      </div>

      {/* UNIT STATUS */}
      <div className="vp-card">
        <div className="vp-head vp-head-plain">
          <h3>Unit status</h3>
        </div>
        <div className="vp-body">
          <div className="vp-rows">
            <div className="vp-row">
              <span><Icon icon="lucide:hard-hat" width="16" height="16" /> Cap</span>
              <b>{unit?.capCode || 'No cap assigned'}</b>
            </div>
            <div className="vp-row">
              <span><img src={ICON.battery} alt="" width="16" height="16" /> Battery</span>
              <b>{unit?.batteryPct == null ? '—' : `${unit.batteryPct}%`}</b>
            </div>
            <div className="vp-row">
              <span><img src={ICON.lastSync} alt="" width="16" height="16" /> Last sync</span>
              <b>{unit?.lastSyncAt ? `${formatTime(unit.lastSyncAt)} · ${timeAgo(unit.lastSyncAt)}` : 'Never'}</b>
            </div>
            <div className="vp-row">
              <span><img src={ICON.connection} alt="" width="16" height="16" /> Connection</span>
              <em className={`vp-chip ${connectionTone}`}>
                {unit?.connection === 'internet' && <img src={ICON.chipInternet} alt="" width="14" height="14" />}
                {CONNECTION_LABELS[unit?.connection] || '—'}
              </em>
            </div>
            <div className="vp-row">
              <span><Icon icon="mdi:run" width="16" height="16" /> Motion</span>
              <b className="vp-capitalize">{latest?.motion || '—'}</b>
            </div>
            <div className="vp-row">
              <span><img src={ICON.coordinates} alt="" width="16" height="16" /> Coordinates</span>
              <b>{coordsText}</b>
            </div>
          </div>

          {onTabChange && (
            <div className="vp-links">
              <button type="button" onClick={() => onTabChange('Alerts')}>
                <img src={ICON.alerts} alt="" width="14" height="14" /> View alerts
              </button>
              <button type="button" onClick={() => onTabChange('Camera')}>
                <img src={ICON.media} alt="" width="14" height="14" /> View media
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOCATION */}
      <div className="vp-card">
        <div className="vp-head vp-head-plain">
          <h3>Location</h3>
        </div>
        <div className="vp-map">
          {hasPosition ? (
            <MapContainer key={`${latest.latitude},${latest.longitude}`} center={[latest.latitude, latest.longitude]} zoom={17} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker center={[latest.latitude, latest.longitude]} radius={10} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#d32f2f', fillOpacity: 1 }} />
            </MapContainer>
          ) : (
            <div className="vp-no-map">No GPS position yet</div>
          )}
        </div>
        <p className="vp-at">Currently at {coordsText}</p>
      </div>
    </>
  );
}
