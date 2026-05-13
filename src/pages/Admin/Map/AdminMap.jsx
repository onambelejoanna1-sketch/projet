import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import RiskMap from '@/components/map/RiskMap/RiskMap';
import { useAuth } from '@/hooks/useAuth';
import { DISASTER_TYPES } from '@/constants/disasterTypes';
import { SEVERITY_LEVELS } from '@/constants/severityLevels';
import { listDisasters, listSensors } from '@/services/api';
import { getAllZonesWithRisk, countZonesByRisk, RISK_LEVELS } from '@/utils/riskZones';
import { ADMIN_NAV_ITEMS } from '../adminNav';
import FilterPanel from './FilterPanel';
import styles from './AdminMap.module.css';

const DEFAULT_DISASTERS = new Set(Object.keys(DISASTER_TYPES));
const DEFAULT_SEVERITIES = new Set(Object.keys(SEVERITY_LEVELS));
const DEFAULT_STATUSES = new Set(['pending', 'validated']);

function toggleSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export default function AdminMap() {
  const { profile } = useAuth();
  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  const [disasters, setDisasters] = useState(DEFAULT_DISASTERS);
  const [severities, setSeverities] = useState(DEFAULT_SEVERITIES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);

  const [sensors, setSensors] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listSensors(),
      listDisasters({ status: 'pending,validated', limit: 500 }),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        setSensors(s);
        setReports(r);
      })
      .catch(() => {
        if (cancelled) return;
        setSensors([]);
        setReports([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          disasters.has(r.type) &&
          severities.has(r.severity) &&
          statuses.has(r.status),
      ),
    [reports, disasters, severities, statuses],
  );

  const zonesWithRisk = useMemo(
    () =>
      getAllZonesWithRisk({
        sensors,
        reports: filteredReports,
        alerts: [],
      }),
    [sensors, filteredReports],
  );

  const counts = useMemo(() => countZonesByRisk(zonesWithRisk), [zonesWithRisk]);
  const sensorAlerts = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal').length;
  const offlineSensors = sensors.filter((s) => s.offline).length;

  function handleReset() {
    setDisasters(DEFAULT_DISASTERS);
    setSeverities(DEFAULT_SEVERITIES);
    setStatuses(DEFAULT_STATUSES);
  }

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin · Carte des risques"
      title={`Carte, ${firstName}`}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Visualisation cartographique des zones à risque de Douala. Les pastilles
          colorées synthétisent l'état combiné des capteurs IoT, signalements
          citoyens et alertes en cours.
        </p>
      </section>

      <section className={styles.kpiGrid}>
        <Kpi
          value={counts.high}
          label="Zones risque élevé"
          color={RISK_LEVELS.high.color}
        />
        <Kpi
          value={counts.medium}
          label="Zones risque moyen"
          color={RISK_LEVELS.medium.color}
        />
        <Kpi
          value={counts.low}
          label="Zones risque faible"
          color={RISK_LEVELS.low.color}
        />
        <Kpi value={sensorAlerts} label="Capteurs en alerte" tone="ink" />
        <Kpi value={offlineSensors} label="Capteurs hors ligne" tone="muted" />
      </section>

      <FilterPanel
        disasters={disasters}
        severities={severities}
        statuses={statuses}
        onToggleDisaster={(id) => setDisasters((s) => toggleSet(s, id))}
        onToggleSeverity={(id) => setSeverities((s) => toggleSet(s, id))}
        onToggleStatus={(id) => setStatuses((s) => toggleSet(s, id))}
        onReset={handleReset}
      />

      <section className={styles.mapSection} aria-label="Carte des zones à risque">
        <header className={styles.mapHead}>
          <span className={styles.live} aria-hidden="true" />
          <span>Carte en direct · OpenStreetMap</span>
          <span className={styles.coords}>4°03'N · 9°46'E</span>
        </header>
        <RiskMap
          zones={zonesWithRisk}
          sensors={sensors}
          height="clamp(480px, 70vh, 680px)"
        />
      </section>
    </DashboardLayout>
  );
}

function Kpi({ value, label, color, tone }) {
  const style = color ? { background: color, color: '#1A1A1A' } : undefined;
  return (
    <article
      className={`${styles.kpi} ${tone ? styles[`kpi_${tone}`] : ''}`}
      style={style}
    >
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </article>
  );
}
