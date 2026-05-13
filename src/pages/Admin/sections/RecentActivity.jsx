import { timeSinceISO } from '@/utils/dates';
import styles from '../AdminDashboard.module.css';

const ACTION_LABELS = {
  validate: 'Validation',
  reject: 'Rejet',
  auto_validate: 'Validation automatique',
  delete: 'Suppression',
  create_sensor: 'Création capteur',
  update_sensor: 'Mise à jour capteur',
  delete_sensor: 'Suppression capteur',
};

export default function RecentActivity({ activity }) {
  if (!activity || activity.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Activité récente</h2>
        </header>
        <div className={styles.empty}>
          <p>Aucune action enregistrée pour le moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Activité récente</h2>
        <span className={styles.panelHint}>Vos actions</span>
      </header>
      <ol className={styles.timeline}>
        {activity.map((it) => {
          const action = ACTION_LABELS[it.action] || it.action;
          return (
            <li key={it.id} className={styles.timelineRow}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div className={styles.timelineBody}>
                <p className={styles.timelineMain}>
                  <strong>{it.actorName || it.actorUid}</strong> · {action}
                  {it.targetTitle && (
                    <span className={styles.timelineTarget}> « {it.targetTitle} »</span>
                  )}
                </p>
                <p className={styles.timelineMeta}>{timeSinceISO(it.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
