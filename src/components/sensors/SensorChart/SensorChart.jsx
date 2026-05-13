import { SENSOR_TYPES } from '@/constants/sensorTypes';
import styles from './SensorChart.module.css';

export default function SensorChart({ history, type, threshold, height = 80 }) {
  const meta = SENSOR_TYPES[type];
  if (!history?.length || !meta) {
    return <div className={styles.empty}>Pas de données</div>;
  }

  const W = 200;
  const H = height;
  const padding = 8;
  const innerW = W - padding * 2;
  const innerH = H - padding * 2;
  const maxV = 100;
  const step = innerW / Math.max(1, history.length - 1);

  const points = history.map((p, i) => {
    const x = padding + i * step;
    const y = padding + innerH - (p.value / maxV) * innerH;
    return [x, y];
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const lastValue = history[history.length - 1].value;

  let level = 'normal';
  if (threshold) {
    if (lastValue >= threshold.critical) level = 'critical';
    else if (lastValue >= threshold.warning) level = 'warning';
  }

  const yWarning = threshold ? padding + innerH - (threshold.warning / maxV) * innerH : null;
  const yCritical = threshold ? padding + innerH - (threshold.critical / maxV) * innerH : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.label}>
          <span className={styles.icon} aria-hidden="true">{meta.icon}</span>
          {meta.label}
        </span>
        <span className={`${styles.value} ${styles[`level_${level}`]}`}>
          {lastValue}
          <span className={styles.unit}>{meta.unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} preserveAspectRatio="none">
        {yCritical != null && (
          <line
            x1={padding}
            x2={W - padding}
            y1={yCritical}
            y2={yCritical}
            stroke="#C8102E"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        )}
        {yWarning != null && (
          <line
            x1={padding}
            x2={W - padding}
            y1={yWarning}
            y2={yWarning}
            stroke="#B8860B"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}
        <path
          d={`${path} L${(points[points.length - 1][0]).toFixed(1)},${H - padding} L${padding},${H - padding} Z`}
          fill={meta.color}
          opacity="0.18"
        />
        <path d={path} fill="none" stroke={meta.color} strokeWidth="2" />
        {points.map(([x, y], i) =>
          i === points.length - 1 ? (
            <circle key={i} cx={x} cy={y} r="3" fill={meta.color} stroke="#1A1A1A" strokeWidth="1" />
          ) : null,
        )}
      </svg>
    </div>
  );
}
