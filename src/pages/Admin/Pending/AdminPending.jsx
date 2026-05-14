import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Modal from '@/components/common/Modal/Modal';
import { useToast } from '@/contexts/ToastContext';
import {
  getAlertsBuckets,
  rejectDisaster,
  validateDisaster,
} from '@/services/api';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import RejectModal from '@/components/disasters/RejectModal/RejectModal';
import { SEVERITY_LABEL, SEVERITY_RANK } from '@/constants/severityLevels';
import { ADMIN_NAV_ITEMS } from '../adminNav';
import PendingKpis from './sections/PendingKpis';
import PendingFilters from './sections/PendingFilters';
import PendingList from './sections/PendingList';
import PendingDetailModal from './sections/PendingDetailModal';
import styles from './AdminPending.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;

function applyFilters(items, severity, type, zone) {
  return items.filter((r) => {
    if (severity !== 'all' && r.severity !== severity) return false;
    if (type !== 'all' && r.type !== type) return false;
    if (zone !== 'all' && r.quartierId !== zone) return false;
    return true;
  });
}

function applySort(items, mode) {
  const arr = [...items];
  if (mode === 'oldest') {
    return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  if (mode === 'severity') {
    return arr.sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0),
    );
  }
  return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function computeKpis(pending) {
  const now = Date.now();
  const last24h = pending.filter(
    (r) => now - new Date(r.createdAt).getTime() <= DAY_MS,
  ).length;
  const critical = pending.filter((r) => r.severity === 'critical').length;
  let oldestDays = 0;
  if (pending.length) {
    const oldestTs = pending.reduce((acc, r) => {
      const t = new Date(r.createdAt).getTime();
      return t < acc ? t : acc;
    }, now);
    oldestDays = Math.max(0, Math.floor((now - oldestTs) / DAY_MS));
  }
  return {
    pending: pending.length,
    critical,
    last24h,
    oldestDays,
  };
}

export default function AdminPending() {
  const { notify } = useToast();
  const [refreshTick, setRefreshTick] = useState(0);
  const [buckets, setBuckets] = useState({
    pending: [],
    validated: [],
    rejected: [],
    sensorsLive: [],
    all: [],
  });

  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [sortMode, setSortMode] = useState('recent');

  const [detailAlert, setDetailAlert] = useState(null);
  const [confirmValidate, setConfirmValidate] = useState(null);
  const [rejectingAlert, setRejectingAlert] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAlertsBuckets()
      .then((data) => {
        if (!cancelled) setBuckets(data);
      })
      .catch(() => {
        if (!cancelled)
          setBuckets({
            pending: [],
            validated: [],
            rejected: [],
            sensorsLive: [],
            all: [],
          });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const filtered = useMemo(
    () =>
      applySort(
        applyFilters(buckets.pending, severityFilter, typeFilter, zoneFilter),
        sortMode,
      ),
    [buckets.pending, severityFilter, typeFilter, zoneFilter, sortMode],
  );
  const kpis = useMemo(() => computeKpis(buckets.pending), [buckets.pending]);

  function refresh() {
    setRefreshTick((n) => n + 1);
  }

  function handleAskValidate(alert) {
    setConfirmValidate(alert);
  }

  async function handleConfirmValidate() {
    if (!confirmValidate) return;
    try {
      await validateDisaster(confirmValidate.id);
      notify({
        tone: 'success',
        title: 'Signalement validé',
        body: confirmValidate.title,
      });
      setConfirmValidate(null);
      setDetailAlert(null);
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Validation impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  function handleAskReject(alert) {
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
      setDetailAlert(null);
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Rejet impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  function handleResetFilters() {
    setSeverityFilter('all');
    setTypeFilter('all');
    setZoneFilter('all');
    setSortMode('recent');
  }

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin"
      title="Signalements à valider"
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Modération des signalements communautaires. Examinez chaque alerte envoyée
          par les citoyens, vérifiez les informations puis décidez de la valider —
          elle apparaîtra sur la carte publique — ou de la rejeter avec un motif clair.
        </p>
      </section>

      <PendingKpis kpis={kpis} />

      <PendingFilters
        severity={severityFilter}
        type={typeFilter}
        zone={zoneFilter}
        sort={sortMode}
        onSeverityChange={setSeverityFilter}
        onTypeChange={setTypeFilter}
        onZoneChange={setZoneFilter}
        onSortChange={setSortMode}
        onReset={handleResetFilters}
        totalCount={buckets.pending.length}
        filteredCount={filtered.length}
      />

      <PendingList
        items={filtered}
        totalPending={buckets.pending.length}
        onValidate={handleAskValidate}
        onReject={handleAskReject}
        onOpenDetail={setDetailAlert}
      />

      <PendingDetailModal
        alert={detailAlert}
        onClose={() => setDetailAlert(null)}
        onValidate={handleAskValidate}
        onReject={handleAskReject}
      />

      <Modal
        open={Boolean(confirmValidate)}
        onClose={() => setConfirmValidate(null)}
        title="Confirmer la validation"
        size="sm"
      >
        {confirmValidate && (
          <div className={styles.confirmBody}>
            <p className={styles.confirmText}>
              Vous êtes sur le point de valider ce signalement. Il deviendra visible
              sur la carte publique et dans le flux d&rsquo;alertes citoyennes.
            </p>
            <div className={styles.confirmRecap}>
              <span className={styles.confirmTitle}>{confirmValidate.title}</span>
              <span className={styles.confirmMeta}>
                {disasterLabel(confirmValidate.type)} ·{' '}
                {zoneName(confirmValidate.quartierId)} ·{' '}
                {SEVERITY_LABEL[confirmValidate.severity] ??
                  severityInfo(confirmValidate.severity).label}
              </span>
              <span className={styles.confirmMeta}>
                Signalé par {confirmValidate.reporterName ?? 'Anonyme'}
              </span>
            </div>
            <p className={styles.confirmHint}>
              Cette action peut être révoquée plus tard depuis la console alertes.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDetail}`}
                onClick={() => setConfirmValidate(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnValidate}`}
                onClick={handleConfirmValidate}
              >
                Confirmer la validation
              </button>
            </div>
          </div>
        )}
      </Modal>

      <RejectModal
        open={Boolean(rejectingAlert)}
        alert={rejectingAlert}
        onClose={() => setRejectingAlert(null)}
        onConfirm={handleConfirmReject}
      />
    </DashboardLayout>
  );
}
