import styles from '../AdminPending.module.css';

export default function PendingKpis({ kpis }) {
  return (
    <section className={styles.kpiGrid}>
      <div className={`${styles.kpi} ${styles.kpi_pending}`}>
        <p className={styles.kpiValue}>{kpis.pending}</p>
        <p className={styles.kpiLabel}>En attente</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>Critiques</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_recent}`}>
        <p className={styles.kpiValue}>{kpis.last24h}</p>
        <p className={styles.kpiLabel}>Reçus &lt; 24 h</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_oldest}`}>
        <p className={styles.kpiValue}>
          {kpis.oldestDays}
          <span style={{ fontSize: '0.5em', marginLeft: '0.25rem' }}>
            {kpis.oldestDays > 1 ? 'jrs' : 'jr'}
          </span>
        </p>
        <p className={styles.kpiLabel}>Plus ancien</p>
      </div>
    </section>
  );
}
