import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../UserAlerts.module.css';

export default function AlertsFeed({ feed, hasFilters }) {
  if (!feed.length) {
    return (
      <section className={styles.feedPanel}>
        <header className={styles.feedHead}>
          <h2 className={styles.feedTitle}>Aucune alerte</h2>
        </header>
        <div className={styles.empty}>
          <p>
            {hasFilters
              ? 'Aucune alerte ne correspond aux filtres sélectionnés.'
              : 'Aucune alerte active pour le moment.'}
          </p>
          <p className={styles.emptyHint}>
            {hasFilters
              ? 'Essayez de relâcher certains filtres.'
              : 'Les nouvelles alertes apparaîtront automatiquement ici.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.feedPanel}>
      <header className={styles.feedHead}>
        <h2 className={styles.feedTitle}>Flux d&rsquo;alertes</h2>
        <span className={styles.feedCount}>{feed.length} entrées</span>
      </header>
      <div className={styles.grid}>
        {feed.map((alert) => (
          <AlertCard key={alert.id} alert={alert} variant="compact" />
        ))}
      </div>
    </section>
  );
}
