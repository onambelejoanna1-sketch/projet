import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SensorCard from '@/components/sensors/SensorCard/SensorCard';
import { ROUTES } from '@/constants/routes';
import { listSensors } from '@/services/api';
import styles from '../AdminAlerts.module.css';

export default function SensorsLiveTab({ items }) {
  const [sensorsById, setSensorsById] = useState({});

  useEffect(() => {
    if (!items.length) return undefined;
    let cancelled = false;
    listSensors()
      .then((all) => {
        if (cancelled) return;
        const map = {};
        for (const s of all) map[s.id] = s;
        setSensorsById(map);
      })
      .catch(() => {
        if (!cancelled) setSensorsById({});
      });
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  if (!items.length) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Aucun capteur en alerte</h2>
          <Link to={ROUTES.ADMIN_SENSORS} className={styles.panelLink}>
            Gérer les capteurs →
          </Link>
        </header>
        <div className={styles.empty}>
          <p>Tous les capteurs en ligne sont en zone normale.</p>
          <p className={styles.emptyHint}>
            Les seuils warning / critical déclencheront automatiquement une alerte ici.
          </p>
        </div>
      </section>
    );
  }

  const sensors = items.map((a) => sensorsById[a.sensorId]).filter(Boolean);

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Capteurs en alerte (temps réel)</h2>
        <Link to={ROUTES.ADMIN_SENSORS} className={styles.panelLink}>
          Gérer les capteurs →
        </Link>
      </header>
      <div className={styles.gridSensors}>
        {sensors.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </section>
  );
}
