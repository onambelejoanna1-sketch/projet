import { RISK_LEVELS } from '@/utils/riskZones';
import styles from './RiskLegend.module.css';

const ITEMS = [RISK_LEVELS.high, RISK_LEVELS.medium, RISK_LEVELS.low];

export default function RiskLegend() {
  return (
    <aside className={styles.wrap} aria-label="Légende des niveaux de risque">
      <p className={styles.title}>Risque zone</p>
      <ul className={styles.list}>
        {ITEMS.map((item) => (
          <li key={item.id} className={styles.row}>
            <span
              className={styles.swatch}
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className={styles.label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
