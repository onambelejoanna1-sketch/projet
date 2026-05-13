import styles from '../Dashboard.module.css';

export default function StatsCards({ stats }) {
  const items = [
    { label: 'Mes signalements', value: stats.total, tone: 'ink' },
    { label: 'En attente', value: stats.pending, tone: 'pending' },
    { label: 'Validés', value: stats.validated, tone: 'validated' },
  ];
  return (
    <section className={styles.statsGrid} aria-label="Mes statistiques">
      {items.map((it) => (
        <article key={it.label} className={`${styles.statCard} ${styles[`stat_${it.tone}`]}`}>
          <p className={styles.statValue}>{it.value}</p>
          <p className={styles.statLabel}>{it.label}</p>
        </article>
      ))}
    </section>
  );
}
