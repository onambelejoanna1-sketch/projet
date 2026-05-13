import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import styles from '../AdminPending.module.css';

const SORT_OPTIONS = [
  { id: 'recent', label: 'Plus récent' },
  { id: 'oldest', label: 'Plus ancien' },
  { id: 'severity', label: 'Sévérité' },
];

export default function PendingFilters({
  severity,
  type,
  zone,
  sort,
  onSeverityChange,
  onTypeChange,
  onZoneChange,
  onSortChange,
  onReset,
  totalCount,
  filteredCount,
}) {
  const isFiltered =
    severity !== 'all' || type !== 'all' || zone !== 'all' || sort !== 'recent';

  return (
    <section className={styles.filters}>
      <header className={styles.filtersHead}>
        <h2 className={styles.filtersTitle}>Filtres &amp; tri</h2>
        <span className={styles.filtersCount}>
          {filteredCount} / {totalCount} affiché{filteredCount > 1 ? 's' : ''}
        </span>
      </header>

      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-severity">
            Sévérité
          </label>
          <select
            id="filter-severity"
            className={styles.filterSelect}
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
          >
            <option value="all">Toutes</option>
            {SEVERITY_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-type">
            Type
          </label>
          <select
            id="filter-type"
            className={styles.filterSelect}
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="all">Tous</option>
            {DISASTER_TYPE_LIST.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-zone">
            Quartier
          </label>
          <select
            id="filter-zone"
            className={styles.filterSelect}
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
          >
            <option value="all">Tous</option>
            {DOUALA_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-sort">
            Tri
          </label>
          <select
            id="filter-sort"
            className={styles.filterSelect}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          disabled={!isFiltered}
        >
          Réinitialiser
        </button>
      </div>
    </section>
  );
}
