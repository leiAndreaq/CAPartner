import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { loadSession } from '../api';
import { useAlerts } from '../alertsWatcher';
import ConfirmDialog from './ConfirmDialog';
import GatewayToast from './GatewayToast';
import { ALERT_TYPE_LABELS, alertTone, formatDateTime } from '../format';
import './Navbar.css';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;

const NAV_ITEMS = [
  { name: 'Overview', icon: 'lucide:layout-dashboard' },
  { name: 'Monitoring', icon: 'lucide:activity' },
  { name: 'Alerts', icon: 'lucide:siren' },
  { name: 'Camera', icon: 'lucide:video' },
  { name: 'Activity Log', icon: 'lucide:scroll-text', short: 'Activity' },
  { name: 'Settings', icon: 'lucide:settings' },
];

const ALERT_FILTERS = [
  { label: 'All', type: null },
  { label: 'SOS', type: 'sos' },
  { label: 'Health', type: 'health' },
  { label: 'Connection', type: 'connection' },
  { label: 'Device', type: 'device' },
];

const ALERT_ICONS = {
  sos: 'lucide:siren',
  health: 'lucide:heart-pulse',
  connection: 'lucide:wifi-off',
  device: 'lucide:battery-low',
  camera: 'lucide:video',
};

const STATUS_WORDS = { new: 'Waiting', acknowledged: 'Acknowledged', resolved: 'Resolved' };

// The logged-in admin's name and initials, from the login pass.
function adminIdentity() {
  const name = loadSession()?.admin?.fullName || 'Admin';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  return { name, firstName: name.split(/\s+/)[0], initials: initials || 'A' };
}

