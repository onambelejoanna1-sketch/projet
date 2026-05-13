import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import styles from './RejectModal.module.css';

export default function RejectModal({ open, alert, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    const trimmed = reason.trim();
    if (trimmed.length < 3) return;
    onConfirm(trimmed);
  }

  return (
    <Modal open={open} onClose={onClose} title="Rejeter le signalement" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        {alert && (
          <div className={styles.context}>
            <strong className={styles.contextTitle}>{alert.title}</strong>
            <span className={styles.contextSub}>signalement #{alert.id}</span>
          </div>
        )}
        <label className={styles.label} htmlFor="reject-reason">
          Motif de rejet
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder="Ex : doublon, information non vérifiable, hors zone…"
        />
        {touched && reason.trim().length < 3 && (
          <p className={styles.error}>
            Merci de préciser un motif (3 caractères minimum).
          </p>
        )}
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="clay">
            Confirmer le rejet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
