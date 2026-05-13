import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminStats,
  listActivity,
  listDisasters,
  listTopZones,
  listUsers,
} from '@/services/api';
import { ADMIN_NAV_ITEMS } from './adminNav';
import AdminKpis from './sections/AdminKpis';
import PendingQueue from './sections/PendingQueue';
import RecentActivity from './sections/RecentActivity';
import UsersOverview from './sections/UsersOverview';
import TopZones from './sections/TopZones';
import SensorsKpi from './sections/SensorsKpi';
import styles from './AdminDashboard.module.css';


const EMPTY_STATS = { totalReports: 0, pending: 0, validatedToday: 0, users: 0 };

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [activity, setActivity] = useState([]);
  const [zones, setZones] = useState([]);
  const [version, setVersion] = useState(0);
  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminStats(),
      listUsers(),
      listDisasters({ status: 'pending', limit: 5 }),
      listActivity(8),
      listTopZones(30, 5),
    ])
      .then(([adminStats, allUsers, pendingRows, activityRows, topZones]) => {
        if (cancelled) return;
        setStats(adminStats?.reports || EMPTY_STATS);
        setUsers(allUsers);
        setPending(pendingRows);
        setActivity(activityRows);
        setZones(topZones);
      })
      .catch(() => {
        if (cancelled) return;
        setStats(EMPTY_STATS);
        setUsers([]);
        setPending([]);
        setActivity([]);
        setZones([]);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin"
      title={`Bienvenue, ${firstName}`}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Supervision en temps réel des signalements, validation de la file d’attente
          et gestion de la communauté des sentinelles.
        </p>
      </section>

      <AdminKpis stats={stats} />

      <SensorsKpi />

      <div className={styles.split}>
        <PendingQueue pending={pending} onChanged={refresh} />
        <RecentActivity activity={activity} />
      </div>

      <div className={styles.split2}>
        <UsersOverview users={users} />
        <TopZones zones={zones} />
      </div>
    </DashboardLayout>
  );
}
