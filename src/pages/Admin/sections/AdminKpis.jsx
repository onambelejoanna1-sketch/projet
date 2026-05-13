import styles from '../AdminDashboard.module.css';

export default function AdminKpis({ stats }) {
  const items = [
    { label: 'Signalements totaux', value: stats.totalReports, tone: 'ink' },
    { label: 'En attente', value: stats.pending, tone: 'pending' },
    { label: 'Validés aujourd’hui', value: stats.validatedToday, tone: 'validated' },
    { label: 'Utilisateurs', value: stats.users, tone: 'clay' },
  ];
  return (
    <section className={styles.kpiGrid} aria-label="Indicateurs clés">
      {items.map((it) => (
        <article key={it.label} className={`${styles.kpi} ${styles[`kpi_${it.tone}`]}`}>
          <p className={styles.kpiValue}>{it.value}</p>
          <p className={styles.kpiLabel}>{it.label}</p>
        </article>
      ))}
    </section>
  );
}
