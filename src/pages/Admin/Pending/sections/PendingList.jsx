import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../AdminPending.module.css';

export default function PendingList({
  items,
  totalPending,
  onValidate,
  onReject,
  onOpenDetail,
}) {
  if (totalPending === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>File d&rsquo;attente vide</h2>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Aucun signalement à traiter.</p>
          <p className={styles.emptyHint}>
            Bon travail&nbsp;! Les nouveaux signalements apparaîtront ici dès leur réception.
          </p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Aucun résultat</h2>
          <span className={styles.panelHint}>{totalPending} en attente au total</span>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Aucun signalement ne correspond aux filtres.</p>
          <p className={styles.emptyHint}>Réinitialisez les filtres pour voir toute la file.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Signalements à modérer</h2>
        <span className={styles.panelHint}>
          {items.length} affiché{items.length > 1 ? 's' : ''}
          {items.length !== totalPending ? ` · ${totalPending} en attente` : ''}
        </span>
      </header>
      <div className={styles.grid}>
        {items.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            variant="full"
            onClick={() => onOpenDetail(alert)}
            actions={
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnValidate}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValidate(alert);
                  }}
                >
                  Valider
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(alert);
                  }}
                >
                  Rejeter
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDetail}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(alert);
                  }}
                >
                  Détails
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
