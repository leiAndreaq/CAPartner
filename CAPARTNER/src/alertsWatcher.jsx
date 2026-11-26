// LIVE ALERTS FOR THE WHOLE APP
// Polls the backend every few seconds while the admin is logged in, so a new SOS shows up on any
// page without reloading. Plays the siren (if the admin's "Audible siren" preference is on) when a
// new SOS arrives, and repeats it while that SOS is still unacknowledged and not muted.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  listAlerts,
  markAlertRead,
  acknowledgeAlert,
  dispatchAlert,
  resolveAlert,
  getPreferences,
  getOverview,
} from './api';

const POLL_MS = 5000;
const CAPS_POLL_MS = 15000;
const SIREN_REPEAT_MS = 15000;

const AlertsContext = createContext(null);

export function useAlerts() {
  return useContext(AlertsContext);
}

// A two-tone siren made in the browser (no sound file needed). About 2.4 seconds long.
function playSiren(audioContext) {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
  gain.gain.setValueAtTime(0.25, now + 2.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
  gain.connect(audioContext.destination);

  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sawtooth';
  for (let i = 0; i < 6; i++) {
    oscillator.frequency.setValueAtTime(i % 2 === 0 ? 960 : 720, now + i * 0.4);
  }
  oscillator.connect(gain);
  oscillator.start(now);
  oscillator.stop(now + 2.4);
}

export function AlertsProvider({ isLoggedIn, onSessionEnded, children }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ open: 0, unacknowledged: 0, openSos: 0, unread: 0, latestId: 0 });
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState('');
  // For the status strip under the top bar: is the backend answering, and how many caps are online.
  const [serverOk, setServerOk] = useState(null);
  const [capsOnline, setCapsOnline] = useState(null); // { online, total }
  // SOS alerts this admin closed the pop-up for (they stay in the list until acknowledged).
  const [mutedIds, setMutedIds] = useState(() => new Set());
  // Browsers only allow sound after the user has clicked or typed on the page once.
  const [soundReady, setSoundReady] = useState(false);

  const audioRef = useRef(null);
  const lastSeenIdRef = useRef(null);
  const lastSirenRef = useRef(0);
  const sessionEndedRef = useRef(onSessionEnded);
  useEffect(() => {
    sessionEndedRef.current = onSessionEnded;
  }, [onSessionEnded]);

  // UNLOCK SOUND ON THE FIRST CLICK OR KEY PRESS
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioRef.current.resume().then(() => setSoundReady(true)).catch(() => {});
      } catch {
        // No sound support: the pop-up still shows.
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const handleError = useCallback((err) => {
    if (err.status === 401) {
      sessionEndedRef.current?.('Your login ended. Please log in again.');
      return;
    }
    if (err.status === 0 || err.status >= 500 || err.status === 404) setServerOk(false);
    setError(err.message);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await listAlerts({ limit: 50 });
      setAlerts(data.alerts);
      setSummary(data.summary);
      setError('');
      setServerOk(true);
      return data;
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError]);

  const reloadPreferences = useCallback(async () => {
    try {
      setPreferences(await getPreferences());
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // POLLING WHILE LOGGED IN
  useEffect(() => {
    if (!isLoggedIn) {
      lastSeenIdRef.current = null;
      return undefined;
    }
    let stopped = false;

    const tick = async () => {
      const data = await refresh();
      if (stopped || !data) return;
      const previous = lastSeenIdRef.current;
      lastSeenIdRef.current = data.summary.latestId;
      // First poll after login: no siren for old alerts (the pop-up still shows open SOS).
      if (previous === null) return;
      const newSos = data.alerts.filter((a) => a.id > previous && a.type === 'sos');
      if (newSos.length > 0) {
        lastSirenRef.current = 0; // ring right away
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const a = newSos[0];
          try {
            new Notification('CAPartner SOS', {
              body: `${a.enforcer?.fullName || 'An enforcer'}${a.capCode ? ` (${a.capCode})` : ''}: ${a.title}`,
            });
          } catch {
            // Notifications blocked
          }
        }
      }
    };

    getPreferences().then((p) => !stopped && setPreferences(p)).catch(() => {});
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isLoggedIn, refresh]);

  // CAPS ONLINE, FOR THE STATUS STRIP (less often than alerts)
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let stopped = false;
    const tick = () =>
      getOverview()
        .then((ov) => !stopped && setCapsOnline({ online: ov.counts.online, total: ov.counts.caps }))
        .catch(() => {});
    tick();
    const timer = setInterval(tick, CAPS_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isLoggedIn]);

  // The SOS to show in the pop-up: the newest unacknowledged one that was not muted.
  const activeSos = alerts.find((a) => a.type === 'sos' && a.status === 'new' && !mutedIds.has(a.id)) || null;
  const desktopNotifications = preferences?.desktopNotifications;

  // SIREN WHILE AN SOS IS WAITING FOR ACKNOWLEDGEMENT
  useEffect(() => {
    if (!activeSos || !preferences?.audibleSiren || !soundReady || !audioRef.current) return undefined;
    const ring = () => {
      if (Date.now() - lastSirenRef.current < SIREN_REPEAT_MS - 500) return;
      lastSirenRef.current = Date.now();
      try {
        playSiren(audioRef.current);
      } catch {
        // Sound failed: the pop-up still shows.
      }
    };
    ring();
    const timer = setInterval(ring, 1000);
    return () => clearInterval(timer);
  }, [activeSos, preferences?.audibleSiren, soundReady]);

  // Ask once for desktop notifications, if the admin turned them on.
  useEffect(() => {
    if (desktopNotifications && soundReady && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [desktopNotifications, soundReady]);

  // ACTIONS: call the backend, then refresh the list. Returns the error text, or '' when done.
  const run = useCallback(
    async (call, id) => {
      try {
        await call(id);
        await refresh();
        return '';
      } catch (err) {
        if (err.status === 401) {
          handleError(err);
          return '';
        }
        await refresh();
        return err.message;
      }
    },
    [refresh, handleError]
  );

  const value = {
    alerts,
    summary,
    error,
    activeSos,
    preferences,
    serverOk,
    capsOnline,
    soundReady,
    sirenOn: Boolean(preferences?.audibleSiren),
    refresh,
    reloadPreferences,
    setPreferences,
    mute: (id) => setMutedIds((prev) => new Set(prev).add(id)),
    markRead: (id) => run(markAlertRead, id),
    acknowledge: (id) => run(acknowledgeAlert, id),
    dispatch: (id) => run(dispatchAlert, id),
    resolve: (id) => run(resolveAlert, id),
  };

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}
