import Badge from '@/components/common/Badge/Badge';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import styles from '../Dashboard.module.css';

const STATUS_TONES = {
  pending: 'pending',
  validated: 'validated',
  rejected: 'neutral',
};

const STATUS_LABELS = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
};

export default function MyReportsList({ reports }) {
  if (!reports.length) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Mes derniers signalements</h2>
        </header>
        <div className={styles.empty}>
          <p>Aucun signalement pour le moment.</p>
          <p className={styles.emptyHint}>Vos prochaines alertes apparaîtront ici.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Mes derniers signalements</h2>
        <span className={styles.panelHint}>Derniers {reports.length}</span>
      </header>
      <ul className={styles.reportList}>
        {reports.map((r) => {
          const sev = severityInfo(r.severity);
          return (
            <li key={r.id} className={styles.reportRow}>
              <div className={styles.reportMain}>
                <p className={styles.reportTitle}>{r.title}</p>
                <p className={styles.reportMeta}>
                  <span>{disasterLabel(r.type)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{zoneName(r.quartierId)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeSinceISO(r.createdAt)}</span>
                </p>
              </div>
              <div className={styles.reportSide}>
                <span
                  className={styles.severityDot}
                  style={{ backgroundColor: sev.color }}
                  aria-label={`Gravité ${sev.label}`}
                />
                <Badge tone={STATUS_TONES[r.status]} dot>
                  {STATUS_LABELS[r.status]}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