export default function Navbar({ activeTab = 'Overview', onTabChange, userRole = 'Administrator', onLogout }) {
  const identity = adminIdentity();
  const watcher = useAlerts();
  const [openMenu, setOpenMenu] = useState(null); // 'alerts' | 'profile' | null
  const [alertFilter, setAlertFilter] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const actionsRef = useRef(null);

  // CLOSE MENUS ON A CLICK OUTSIDE OR THE ESCAPE KEY
  useEffect(() => {
    const onClick = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) setOpenMenu(null);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (name) => {
    setOpenMenu(null);
    if (onTabChange) onTabChange(name);
  };

  const summary = watcher?.summary || { open: 0, unacknowledged: 0, unread: 0 };
  const waitingSos = (watcher?.alerts || []).some((a) => a.type === 'sos' && a.status === 'new');
  const alertItems = (watcher?.alerts || []).filter((a) => !alertFilter || a.type === alertFilter).slice(0, 20);
  const hasUnread = (watcher?.alerts || []).some((a) => !a.isRead);

  const markAllRead = () => {
    (watcher?.alerts || []).filter((a) => !a.isRead).forEach((a) => watcher.markRead(a.id));
  };

  const tabCount = (name) => (name === 'Alerts' && summary.unacknowledged > 0 ? summary.unacknowledged : 0);

  // The top bar has no Alerts tab: the red ALERTS button opens the notifications panel instead.
  const topTabs = NAV_ITEMS.filter((item) => item.name !== 'Alerts');

  return (
    <>
      <header className="nb-header">
        <div className="nb-inner">
          {/* LOGO, NAME, ROLE AND DATE */}
          <button type="button" className="nb-brand" onClick={() => go('Overview')} aria-label="CAPartner, go to Overview">
            <img src={capLogo} alt="" className="nb-logo" />
            <span className="nb-brand-text">
              <span className="nb-brand-name">CAPartner</span>
              <span className="nb-role">{userRole}</span>
            </span>
          </button>

          {/* TABS */}
          <nav className="nb-nav" aria-label="Main">
            {topTabs.map((item) => (
              <button
                key={item.name}
                type="button"
                className="nb-tab"
                aria-current={activeTab === item.name ? 'page' : undefined}
                title={item.name}
                onClick={() => go(item.name)}
              >
                <Icon icon={item.icon} width="22" height="22" />
                <span className="nb-tab-label">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* ALERTS BUTTON + PROFILE */}
          <div className="nb-actions" ref={actionsRef}>
            <button
              type="button"
              className={`nb-alerts-button${waitingSos ? ' nb-urgent' : ''}`}
              aria-label={`Notifications, ${summary.open} open alerts`}
              aria-expanded={openMenu === 'alerts'}
              onClick={() => setOpenMenu(openMenu === 'alerts' ? null : 'alerts')}
            >
              <Icon icon="lucide:siren" width="18" height="18" />
              <span>ALERTS</span>
              {summary.open > 0 && <span className="nb-badge">{summary.open > 99 ? '99+' : summary.open}</span>}
            </button>

            <button
              type="button"
              className="nb-avatar-button"
              aria-label={`Account: ${identity.name}`}
              aria-expanded={openMenu === 'profile'}
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            >
              {identity.initials}
            </button>

            {/* NOTIFICATIONS */}
            {openMenu === 'alerts' && (
              <div className="nb-panel nb-alerts-panel" role="dialog" aria-label="Notifications">
                <div className="nb-panel-header">
                  <span className="nb-panel-title">Notifications</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {summary.unacknowledged > 0 ? `${summary.unacknowledged} waiting for acknowledgement` : 'All acknowledged'}
                  </span>
                </div>
                <div className="nb-chips">
                  {ALERT_FILTERS.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      className="nb-chip"
                      aria-pressed={alertFilter === f.type}
                      onClick={() => setAlertFilter(f.type)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="nb-alert-list">
                  {alertItems.length === 0 && <div className="nb-panel-empty">No alerts here.</div>}
                  {alertItems.map((a) => {
                    const tone = alertTone(a.type);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`nb-alert-item${a.isRead ? '' : ' nb-unread'}`}
                        onClick={() => {
                          watcher?.markRead(a.id);
                          go('Alerts');
                        }}
                      >
                        <span className="nb-alert-icon" style={{ background: tone.badgeBg, color: tone.badgeText }}>
                          <Icon icon={ALERT_ICONS[a.type] || 'lucide:bell'} width="16" height="16" />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="nb-alert-title" style={{ display: 'block' }}>
                            {a.type === 'sos' ? 'SOS' : ALERT_TYPE_LABELS[a.type]} · {a.enforcer?.fullName || 'Unknown'}
                          </span>
                          <span className="nb-alert-detail">{a.title}{a.detail ? ` — ${a.detail}` : ''}</span>
                          <span className="nb-alert-meta">
                            <span>{formatDateTime(a.occurredAt)}</span>
                            <span className={`ui-pill ${a.status === 'new' ? 'ui-pill-danger' : a.status === 'acknowledged' ? 'ui-pill-attention' : 'ui-pill-normal'}`}>
                              {STATUS_WORDS[a.status] || a.status}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="nb-panel-footer">
                  <button type="button" className="ui-link" onClick={markAllRead} disabled={!hasUnread} style={{ opacity: hasUnread ? 1 : 0.4 }}>
                    Mark all as read
                  </button>
                  <button type="button" className="ui-button ui-button-primary" onClick={() => go('Alerts')}>
                    Open Alerts page
                  </button>
                </div>
              </div>
            )}

            {/* PROFILE MENU */}
            {openMenu === 'profile' && (
              <div className="nb-panel nb-profile-panel" role="dialog" aria-label="Account">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="nb-avatar" style={{ width: '42px', height: '42px', background: 'var(--green-800)', color: '#ffffff' }}>
                    {identity.initials}
                  </span>
                  <span>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: '0.92rem' }}>{identity.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{userRole}</span>
                  </span>
                </div>
                <button type="button" className="ui-button" style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }} onClick={() => go('Settings')}>
                  <Icon icon="lucide:settings" width="16" /> Settings
                </button>
                <button
                  type="button"
                  className="nb-logout"
                  onClick={() => {
                    setOpenMenu(null);
                    setShowLogoutModal(true);
                  }}
                >
                  <Icon icon="lucide:log-out" width="16" /> Log out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* PHONE BOTTOM MENU */}
      <nav className="nb-bottom-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const count = tabCount(item.name);
          return (
            <button
              key={item.name}
              type="button"
              className="nb-bottom-tab"
              aria-current={activeTab === item.name ? 'page' : undefined}
              onClick={() => go(item.name)}
            >
              <Icon icon={item.icon} width="20" height="20" />
              <span>{item.short || item.name}</span>
              {count > 0 && <span className="nb-tab-count">{count > 99 ? '99+' : count}</span>}
            </button>
          );
        })}
      </nav>

      {/* DATE AND TIME: floating, draggable, click to fold */}
      <GatewayToast />

      {/* LOG OUT CONFIRMATION */}
      {showLogoutModal && (
        <ConfirmDialog
          title="Log out?"
          text="You will stop receiving SOS alerts on this computer until you log in again."
          yesLabel="Log Out"
          noLabel="CANCEL"
          onYes={() => {
            setShowLogoutModal(false);
            if (onLogout) onLogout();
          }}
          onNo={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}
