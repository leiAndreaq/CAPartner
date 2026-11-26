// SMALL HELPERS FOR SHOWING TIMES AND LABELS THE SAME WAY ON EVERY PAGE

export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// "Today 9:35 PM", "Yesterday 4:08 PM", "Oct 21 4:08 PM"
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const day =
    date.toDateString() === today.toDateString()
      ? 'Today'
      : date.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} ${formatTime(date)}`;
}

// "Today · 14:11:30", "Yesterday · 17:02:41", "Oct 21 · 09:05:00" (24-hour clock, like the design)
export function formatDayClock(value) {
  if (!value) return '—';
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const day =
    date.toDateString() === today.toDateString()
      ? 'Today'
      : date.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const clock = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return `${day} · ${clock}`;
}

// "just now", "3 min ago", "2 h ago", "4 days ago"
export function timeAgo(value) {
  if (!value) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} days ago`;
}

export const ALERT_TYPE_LABELS = {
  sos: 'SOS',
  health: 'Health',
  connection: 'Connection',
  device: 'Device',
  camera: 'Camera',
};

export const ALERT_STATUS_LABELS = {
  new: 'New',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

// Colors for an alert's type badge
export function alertTone(type) {
  if (type === 'sos') return { tone: '#ef4444', badgeBg: '#fee2e2', badgeText: '#b91c1c' };
  if (type === 'health') return { tone: '#f59e0b', badgeBg: '#fef3c7', badgeText: '#b45309' };
  return { tone: '#22c55e', badgeBg: '#dcfce7', badgeText: '#15803d' };
}

export function statusTone(status) {
  if (status === 'new') return { bg: '#fee2e2', text: '#b91c1c' };
  if (status === 'acknowledged') return { bg: '#fef3c7', text: '#b45309' };
  return { bg: '#dcfce7', text: '#15803d' };
}

export const CONNECTION_LABELS = { internet: 'Mobile data', lora: 'LoRa radio (backup)', offline: 'No signal' };
