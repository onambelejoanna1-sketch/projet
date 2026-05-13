import { useMemo, useState } from 'react';
import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import AlertFilters from '@/components/disasters/AlertFilters/AlertFilters';
import styles from '../AdminAlerts.module.css';

const EMPTY_FILTERS = { types: [], zones: [], sources: [] };

const STATUS_FILTER_OPTIONS = [
  { id: 'pending', label: 'En attente' },
  { id: 'validated', label: 'Validées' },
  { id: 'rejected', label: 'Rejetées' },
  { id: 'live', label: 'En direct' },
];

function applyFilters(items, filters, statuses) {
  return items.filter((a) => {
    if (filters.types.length && !filters.types.includes(a.type)) return false;
    if (filters.zones.length && !filters.zones.includes(a.quartierId)) return false;
    if (filters.sources.length && !filters.sources.includes(a.source)) return false;
    if (statuses.length && !statuses.includes(a.status)) return false;
    return true;
  });
}

export default function AllTab({ items }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [statuses, setStatuses] = useState([]);
  const filtered = useMemo(
    () => applyFilters(items, filters, statuses),
    [items, filters, statuses],
  );
  const hasAny =
    filters.types.length +
      filters.zones.length +
      filters.sources.length +
      statuses.length >
    0;

  function toggleStatus(id) {
    setStatuses((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    );
  }

  return (
    <>
      <AlertFilters value={filters} onChange={setFilters} />
      <div className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Toutes les alertes</h2>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const active = statuses.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleStatus(opt.id)}
                  className={`${styles.btn} ${active ? styles.btnValidate : ''}`}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </header>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>
              {hasAny
                ? 'Aucune alerte ne correspond aux filtres sélectionnés.'
                : 'Aucune alerte enregistrée.'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
