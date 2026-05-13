import { useMemo, useState } from 'react';
import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import AlertFilters from '@/components/disasters/AlertFilters/AlertFilters';
import styles from '../AdminAlerts.module.css';

const EMPTY_FILTERS = { types: [], zones: [], sources: [] };

function applyFilters(items, filters) {
  return items.filter((a) => {
    if (filters.types.length && !filters.types.includes(a.type)) return false;
    if (filters.zones.length && !filters.zones.includes(a.quartierId)) return false;
    if (filters.sources.length && !filters.sources.includes(a.source)) return false;
    return true;
  });
}

export default function ValidatedTab({ items }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const filtered = useMemo(() => applyFilters(items, filters), [items, filters]);
  const hasFilters =
    filters.types.length + filters.zones.length + filters.sources.length > 0;

  return (
    <>
      <AlertFilters
        value={filters}
        onChange={setFilters}
        options={{
          sources: [
            { id: 'user', label: 'Communauté' },
            { id: 'sensor', label: 'Capteur (historique)' },
          ],
        }}
      />
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Alertes validées</h2>
          <span className={styles.panelHint}>{filtered.length} entrées</span>
        </header>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>
              {hasFilters
                ? 'Aucune alerte validée ne correspond aux filtres.'
                : 'Aucune alerte validée pour le moment.'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} variant="compact" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
