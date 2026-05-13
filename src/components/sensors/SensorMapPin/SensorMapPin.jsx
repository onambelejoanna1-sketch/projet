import { ALERT_LEVELS } from '@/constants/sensorTypes';
import styles from './SensorMapPin.module.css';

export default function SensorMapPin({ sensor, x, y, onClick }) {
  const level = sensor.alertLevel ?? 'normal';
  const offline = sensor.offline;
  const color = offline ? '#6B7166' : ALERT_LEVELS[level].color;
  const isAlert = !offline && (level === 'warning' || level === 'critical');

  return (
    <button
      type="button"
      className={`${styles.pin} ${styles[`pin_${level}`]} ${offline ? styles.pinOffline : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, '--pin-color': color }}
      onClick={onClick}
      aria-label={`Capteur ${sensor.name}, niveau ${ALERT_LEVELS[level].label}`}
    >
      <span className={styles.dot}>
        <span className={styles.dotInner} />
      </span>
      {isAlert && <span className={styles.ring} aria-hidden="true" />}
      <span className={styles.label}>
        <span className={styles.icon} aria-hidden="true">📡</span>
        {sensor.name}
      </span>
    </button>
  );
}
