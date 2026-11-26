import { useEffect } from 'react';
import './ConfirmDialog.css';

// "ARE YOU SURE?" POP-UP, from the Figma design (Delete / Add / Clear / Export).
// Escape or a click outside counts as No.
export default function ConfirmDialog({ title, text, yesLabel, noLabel = 'Cancel', danger = false, onYes, onNo }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onNo();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNo]);

  return (
    <div className="cd-backdrop" onClick={onNo}>
      <div className="cd-dialog" role="alertdialog" aria-labelledby="cd-title" aria-describedby="cd-text" onClick={(e) => e.stopPropagation()}>
        <h2 id="cd-title">{title}</h2>
        <p id="cd-text">{text}</p>
        <div className="cd-buttons">
          <button type="button" className={`cd-yes${danger ? ' cd-yes-danger' : ''}`} onClick={onYes} autoFocus>
            {yesLabel}
          </button>
          <button type="button" className="cd-no" onClick={onNo}>
            {noLabel}
          </button>
        </div>
        <div className="cd-bar" />
      </div>
    </div>
  );
}
