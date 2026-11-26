import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import LiveCameras from '../components/LiveCameras';
import { listMedia, listEnforcers, fetchMediaUrl, deleteMedia } from '../api';
import { formatDateTime } from '../format';
import './CameraPage.css';

const PAGE_SIZE = 12;

// Icons from the Figma design (downloaded into src/assets/camera)
const asset = (name) => new URL(`../assets/camera/${name}`, import.meta.url).href;
const ICON = {
  pageNext: asset('page-next.png'),
  pageLast: asset('page-last.png'),
  search: asset('search.png'),
  exportClip: asset('export.svg'),
  play: asset('play.svg'),
  noSignal: asset('no-signal.svg'),
};

function formatSize(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

// CAMERA PAGE: video clips recorded on the enforcers' phones. Live streaming is not part of the system.
export default function CameraPage({ onTabChange, onLogout, onSessionEnded }) {
  const [clips, setClips] = useState([]);
  const [enforcerNames, setEnforcerNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [enforcerFilter, setEnforcerFilter] = useState('');
  const [search, setSearch] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  // clipToExport = the "Are you sure?" pop-up for Export clip
  const [clipToExport, setClipToExport] = useState(null);
  // clipToDelete = the "Are you sure?" pop-up for Delete clip (permanent)
  const [clipToDelete, setClipToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const urlRef = useRef('');

  const handleError = useCallback(
    (err, show) => {
      if (err.status === 401 && onSessionEnded) {
        onSessionEnded('Your login ended. Please log in again.');
        return;
      }
      show(err.message);
    },
    [onSessionEnded]
  );

  const load = useCallback(async () => {
    try {
      setClips(await listMedia());
      // Every enforcer gets a filter button, even one with no clips yet.
      listEnforcers()
        .then((data) => setEnforcerNames(data.enforcers.map((e) => e.fullName)))
        .catch(() => {});
      setError('');
    } catch (err) {
      handleError(err, setError);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  // AUTO REFRESH: reload only the clip list (not the enforcer names). Skips if the last call is still
  // running, and the state is only changed when the list really changed, so the page does not flicker.
  const refreshing = useRef(false);
  const refreshFailed = useRef(false);
  const lastListRef = useRef('');
  const refreshClips = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const list = await listMedia();
      const text = JSON.stringify(list);
      if (text !== lastListRef.current) {
        lastListRef.current = text;
        setClips(list);
      }
      // Only remove an error that an earlier refresh caused. Errors from Delete / Export stay visible.
      if (refreshFailed.current) {
        refreshFailed.current = false;
        setError('');
      }
    } catch (err) {
      refreshFailed.current = true;
      handleError(err, setError);
    } finally {
      refreshing.current = false;
    }
  }, [handleError]);

  // Every 1 second while this tab of the browser is visible
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) refreshClips();
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshClips]);

  // Free the downloaded video when leaving the page.
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  // A live just stopped: the phone uploads its recording, so check for it a few times.
  const watchForRecording = useCallback(() => {
    [4000, 10000, 20000, 40000].forEach((ms) => setTimeout(load, ms));
  }, [load]);

  const play = async (clip) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setVideoUrl('');
    setSelected(clip);
    setVideoError('');
    if (clip.upload_status !== 'uploaded') {
      setVideoError('This clip has not finished uploading from the phone.');
      return;
    }
    setIsVideoLoading(true);
    try {
      const url = await fetchMediaUrl(clip.id);
      urlRef.current = url;
      setVideoUrl(url);
    } catch (err) {
      handleError(err, setVideoError);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const closePlayer = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setVideoUrl('');
    setVideoError('');
    setSelected(null);
  }, []);

  // Escape closes the player
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closePlayer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected, closePlayer]);

  // EXPORT CLIP: save the video file to this computer
  const exportClip = async (clip) => {
    if (clip.upload_status !== 'uploaded') {
      setError('This clip has not finished uploading from the phone.');
      return;
    }
    try {
      const url = await fetchMediaUrl(clip.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clip.cap_code || 'clip'}-${clip.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      handleError(err, setError);
    } finally {
      refreshClips();
    }
  };

  // DELETE CLIP: removes the video from the server for good
  const deleteClip = async (clip) => {
    setIsDeleting(true);
    try {
      await deleteMedia(clip.id);
      if (selected?.id === clip.id) closePlayer();
      setClips((current) => current.filter((c) => c.id !== clip.id));
      setError('');
    } catch (err) {
      handleError(err, setError);
    } finally {
      setIsDeleting(false);
      setClipToDelete(null);
      refreshClips();
    }
  };

  const enforcers = [...new Set([...enforcerNames, ...clips.map((c) => c.enforcer).filter(Boolean)])].sort();
  const needle = search.trim().toLowerCase();
  const filtered = clips
    .filter((c) => !enforcerFilter || c.enforcer === enforcerFilter)
    .filter((c) => !needle || `${c.enforcer || ''} ${c.cap_code || ''} ${c.id}`.toLowerCase().includes(needle))
    .sort((a, b) => (newestFirst ? 1 : -1) * (new Date(b.recorded_at) - new Date(a.recorded_at)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const waiting = clips.filter((c) => c.upload_status !== 'uploaded').length;

  // A colored tag per enforcer, like the design
  const tagClass = (name) => `cam-tag cam-tag-${enforcers.indexOf(name) % 3}`;

  return (
    <div className="ui-page cam-page">
      <Navbar activeTab="Camera" onTabChange={onTabChange} onLogout={onLogout} />

      <main className="ui-main">
        <div className="ui-page-header">
          <div>
            <h1 className="ui-title">Camera</h1>
            <p className="ui-subtitle">Watch the enforcers' cameras live. When a live stops, the recording is saved below.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="ui-message ui-message-error">
            {error}
          </div>
        )}

        {/* LIVE CAMERAS */}
        <LiveCameras onSessionEnded={onSessionEnded} onStopped={watchForRecording} />

        <h2 className="cam-heading">Video Record Clips</h2>

        {/* FILTERS */}
        <div className="cam-filters">
          <div className="cam-chips">
            <button type="button" className={`cam-chip${enforcerFilter === '' ? ' is-active' : ''}`} onClick={() => { setEnforcerFilter(''); setPage(1); }}>
              All
            </button>
            {enforcers.map((name) => (
              <button
                key={name}
                type="button"
                className={`cam-chip${enforcerFilter === name ? ' is-active' : ''}`}
                onClick={() => { setEnforcerFilter(name); setPage(1); }}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="cam-search">
            <img src={ICON.search} alt="" />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search clips"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </label>
          <div className="cam-sort">
            <span>Filter:</span>
            <button type="button" onClick={() => setNewestFirst(!newestFirst)}>
              Time &amp; Date {newestFirst ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* CLIP LIST */}
        <div className="cam-list-head">
          <h3>Saved recordings</h3>
          <p>
            {filtered.length} clip{filtered.length === 1 ? '' : 's'}
            {waiting > 0 ? ` · ${waiting} still uploading from the phone` : ''}
          </p>
        </div>
        <div className="cam-list">
          {shown.length === 0 && (
            <div className="cam-empty">{isLoading
                ? 'Loading clips...'
                : needle
                  ? 'No clips match your search.'
                  : enforcerFilter
                    ? `${enforcerFilter} has no video clips yet.`
                    : 'No video clips yet.'}</div>
          )}
          {shown.map((clip) => {
            const isSelected = selected?.id === clip.id;
            return (
              <div key={clip.id} className={`cam-row${isSelected ? ' is-selected' : ''}`} onClick={() => play(clip)}>
                <button type="button" className="cam-thumb" onClick={() => play(clip)} aria-label={`Play clip ${clip.id}`}>
                  <span><img src={ICON.play} alt="" width="10" height="10" /></span>
                </button>
                <div className="cam-row-main">
                  <b>{clip.enforcer || 'Unknown'}{clip.cap_code ? ` · ${clip.cap_code}` : ''}</b>
                  <span className="cam-mono">
                    {formatDateTime(clip.recorded_at)} · {formatDuration(clip.duration_seconds)} · {formatSize(clip.size_bytes)}
                  </span>
                  <span className="cam-row-tags">
                    {clip.enforcer && <span className={tagClass(clip.enforcer)}>{clip.enforcer}</span>}
                    {clip.upload_status !== 'uploaded' && <span className="cam-tag cam-tag-wait">{clip.upload_status}</span>}
                  </span>
                </div>
                <div className="cam-actions">
                  <button
                    type="button"
                    className="cam-export"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClipToExport(clip);
                    }}
                    disabled={clip.upload_status !== 'uploaded'}
                  >
                    <img src={ICON.exportClip} alt="" width="14" height="14" /> Export clip
                  </button>
                  <button
                    type="button"
                    className="cam-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClipToDelete(clip);
                    }}
                  >
                    <Icon icon="lucide:trash-2" width="14" height="14" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGES */}
        {pages > 1 && (
          <nav className="cam-pages" aria-label="Pages">
            <button type="button" disabled={page === 1} onClick={() => setPage(1)} aria-label="First page">
              <img src={ICON.pageLast} alt="" className="is-flipped" />
            </button>
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <img src={ICON.pageNext} alt="" className="is-flipped" />
            </button>
            <span className="cam-page-number">{page}</span>
            <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <img src={ICON.pageNext} alt="" />
            </button>
            <button type="button" disabled={page === pages} onClick={() => setPage(pages)} aria-label="Last page">
              <img src={ICON.pageLast} alt="" />
            </button>
          </nav>
        )}
      </main>


      {/* CLIP PLAYER POP-UP */}
      {selected && (
        <div className="cam-backdrop" onClick={closePlayer}>
          <div className="cam-modal" role="dialog" aria-modal="true" aria-label="Clip player" onClick={(e) => e.stopPropagation()}>
            <div className="cam-modal-head">
              <div>
                <h3>{selected.enforcer || 'Unknown enforcer'}{selected.cap_code ? ` · ${selected.cap_code}` : ''}</h3>
                <p className="cam-mono">
                  Recorded {formatDateTime(selected.recorded_at)} · {formatDuration(selected.duration_seconds)} · {formatSize(selected.size_bytes)}
                  {selected.alert_id ? ` · linked to alert #${selected.alert_id}` : ''}
                </p>
              </div>
              <button type="button" className="cam-modal-close" onClick={closePlayer} aria-label="Close player">
                <Icon icon="lucide:x" width="20" height="20" />
              </button>
            </div>
            <div className="cam-screen">
              {videoUrl ? (
                <video key={videoUrl} src={videoUrl} controls autoPlay />
              ) : (
                <div className="cam-screen-empty">
                  <img src={ICON.noSignal} alt="" width="24" height="24" />
                  <span>{isVideoLoading ? 'Loading clip...' : videoError || 'Loading clip...'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {clipToExport && (
        <ConfirmDialog
          title="Are you sure?"
          text="Are you sure you want to EXPORT this clip? The video is saved to this computer."
          yesLabel="Export"
          noLabel="CANCEL"
          onYes={() => {
            const clip = clipToExport;
            setClipToExport(null);
            exportClip(clip);
          }}
          onNo={() => setClipToExport(null)}
        />
      )}

      {clipToDelete && (
        <ConfirmDialog
          danger
          title="Delete this clip?"
          text={`This permanently deletes the clip from ${clipToDelete.enforcer || 'an enforcer'} (${formatDateTime(clipToDelete.recorded_at)}). The video cannot be recovered.`}
          yesLabel={isDeleting ? 'Deleting...' : 'Delete'}
          noLabel="CANCEL"
          onYes={() => {
            if (!isDeleting) deleteClip(clipToDelete);
          }}
          onNo={() => {
            if (!isDeleting) setClipToDelete(null);
          }}
        />
      )}
    </div>
  );
}
