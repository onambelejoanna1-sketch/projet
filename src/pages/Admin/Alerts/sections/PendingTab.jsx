import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../AdminAlerts.module.css';

export default function PendingTab({ items, onValidate, onReject }) {
  if (!items.length) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Aucun signalement à traiter</h2>
        </header>
        <div className={styles.empty}>
          <p>La file d&rsquo;attente est vide.</p>
          <p className={styles.emptyHint}>Bon travail ! Les nouveaux signalements apparaîtront ici.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Signalements à valider</h2>
        <span className={styles.panelHint}>{items.length} en attente</span>
      </header>
      <div className={styles.grid}>
        {items.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            variant="full"
            actions={
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnValidate}`}
                  onClick={() => onValidate(alert)}
                >
                  Valider
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  onClick={() => onReject(alert)}
                >
                  Rejeter
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
