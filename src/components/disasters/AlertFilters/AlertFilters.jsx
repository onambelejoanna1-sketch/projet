import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { classNames } from '@/utils/formatters';
import styles from './AlertFilters.module.css';

const DEFAULT_SOURCES = [
  { id: 'user', label: 'Communauté' },
  { id: 'sensor', label: 'Capteur (historique)' },
  { id: 'sensor-live', label: 'Capteur en direct' },
];

export default function AlertFilters({ value, onChange, options = {} }) {
  const types = options.types ?? DISASTER_TYPE_LIST;
  const zones = options.zones ?? DOUALA_ZONES;
  const sources = options.sources ?? DEFAULT_SOURCES;

  function toggle(key, id) {
    const current = value[key] ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...value, [key]: next });
  }

  function reset() {
    onChange({ types: [], zones: [], sources: [] });
  }

  const totalSelected =
    (value.types?.length || 0) +
    (value.zones?.length || 0) +
    (value.sources?.length || 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.title}>Filtres</span>
        {totalSelected > 0 && (
          <button type="button" onClick={reset} className={styles.reset}>
            Réinitialiser ({totalSelected})
          </button>
        )}
      </div>
      <FilterGroup
        label="Type"
        items={types}
        active={value.types}
        onToggle={(id) => toggle('types', id)}
      />
      <FilterGroup
        label="Zone"
        items={zones}
        active={value.zones}
        onToggle={(id) => toggle('zones', id)}
        labelKey="name"
      />
      <FilterGroup
        label="Source"
        items={sources}
        active={value.sources}
        onToggle={(id) => toggle('sources', id)}
      />
    </div>
  );
}

function FilterGroup({ label, items, active = [], onToggle, labelKey = 'label' }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.chipsRow}>
        {items.map((item) => {
          const isActive = active.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={classNames(styles.chip, isActive && styles.chipActive)}
              aria-pressed={isActive}
            >
              {item[labelKey] ?? item.label ?? item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
