import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SensorCard from '@/components/sensors/SensorCard/SensorCard';
import Spinner from '@/components/common/Spinner/Spinner';
import { ROUTES } from '@/constants/routes';
import { listSensors } from '@/services/api';
import styles from '../Dashboard.module.css';

export default function SensorsPanel() {
  const [sensors, setSensors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listSensors()
      .then((data) => {
        if (!cancelled) setSensors(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (sensors == null) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Capteurs IoT — prévention</h2>
        </header>
        <div className={styles.empty}>
          {error ? (
            <p>Impossible de charger les capteurs.</p>
          ) : (
            <span className={styles.requesting}>
              <Spinner size={18} /> Chargement des capteurs…
            </span>
          )}
        </div>
      </section>
    );
  }

  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal');
  const sample = (inAlert.length ? inAlert : sensors).slice(0, 3);

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Capteurs IoT — prévention</h2>
        <Link to={ROUTES.MAP} className={styles.panelHint}>
          Voir la carte →
        </Link>
      </header>
      {sample.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun capteur déployé pour le moment.</p>
        </div>
      ) : (
        <div className={styles.sensorsGrid}>
          {sample.map((s) => (
            <SensorCard key={s.id} sensor={s} />
          ))}
        </div>
      )}
      {inAlert.length > 0 && (
        <p className={styles.sensorsHint}>
          {inAlert.length} capteur(s) en vigilance. Une alerte sera émise automatiquement si un
          seuil critique est franchi.
        </p>
      )}
    </section>
  );
}
