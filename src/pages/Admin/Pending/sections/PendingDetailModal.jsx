import Modal from '@/components/common/Modal/Modal';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { formatDateTime, timeSinceISO } from '@/utils/dates';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import styles from '../AdminPending.module.css';

export default function PendingDetailModal({ alert, onClose, onValidate, onReject }) {
  const open = Boolean(alert);
  if (!open) {
    return <Modal open={false} onClose={onClose} title="" size="lg" />;
  }

  const sev = severityInfo(alert.severity);

  return (
    <Modal open={open} onClose={onClose} title={alert.title} size="lg">
      <div>
        <div className={styles.detailHead}>
          <span
            className={styles.detailSeverity}
            style={{ backgroundColor: sev.color }}
          >
            {SEVERITY_LABEL[alert.severity] ?? sev.label}
          </span>
          <span className={styles.detailTime}>
            {timeSinceISO(alert.createdAt)} · {formatDateTime(alert.createdAt)}
          </span>
        </div>

        <div className={styles.detailMetaGrid}>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Type</span>
            <span className={styles.detailMetaValue}>{disasterLabel(alert.type)}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Quartier</span>
            <span className={styles.detailMetaValue}>{zoneName(alert.quartierId)}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Signalé par</span>
            <span className={styles.detailMetaValue}>
              {alert.reporterName ?? 'Anonyme'}
            </span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Identifiant</span>
            <span className={styles.detailMetaValue}>#{alert.id}</span>
          </div>
          {alert.address && (
            <div className={styles.detailMetaItem}>
              <span className={styles.detailMetaLabel}>Adresse</span>
              <span className={styles.detailMetaValue}>{alert.address}</span>
            </div>
          )}
          {typeof alert.affectedPeople === 'number' && (
            <div className={styles.detailMetaItem}>
              <span className={styles.detailMetaLabel}>Personnes affectées</span>
              <span className={styles.detailMetaValue}>{alert.affectedPeople}</span>
            </div>
          )}
        </div>

        {alert.description ? (
          <p className={styles.detailDescription}>{alert.description}</p>
        ) : (
          <p className={styles.detailDescriptionEmpty}>
            Aucune description fournie par le signaleur.
          </p>
        )}

        {alert.photoDataUrl && (
          <div className={styles.detailImages}>
            <img
              src={alert.photoDataUrl}
              alt="Photo du signalement"
              className={styles.detailImage}
              loading="lazy"
            />
          </div>
        )}
        {Array.isArray(alert.images) && alert.images.length > 0 && (
          <div className={styles.detailImages}>
            {alert.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Photo ${i + 1} du signalement`}
                className={styles.detailImage}
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className={styles.detailFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDetail}`}
            onClick={onClose}
          >
            Fermer
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={() => onReject(alert)}
          >
            Rejeter
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnValidate}`}
            onClick={() => onValidate(alert)}
          >
            Valider
          </button>
        </div>
      </div>
    </Modal>
  );
}
