import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/common/Button/Button';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import { getPublicFeed } from '@/services/api';
import AlertsKpis from './sections/AlertsKpis';
import AlertsFeed from './sections/AlertsFeed';
import AlertFilters from '@/components/disasters/AlertFilters/AlertFilters';
import styles from './UserAlerts.module.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: '◆' },
  { to: ROUTES.ALERTS, label: 'Alertes', icon: '!', end: true },
  { to: ROUTES.MAP, label: 'Carte', icon: '◉' },
  { to: ROUTES.REPORT, label: 'Signaler', icon: '+' },
  { to: ROUTES.PROFILE, label: 'Mon profil', icon: '·' },
];

const EMPTY_FILTERS = { types: [], zones: [], sources: [] };

function applyFilters(feed, filters) {
  const { types, zones, sources } = filters;
  return feed.filter((a) => {
    if (types.length && !types.includes(a.type)) return false;
    if (zones.length && !zones.includes(a.quartierId)) return false;
    if (sources.length && !sources.includes(a.source)) return false;
    return true;
  });
}

function deriveKpis(feed) {
  const critical = feed.filter((a) => a.severity === 'critical').length;
  const sensorsLive = feed.filter((a) => a.source === 'sensor-live').length;
  const zones = new Set(feed.map((a) => a.quartierId)).size;
  return {
    active: feed.length,
    critical,
    sensorsLive,
    zones,
  };
}

export default function UserAlerts() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPublicFeed(50)
      .then((rows) => {
        if (!cancelled) setFeed(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setFeed([]);
        console.error('[UserAlerts] échec chargement feed :', err);
        notify({
          tone: 'error',
          title: 'Alertes indisponibles',
          body: 'Impossible de charger le flux. Vérifiez votre connexion.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const filteredFeed = useMemo(() => applyFilters(feed, filters), [feed, filters]);
  const kpis = useMemo(() => deriveKpis(filteredFeed), [filteredFeed]);

  const firstName = (profile?.displayName || profile?.email || 'sentinelle').split(/\s+/)[0];

  const hasFilters =
    filteredFeed.length === 0 &&
    (filters.types.length || filters.zones.length || filters.sources.length);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow="Communauté · Capteurs IoT"
      title="Alertes en direct"
      tone="user"
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>
            Bonjour <strong>{firstName}</strong>, voici toutes les alertes actives à Douala — celles
            envoyées par la communauté et validées par l&rsquo;administration, ainsi que celles
            émises par les capteurs IoT.
          </p>
        </div>
        <Button as="link" to={ROUTES.REPORT} variant="primary" size="md">
          Signaler une catastrophe →
        </Button>
      </section>

      <AlertsKpis kpis={kpis} />

      <AlertFilters value={filters} onChange={setFilters} />

      <AlertsFeed feed={filteredFeed} hasFilters={hasFilters} />
    </DashboardLayout>
  );
}
