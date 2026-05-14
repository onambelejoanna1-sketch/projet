import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import { rejectDisaster, validateDisaster } from '@/services/api';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import styles from '../AdminDashboard.module.css';

export default function PendingQueue({ pending, onChanged }) {
  const { notify } = useToast();
  const [pendingIds, setPendingIds] = useState(() => new Set());

  async function handle(id, action, title) {
    setPendingIds((curr) => new Set([...curr, id]));
    try {
      if (action === 'validate') {
        await validateDisaster(id);
        notify({ tone: 'success', title: 'Signalement validé', body: title });
      } else {
        const reason = window.prompt('Motif du rejet ?', 'Doublon avec un signalement existant.');
        if (!reason) {
          setPendingIds((curr) => {
            const next = new Set(curr);
            next.delete(id);
            return next;
          });
          return;
        }
        await rejectDisaster(id, reason);
        notify({ tone: 'info', title: 'Signalement rejeté', body: title });
      }
      onChanged?.();
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Action impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
      setPendingIds((curr) => {
        const next = new Set(curr);
        next.delete(id);
        return next;
      });
    }
  }

  const visible = pending;

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>À valider</h2>
        <span className={styles.panelHint}>{visible.length} en attente</span>
      </header>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun signalement à traiter.</p>
          <p className={styles.emptyHint}>La file est vide. Bon travail !</p>
        </div>
      ) : (
        <ul className={styles.queueList}>
          {visible.map((r) => {
            const sev = severityInfo(r.severity);
            const busy = pendingIds.has(r.id);
            return (
              <li key={r.id} className={styles.queueRow}>
                <div className={styles.queueMain}>
                  <div className={styles.queueHead}>
                    <span
                      className={styles.severityPill}
                      style={{ backgroundColor: sev.color }}
                    >
                      {SEVERITY_LABEL[r.severity]}
                    </span>
                    <span className={styles.queueTime}>{timeSinceISO(r.createdAt)}</span>
                  </div>
                  <p className={styles.queueTitle}>{r.title}</p>
                  <p className={styles.queueMeta}>
                    <span>{disasterLabel(r.type)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{zoneName(r.quartierId)}</span>
                  </p>
                </div>
                <div className={styles.queueActions}>
                  <button
                    type="button"
                    onClick={() => handle(r.id, 'validate', r.title)}
                    disabled={busy}
                    className={`${styles.btn} ${styles.btnValidate}`}
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => handle(r.id, 'reject', r.title)}
                    disabled={busy}
                    className={`${styles.btn} ${styles.btnReject}`}
                  >
                    Rejeter
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
