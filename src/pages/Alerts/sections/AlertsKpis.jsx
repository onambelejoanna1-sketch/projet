import styles from '../UserAlerts.module.css';

export default function AlertsKpis({ kpis }) {
  return (
    <section className={styles.kpiGrid}>
      <div className={styles.kpi}>
        <p className={styles.kpiValue}>{kpis.active}</p>
        <p className={styles.kpiLabel}>Alertes actives</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>Critiques</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_sensors}`}>
        <p className={styles.kpiValue}>{kpis.sensorsLive}</p>
        <p className={styles.kpiLabel}>Capteurs en alerte</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_zones}`}>
        <p className={styles.kpiValue}>{kpis.zones}</p>
        <p className={styles.kpiLabel}>Zones impactées</p>
      </div>
    </section>
  );
}
