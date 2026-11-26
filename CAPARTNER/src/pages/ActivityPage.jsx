import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import { listAudit } from '../api';
import './ActivityPage.css';

const PAGE_SIZE = 6; // 6 rows per page, then the next page

// Icons from the Figma design (downloaded into src/assets/activity)
const asset = (name) => new URL(`../assets/activity/${name}`, import.meta.url).href;
const ICON = {
  signIn: asset('sign-in.svg'),
  signOut: asset('sign-out.svg'),
  alert: asset('alert.svg'),
  settings: asset('settings.svg'),
  failed: asset('failed.svg'),
  locked: asset('locked.svg'),
};

// "enforcer_force_logout" -> "Enforcer force logout"
function typeLabel(type) {
  const text = type.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Icon and color for one kind of entry
function typeLook(type) {
  if (/failed|blocked|expired|unknown/.test(type)) return { icon: ICON.failed, tone: 'red' };
  if (/locked/.test(type)) return { icon: ICON.locked, tone: 'amber' };
  if (/setting|preference/.test(type)) return { icon: ICON.settings, tone: 'amber' };
  if (/^alert_|sos/.test(type)) return { icon: ICON.alert, tone: 'green' };
  if (/logout|sign_?out/.test(type)) return { icon: ICON.signOut, tone: 'grey' };
  return { icon: ICON.signIn, tone: 'grey' };
}

// "Today · 13 Sep", "Yesterday · 12 Sep" or "11 Sep 2026": the heading of a day
function dayHeading(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dayMonth = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (date.toDateString() === today.toDateString()) return `Today · ${dayMonth}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${dayMonth}`;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function clockText(value) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ACTIVITY PAGE: the audit log (who did what), newest first, grouped by day.
export default function ActivityPage({ onTabChange, onLogout, onSessionEnded }) {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await listAudit({ type, page, limit: PAGE_SIZE }));
      setError('');
    } catch (err) {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      setError(err.message);
    }
  }, [type, page, onSessionEnded]);

  // Load now, then refresh by itself every 5 seconds
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const pages = data?.pages || 1;
  const needle = search.trim().toLowerCase();
  // The search looks through the entries of the page that is open.
  const entries = (data?.entries || []).filter(
    (e) => !needle || `${typeLabel(e.type)} ${e.description} ${e.actor.name} ${e.target || ''}`.toLowerCase().includes(needle)
  );
  const firstNumber = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastNumber = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  // Group the entries by day, keeping the order
  const groups = [];
  for (const entry of entries) {
    const heading = dayHeading(entry.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  }

  return (
    <div className="ui-page act-page">
      <Navbar activeTab="Activity Log" onTabChange={onTabChange} onLogout={onLogout} />

      <main className="act-main ui-main">
        <div className="act-header">
          <div>
            <h1 className="act-title">Activity Log</h1>
            <p className="act-subtitle">A permanent record of sign-ins, alerts and changes. Entries cannot be edited or deleted.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="ui-message ui-message-error">
            {error}
          </div>
        )}

        <section className="act-card">
          {/* TOOLBAR */}
          <div className="act-toolbar">
            <label className="act-search">
              <Icon icon="lucide:search" width="16" height="16" />
              <input
                type="search"
                placeholder="Search this page..."
                aria-label="Search entries"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="act-type">
              <span>Action type</span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All actions</option>
                {(data?.types || []).map((t) => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </select>
            </label>
          </div>

          {/* COLUMN HEADINGS */}
          <div className="act-cols" aria-hidden="true">
            <span>Time</span>
            <span />
            <span>Event</span>
            <span>Performed by</span>
          </div>

          {/* ENTRIES, GROUPED BY DAY */}
          <div className="act-list">
            {entries.length === 0 && (
              <div className="act-empty">
                {!data ? 'Loading...' : needle ? 'No entries on this page match your search.' : 'No entries.'}
              </div>
            )}
            {groups.map((group) => (
              <div key={group.heading}>
                <div className="act-day">{group.heading}</div>
                {group.items.map((e) => {
                  const look = typeLook(e.type);
                  return (
                    <div key={e.id} className="act-row">
                      <div className="act-when">{clockText(e.occurredAt)}</div>
                      <span className={`act-icon act-icon-${look.tone}`}>
                        <img src={look.icon} alt="" width="20" height="20" />
                      </span>
                      <div className="act-what">
                        <b>{typeLabel(e.type)}</b>
                        <span>{e.description}{e.target ? ` · ${e.target}` : ''}</span>
                      </div>
                      <div className="act-by">
                        <b>{e.actor.name}</b>
                        <small>{e.actor.kind}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* PAGING: "Showing 1–6 of 89" on the left, square buttons on the right */}
        <div className="act-paging">
          <p className="act-of">
            {data
              ? data.total === 0
                ? 'No entries'
                : <>Showing <b>{firstNumber}–{lastNumber}</b> of <b>{data.total}</b></>
              : 'Loading...'}
          </p>
          <nav className="act-pages" aria-label="Pages">
            <button type="button" disabled={page === 1} onClick={() => setPage(1)} aria-label="First page">
              <Icon icon="lucide:chevrons-left" width="18" height="18" />
            </button>
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <Icon icon="lucide:chevron-left" width="18" height="18" />
            </button>
            <span className="act-page-number" aria-current="page">{page}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <Icon icon="lucide:chevron-right" width="18" height="18" />
            </button>
            <button type="button" disabled={page >= pages} onClick={() => setPage(pages)} aria-label="Last page">
              <Icon icon="lucide:chevrons-right" width="18" height="18" />
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}
