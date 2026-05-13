import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  getAlertsBuckets,
  rejectDisaster,
  validateDisaster,
} from '@/services/api';
import Tabs from '@/components/disasters/Tabs/Tabs';
import RejectModal from '@/components/disasters/RejectModal/RejectModal';
import { ADMIN_NAV_ITEMS } from '../adminNav';
import AlertsKpisAdmin from './sections/AlertsKpisAdmin';
import PendingTab from './sections/PendingTab';
import ValidatedTab from './sections/ValidatedTab';
import SensorsLiveTab from './sections/SensorsLiveTab';
import AllTab from './sections/AllTab';
import styles from './AdminAlerts.module.css';

const EMPTY_BUCKETS = {
  pending: [],
  validated: [],
  rejected: [],
  sensorsLive: [],
  all: [],
};

function computeKpis(buckets) {
  const today = new Date().toISOString().slice(0, 10);
  const validatedToday = buckets.validated.filter(
    (r) => (r.validatedAt ?? '').slice(0, 10) === today,
  ).length;
  const critical =
    buckets.sensorsLive.filter((a) => a.severity === 'critical').length +
    buckets.validated.filter((a) => a.severity === 'critical').length;
  return {
    pending: buckets.pending.length,
    validatedToday,
    sensorsLive: buckets.sensorsLive.length,
    critical,
  };
}

export default function AdminAlerts() {
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectingAlert, setRejectingAlert] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [buckets, setBuckets] = useState(EMPTY_BUCKETS);

  useEffect(() => {
    let cancelled = false;
    getAlertsBuckets()
      .then((data) => {
        if (!cancelled) setBuckets(data);
      })
      .catch(() => {
        if (!cancelled) setBuckets(EMPTY_BUCKETS);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const kpis = useMemo(() => computeKpis(buckets), [buckets]);

  function refresh() {
    setRefreshTick((n) => n + 1);
  }

  async function handleValidate(alert) {
    try {
      await validateDisaster(alert.id);
      notify({ tone: 'success', title: 'Signalement validé', body: alert.title });
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Validation impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  function handleOpenReject(alert) {
    setRejectingAlert(alert);
  }

  async function handleConfirmReject(reason) {
    if (!rejectingAlert) return;
    try {
      await rejectDisaster(rejectingAlert.id, reason);
      notify({
        tone: 'info',
        title: 'Signalement rejeté',
        body: rejectingAlert.title,
      });
      setRejectingAlert(null);
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Rejet impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  const tabs = [
    { id: 'pending', label: 'À valider', count: buckets.pending.length },
    { id: 'validated', label: 'Validées', count: buckets.validated.length },
    { id: 'sensors', label: 'Capteurs live', count: buckets.sensorsLive.length },
    { id: 'all', label: 'Tout', count: buckets.all.length },
  ];

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin"
      title="Alertes — supervision"
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Recensement complet des signalements communautaires (à valider et validés) et des
          alertes émises en direct par les capteurs IoT.
        </p>
      </section>

      <AlertsKpisAdmin kpis={kpis} />

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'pending' && (
          <PendingTab
            items={buckets.pending}
            onValidate={handleValidate}
            onReject={handleOpenReject}
          />
        )}
        {activeTab === 'validated' && <ValidatedTab items={buckets.validated} />}
        {activeTab === 'sensors' && <SensorsLiveTab items={buckets.sensorsLive} />}
        {activeTab === 'all' && <AllTab items={buckets.all} />}
      </div>

      <RejectModal
        open={Boolean(rejectingAlert)}
        alert={rejectingAlert}
        onClose={() => setRejectingAlert(null)}
        onConfirm={handleConfirmReject}
      />
    </DashboardLayout>
  );
}
