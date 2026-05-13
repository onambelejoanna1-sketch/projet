import styles from '../AdminAlerts.module.css';

export default function AlertsKpisAdmin({ kpis }) {
  return (
    <section className={styles.kpiGrid}>
      <div className={`${styles.kpi} ${styles.kpi_pending}`}>
        <p className={styles.kpiValue}>{kpis.pending}</p>
        <p className={styles.kpiLabel}>En attente</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_validated}`}>
        <p className={styles.kpiValue}>{kpis.validatedToday}</p>
        <p className={styles.kpiLabel}>Validées aujourd&rsquo;hui</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_sensors}`}>
        <p className={styles.kpiValue}>{kpis.sensorsLive}</p>
        <p className={styles.kpiLabel}>Capteurs en alerte</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>Critiques</p>
      </div>
    </section>
  );
}
