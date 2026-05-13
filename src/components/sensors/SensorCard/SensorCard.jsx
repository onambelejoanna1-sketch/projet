import { ALERT_LEVELS, SENSOR_TYPES } from '@/constants/sensorTypes';
import { zoneName } from '@/utils/labels';
import styles from './SensorCard.module.css';

const TYPE_KEYS = ['water_level', 'rainfall', 'soil_moisture'];

function MeasureRow({ type, value, threshold }) {
  const meta = SENSOR_TYPES[type];
  if (!meta) return null;
  const v = value ?? 0;
  const max = type === 'rainfall' ? 100 : 100;
  const pct = Math.min(100, Math.round((v / max) * 100));
  let level = 'normal';
  if (threshold) {
    if (v >= threshold.critical) level = 'critical';
    else if (v >= threshold.warning) level = 'warning';
  }
  return (
    <div className={styles.row}>
      <div className={styles.rowHead}>
        <span className={styles.icon} aria-hidden="true">
          {meta.icon}
        </span>
        <span className={styles.rowLabel}>{meta.label}</span>
        <span className={styles.rowValue}>
          {v}
          <span className={styles.unit}>{meta.unit}</span>
        </span>
      </div>
      <div className={styles.track} aria-hidden="true">
        <div
          className={`${styles.fill} ${styles[`fill_${level}`]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SensorCard({ sensor, onClick }) {
  const level = sensor.alertLevel ?? 'normal';
  const offline = sensor.offline;
  const levelMeta = ALERT_LEVELS[level];

  return (
    <article
      className={`${styles.card} ${styles[`card_${level}`]} ${offline ? styles.cardOffline : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <header className={styles.head}>
        <div className={styles.headMain}>
          <h3 className={styles.name}>{sensor.name}</h3>
          <p className={styles.meta}>
            <span>{zoneName(sensor.zoneId)}</span>
            <span aria-hidden="true">·</span>
            <span className={styles.device}>{sensor.deviceId}</span>
          </p>
        </div>
        <span
          className={styles.pill}
          style={{ backgroundColor: offline ? '#6B7166' : levelMeta.color }}
        >
          {offline ? 'Hors ligne' : levelMeta.label}
        </span>
      </header>

      <div className={styles.body}>
        {TYPE_KEYS.map((t) => (
          <MeasureRow
            key={t}
            type={t}
            value={sensor.lastReading?.[t]}
            threshold={sensor.thresholds?.[t]}
          />
        ))}
      </div>

      <footer className={styles.foot}>
        <span>Batterie : {sensor.lastReading?.batteryLevel ?? '—'}%</span>
        {!offline && level !== 'normal' && (
          <span className={styles.warning}>⚠ Surveillance renforcée</span>
        )}
      </footer>
    </article>
  );
}
