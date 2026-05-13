import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import styles from './AdminMap.module.css';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'En attente' },
  { id: 'validated', label: 'Validé' },
  { id: 'rejected', label: 'Rejeté' },
];

function Group({ title, options, selected, onToggle, getColor }) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterTitle}>{title}</p>
      <div className={styles.chipRow}>
        {options.map((opt) => {
          const isOn = selected.has(opt.id);
          const accent = getColor ? getColor(opt) : null;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={isOn && accent ? { background: accent, borderColor: 'var(--ink)', color: 'var(--paper)' } : undefined}
              aria-pressed={isOn}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterPanel({
  disasters,
  severities,
  statuses,
  onToggleDisaster,
  onToggleSeverity,
  onToggleStatus,
  onReset,
}) {
  return (
    <section className={styles.filters} aria-label="Filtres de la carte">
      <header className={styles.filtersHead}>
        <div>
          <p className="text-eyebrow">Filtres</p>
          <h2 className={styles.filtersTitle}>Affiner la lecture des risques</h2>
        </div>
        <button type="button" onClick={onReset} className={styles.resetBtn}>
          Réinitialiser
        </button>
      </header>

      <div className={styles.filtersGrid}>
        <Group
          title="Type de catastrophe"
          options={DISASTER_TYPE_LIST}
          selected={disasters}
          onToggle={onToggleDisaster}
        />
        <Group
          title="Sévérité"
          options={SEVERITY_LIST}
          selected={severities}
          onToggle={onToggleSeverity}
          getColor={(opt) => opt.color}
        />
        <Group
          title="Statut signalement"
          options={STATUS_OPTIONS}
          selected={statuses}
          onToggle={onToggleStatus}
        />
      </div>
    </section>
  );
}
