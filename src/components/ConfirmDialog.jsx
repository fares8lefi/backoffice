import { useEffect, useRef, useState } from 'react';

/**
 * Confirmation d'une action sensible. `onConfirm` peut être asynchrone :
 * le dialogue reste ouvert et affiche l'erreur si l'appel échoue.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = 'default',
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      <h2 id="dialog-title" className="dialog__title">
        {title}
      </h2>
      <div className="dialog__body">{children}</div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button
          type="button"
          className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
          onClick={confirm}
          disabled={busy}
        >
          {busy ? 'Un instant…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
