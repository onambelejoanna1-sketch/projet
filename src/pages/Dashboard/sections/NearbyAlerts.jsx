import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import styles from '../Dashboard.module.css';

export default function NearbyAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Alertes actives</h2>
          <span className={styles.panelHint}>Près de vous</span>
        </header>
        <div className={styles.empty}>
          <p>Aucune alerte active.</p>
          <p className={styles.emptyHint}>Soyez prudent et restez vigilant.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Alertes actives</h2>
        <span className={styles.panelHint}>Près de vous</span>
      </header>
      <div className={styles.alertGrid}>
        {alerts.map((a) => {
          const sev = severityInfo(a.severity);
          return (
            <article key={a.id} className={styles.alertCard}>
              <div className={styles.alertHead}>
                <span
                  className={styles.severityPill}
                  style={{ backgroundColor: sev.color }}
                >
                  {SEVERITY_LABEL[a.severity]}
                </span>
                <span className={styles.alertTime}>
                  {timeSinceISO(a.createdAt)}
                </span>
              </div>
              <h3 className={styles.alertTitle}>{a.title}</h3>
              <p className={styles.alertMeta}>
                <span>{disasterLabel(a.type)}</span>
                <span aria-hidden="true">·</span>
                <span>{zoneName(a.quartierId)}</span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
