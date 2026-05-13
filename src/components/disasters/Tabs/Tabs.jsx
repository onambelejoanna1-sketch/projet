import { classNames } from '@/utils/formatters';
import styles from './Tabs.module.css';

export default function Tabs({ tabs, activeId, onChange }) {
  return (
    <div role="tablist" className={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={classNames(styles.tab, isActive && styles.tabActive)}
          >
            <span className={styles.label}>{tab.label}</span>
            {tab.count != null && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
