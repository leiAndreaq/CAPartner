import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { listLive, startLive, stopLive, sendLiveSignal, readLiveSignals } from '../api';
import './LiveCameras.css';

const LIST_MS = 3000;
const SIGNAL_MS = 800;

const STATE_TEXT = {
  offline: 'No signal — phone offline',
  ready: 'Ready — press Start live',
  starting: 'Connecting to the phone...',
  live: 'Streaming',
};

function elapsedText(startedAt, now) {
  if (!startedAt) return '00:00:00';
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

// ONE CCTV SCREEN: shows one enforcer's phone camera. The video comes straight from the phone (WebRTC);
// the server only passes the connection messages.
function LiveTile({ camera, iceServers, onChanged, onStopped, onError }) {
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingIce = useRef([]);
  const iceRef = useRef(iceServers);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const active = camera.state === 'starting' || camera.state === 'live';
  const activeRef = useRef(active);
  const id = camera.enforcerId;

  useEffect(() => {
    iceRef.current = iceServers;
    activeRef.current = active;
  });

  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    pendingIce.current = [];
    setConnected(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Pass the connection messages while a live is running.
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    const handleMessage = async (message) => {
      if (message.type === 'offer') {
        closePeer();
        const peer = new RTCPeerConnection({ iceServers: iceRef.current });
        peerRef.current = peer;
        peer.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0];
          setConnected(true);
        };
        peer.onicecandidate = (event) => {
          if (event.candidate) sendLiveSignalSafe(id, { type: 'ice', data: event.candidate.toJSON() });
        };
        peer.onconnectionstatechange = () => {
          if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) setConnected(false);
        };
        await peer.setRemoteDescription({ type: 'offer', sdp: message.data.sdp });
        for (const candidate of pendingIce.current) await peer.addIceCandidate(candidate).catch(() => {});
        pendingIce.current = [];
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await sendLiveSignal(id, { type: 'answer', data: { type: answer.type, sdp: answer.sdp } });
      } else if (message.type === 'ice') {
        const peer = peerRef.current;
        if (peer && peer.remoteDescription) await peer.addIceCandidate(message.data).catch(() => {});
        else pendingIce.current.push(message.data);
      }
    };

    const tick = async () => {
      try {
        const { messages } = await readLiveSignals(id);
        for (const message of messages) {
          if (cancelled) return;
          await handleMessage(message);
        }
      } catch (err) {
        if (!cancelled) onError(err);
      }
    };
    tick();
    const timer = setInterval(tick, SIGNAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, id, closePeer, onError]);

  // The live is over (stopped here or on the phone): close the connection.
  useEffect(() => {
    if (active) return;
    peerRef.current?.close();
    peerRef.current = null;
    pendingIce.current = [];
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [active]);

  // Running time
  useEffect(() => {
    if (camera.state !== 'live') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [camera.state]);

  // Leaving the page ends a running live, so the phone does not keep streaming for nobody.
  useEffect(
    () => () => {
      peerRef.current?.close();
      if (activeRef.current) stopLive(id).catch(() => {});
    },
    [id]
  );

  const start = async () => {
    setBusy(true);
    setConnected(false);
    try {
      await startLive(id);
      onChanged();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      await stopLive(id);
      closePeer();
      onChanged();
      onStopped();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const showVideo = connected && camera.state === 'live';

  return (
    <article className={`lc-tile lc-${camera.state}`}>
      <div className="lc-screen">
        <video ref={videoRef} autoPlay playsInline muted className={showVideo ? 'is-on' : ''} />
        {!showVideo && (
          <div className="lc-empty">
            <Icon icon={camera.state === 'offline' ? 'lucide:video-off' : 'lucide:video'} width="30" height="30" />
            <span>{STATE_TEXT[camera.state]}</span>
          </div>
        )}
        <div className="lc-scan" aria-hidden="true" />
        <span className={`lc-badge${camera.state === 'live' ? ' is-live' : ''}`}>
          <i aria-hidden="true" /> {camera.state === 'live' ? 'LIVE' : camera.state === 'starting' ? 'WAIT' : 'OFF'}
        </span>
        <span className="lc-cap">{camera.capCode || 'NO CAP'}</span>
        {camera.state === 'live' && <span className="lc-time">{elapsedText(camera.startedAt, now)}</span>}
      </div>
      <div className="lc-foot">
        <span className={`lc-dot lc-dot-${camera.state}`} />
        <span className="lc-name">
          <b>{camera.fullName}</b>
          <small>{STATE_TEXT[camera.state]}</small>
        </span>
        {active ? (
          <button type="button" className="lc-btn lc-btn-stop" onClick={stop} disabled={busy}>
            <Icon icon="lucide:square" width="14" height="14" /> Stop
          </button>
        ) : (
          <button type="button" className="lc-btn" onClick={start} disabled={busy || camera.state === 'offline'}>
            <Icon icon="lucide:radio" width="14" height="14" /> Start live
          </button>
        )}
      </div>
    </article>
  );
}

// A signal that fails to send is not worth an error message: the next one carries on.
function sendLiveSignalSafe(id, signal) {
  sendLiveSignal(id, signal).catch(() => {});
}

// THE CCTV WALL: one screen per enforcer.
export default function LiveCameras({ onSessionEnded, onStopped }) {
  const [cameras, setCameras] = useState(null);
  const [iceServers, setIceServers] = useState([]);
  const [error, setError] = useState('');

  const handleError = useCallback(
    (err) => {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      setError(err.message);
    },
    [onSessionEnded]
  );

  const load = useCallback(async () => {
    try {
      const data = await listLive();
      setCameras(data.cameras);
      setIceServers(data.iceServers);
      setError('');
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, LIST_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  return (
    <section className="lc-wall" aria-label="Live cameras">
      {error && <div role="alert" className="ui-message ui-message-error">{error}</div>}
      {cameras && cameras.length === 0 && <div className="lc-none">No enforcer accounts yet.</div>}
      {!cameras && !error && <div className="lc-none">Loading cameras...</div>}
      <div className="lc-grid">
        {(cameras || []).map((camera) => (
          <LiveTile
            key={camera.enforcerId}
            camera={camera}
            iceServers={iceServers}
            onChanged={load}
            onStopped={onStopped}
            onError={handleError}
          />
        ))}
      </div>
    </section>
  );
}
