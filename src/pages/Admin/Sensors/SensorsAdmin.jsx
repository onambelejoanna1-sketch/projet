import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ALERT_LEVELS, SENSOR_STATUSES, SENSOR_TYPES } from '@/constants/sensorTypes';
import {
  createSensor,
  deleteSensor,
  listSensors,
  updateSensor,
} from '@/services/api';
import { zoneName } from '@/utils/labels';
import { minutesAgo, formatRelativeMinutes } from '@/utils/dates';
import { ADMIN_NAV_ITEMS } from '../adminNav';
import SensorForm from './SensorForm';
import styles from './SensorsAdmin.module.css';

function deriveStats(sensors) {
  const active = sensors.filter((s) => s.status === 'active' && !s.offline).length;
  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal').length;
  const offline = sensors.filter((s) => s.offline).length;
  return { total: sensors.length, active, inAlert, offline };
}

const EMPTY_STATS = { total: 0, active: 0, inAlert: 0, offline: 0 };

export default function SensorsAdmin() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSensors()
      .then((data) => {
        if (!cancelled) setSensors(data);
      })
      .catch(() => {
        if (!cancelled) setSensors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const stats = sensors.length ? deriveStats(sensors) : EMPTY_STATS;

  async function handleSave(data) {
    try {
      const payload = {
        name: data.name,
        deviceId: data.deviceId,
        zoneId: data.zoneId,
        address: data.address || null,
        lat: Number(data.lat),
        lng: Number(data.lng),
        status: data.status,
        thresholds: data.thresholds,
      };
      if (editing) {
        await updateSensor(editing.id, payload);
      } else {
        await createSensor(payload);
      }
      notify({
        tone: 'success',
        title: editing ? 'Capteur mis à jour' : 'Capteur ajouté',
        body: data.name,
      });
      setEditing(null);
      setCreating(false);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Enregistrement impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  async function handleDelete(sensor) {
    if (!window.confirm(`Supprimer le capteur « ${sensor.name} » ?`)) return;
    try {
      await deleteSensor(sensor.id);
      notify({
        tone: 'success',
        title: 'Capteur supprimé',
        body: sensor.name,
      });
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Suppression impossible',
        body: err?.message || 'Réessayez dans un instant.',
      });
    }
  }

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin · Capteurs IoT"
      title={`Capteurs, ${firstName}`}
      tone="admin"
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>
            Réseau ESP32 de prévention des inondations. Configurez les seuils par capteur :
            une alerte publique automatique est émise dès qu'un seuil critique est franchi.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreating(true)}>
          + Ajouter un capteur
        </Button>
      </section>

      <section className={styles.kpiGrid}>
        <Kpi value={stats.total} label="Capteurs déployés" tone="ink" />
        <Kpi value={stats.active} label="Actifs" tone="ok" />
        <Kpi value={stats.inAlert} label="En alerte" tone="alert" />
        <Kpi value={stats.offline} label="Hors ligne" tone="warn" />
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Liste des capteurs</h2>
          <span className={styles.panelHint}>Mise à jour temps réel</span>
        </header>
        {loading ? (
          <div className={styles.empty}>
            <Spinner size={18} /> Chargement…
          </div>
        ) : sensors.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucun capteur déployé pour le moment.</p>
            <p>Utilisez « Ajouter un capteur » pour démarrer le réseau.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nom / Device</th>
                  <th>Quartier</th>
                  <th>Niveau d'eau</th>
                  <th>Pluie</th>
                  <th>Sol</th>
                  <th>Batterie</th>
                  <th>Statut</th>
                  <th>Vu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sensors.map((s) => {
                  const level = s.offline ? 'offline' : s.alertLevel;
                  return (
                    <tr key={s.id} className={styles[`row_${level}`]}>
                      <td>
                        <p className={styles.cellStrong}>{s.name}</p>
                        <p className={styles.cellMuted}>{s.deviceId}</p>
                      </td>
                      <td>{zoneName(s.zoneId)}</td>
                      <Reading
                        value={s.lastReading?.water_level}
                        threshold={s.thresholds.water_level}
                        type="water_level"
                      />
                      <Reading
                        value={s.lastReading?.rainfall}
                        threshold={s.thresholds.rainfall}
                        type="rainfall"
                      />
                      <Reading
                        value={s.lastReading?.soil_moisture}
                        threshold={s.thresholds.soil_moisture}
                        type="soil_moisture"
                      />
                      <td className={styles.cellNum}>{s.lastReading?.batteryLevel ?? '—'}%</td>
                      <td>
                        <StatusPill status={s.status} offline={s.offline} alertLevel={s.alertLevel} />
                      </td>
                      <td className={styles.cellMuted}>
                        {s.offline
                          ? 'Hors ligne'
                          : formatRelativeMinutes(
                              minutesAgo(new Date(s.lastSeenAtMs).toISOString()),
                            )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => setEditing(s)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => handleDelete(s)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SensorForm
        open={creating || editing != null}
        sensor={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}

function Kpi({ value, label, tone }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </article>
  );
}

function Reading({ value, threshold, type }) {
  const v = value ?? null;
  const meta = SENSOR_TYPES[type];
  let level = 'normal';
  if (v != null && threshold) {
    if (v >= threshold.critical) level = 'critical';
    else if (v >= threshold.warning) level = 'warning';
  }
  return (
    <td className={`${styles.cellReading} ${styles[`reading_${level}`]}`}>
      {v == null ? (
        '—'
      ) : (
        <>
          {v}
          <span className={styles.unit}>{meta.unit}</span>
        </>
      )}
    </td>
  );
}

function StatusPill({ status, offline, alertLevel }) {
  if (offline) {
    return <span className={styles.pillOffline}>Hors ligne</span>;
  }
  if (status !== 'active') {
    const meta = SENSOR_STATUSES[status];
    return (
      <span className={styles.pill} style={{ backgroundColor: meta.color }}>
        {meta.label}
      </span>
    );
  }
  const lvl = ALERT_LEVELS[alertLevel];
  return (
    <span className={styles.pill} style={{ backgroundColor: lvl.color }}>
      {lvl.label}
    </span>
  );
}
