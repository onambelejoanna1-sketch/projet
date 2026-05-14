import { useEffect, useState } from 'react';
import Button from '@/components/common/Button/Button';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import {
  listMyDisasters,
  getPublicFeed,
} from '@/services/api';
import StatsCards from './sections/StatsCards';
import MyReportsList from './sections/MyReportsList';
import NearbyAlerts from './sections/NearbyAlerts';
import SensorsPanel from './sections/SensorsPanel';
import styles from './Dashboard.module.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: '◆', end: true },
  { to: ROUTES.ALERTS, label: 'Alertes', icon: '!' },
  { to: ROUTES.MAP, label: 'Carte', icon: '◉' },
  { to: ROUTES.REPORT, label: 'Signaler', icon: '+' },
  { to: ROUTES.PROFILE, label: 'Mon profil', icon: '·' },
];

const EMPTY_STATS = { total: 0, pending: 0, validated: 0, rejected: 0 };

function deriveStats(reports) {
  return {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    validated: reports.filter((r) => r.status === 'validated').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
    list: reports,
  };
}

function todayLabel() {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(new Date());
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const uid = profile?.uid;
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const firstName = (profile?.displayName || profile?.email || 'sentinelle').split(/\s+/)[0];

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    Promise.all([listMyDisasters(uid, 20), getPublicFeed(3)])
      .then(([myReports, feed]) => {
        if (cancelled) return;
        setReports(myReports);
        setAlerts(feed);
      })
      .catch((err) => {
        if (cancelled) return;
        setReports([]);
        setAlerts([]);
        console.error('[Dashboard] échec chargement données :', err);
        notify({
          tone: 'error',
          title: 'Données indisponibles',
          body: 'Impossible de charger votre tableau de bord. Réessayez plus tard.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, notify]);

  const stats = uid ? deriveStats(reports) : EMPTY_STATS;
  const lastReports = reports.slice(0, 5);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow={todayLabel()}
      title={`Bonjour, ${firstName}`}
      tone="user"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Voici un aperçu de votre activité et des alertes en direct dans la ville.
        </p>
        <Button as="link" to={ROUTES.REPORT} variant="primary" size="md">
          Signaler une catastrophe →
        </Button>
      </section>

      <StatsCards stats={stats} />

      <SensorsPanel />

      <div className={styles.split}>
        <MyReportsList reports={lastReports} />
        <NearbyAlerts alerts={alerts} />
      </div>
    </DashboardLayout>
  );
}
