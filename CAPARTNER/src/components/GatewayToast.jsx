import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import './GatewayToast.css';

const STORAGE_KEY = 'capartner-gateway-toast';
const MARGIN = 20;

// PLACEHOLDER STATUS: change these two values to preview ON / OFF.
// Later they will come from the backend (gateway and LoRa last-seen).
const GATEWAY_ON = true;
const LORA_ON = false;

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private window or blocked storage: the toast just forgets its place.
  }
}

// Keep the toast inside the window
function clamp(pos, el) {
  const width = el?.offsetWidth || 0;
  const height = el?.offsetHeight || 0;
  return {
    x: Math.min(Math.max(pos.x, 0), Math.max(window.innerWidth - width, 0)),
    y: Math.min(Math.max(pos.y, 0), Math.max(window.innerHeight - height, 0)),
  };
}

function StatusRow({ label, on }) {
  return (
    <span className="gt-row">
      <span className={`gt-dot ${on ? 'is-on' : 'is-off'}`} />
      <span className="gt-label">{label}</span>
      <b className={on ? 'gt-on' : 'gt-off'}>{on ? 'ON' : 'OFF'}</b>
    </span>
  );
}

// GATEWAY / LORA TOAST: starts at the bottom right, can be dragged anywhere,
// and a click folds it into a small button (click again to open it).
export default function GatewayToast() {
  const gatewayOn = GATEWAY_ON;
  const loraOn = LORA_ON;
  const [open, setOpen] = useState(() => readSaved().open !== false);
  const [pos, setPos] = useState(() => {
    const saved = readSaved();
    return typeof saved.x === 'number' ? { x: saved.x, y: saved.y } : null;
  });
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);
  const drag = useRef(null);

  // First place: bottom right. Later: keep inside the window when it is resized or the toast changes size.
  useEffect(() => {
    const place = () => {
      setPos((current) => {
        const el = ref.current;
        if (!el) return current;
        const start = current || { x: window.innerWidth - el.offsetWidth - MARGIN, y: window.innerHeight - el.offsetHeight - MARGIN };
        return clamp(start, el);
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    save({ ...readSaved(), open: next });
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, startX: event.clientX, startY: event.clientY, moved: false };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 5) return;
    d.moved = true;
    setDragging(true);
    setPos(clamp({ x: event.clientX - d.dx, y: event.clientY - d.dy }, ref.current));
  };

  const onPointerUp = (event) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    ref.current?.releasePointerCapture?.(event.pointerId);
    if (!d) return;
    if (d.moved) save({ ...readSaved(), x: pos?.x, y: pos?.y, open });
    else toggle(); // A click, not a drag: fold or unfold
  };

  const allOn = gatewayOn && loraOn;
  const noneOn = !gatewayOn && !loraOn;
  const tone = allOn ? 'is-on' : noneOn ? 'is-off' : 'is-partial';

  return (
    <div
      ref={ref}
      className={`gt-toast${open ? '' : ' is-folded'}${dragging ? ' is-dragging' : ''}`}
      style={pos ? { left: pos.x, top: pos.y } : { visibility: 'hidden' }}
      role="button"
      tabIndex={0}
      aria-label={`Gateway ${gatewayOn ? 'on' : 'off'}, LoRa ${loraOn ? 'on' : 'off'}. ${open ? 'Click to hide, drag to move.' : 'Click to show.'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      {open ? (
        <span className="gt-rows">
          <StatusRow label="Gateway" on={gatewayOn} />
          <StatusRow label="LoRa" on={loraOn} />
        </span>
      ) : (
        <span className={`gt-folded ${tone}`}>
          <Icon icon="lucide:radio-tower" width={22} height={22} />
          <span className={`gt-dot ${tone}`} />
        </span>
      )}
    </div>
  );
}
