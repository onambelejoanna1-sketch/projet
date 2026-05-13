import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { DEFAULT_THRESHOLDS, SENSOR_TYPES } from '@/constants/sensorTypes';
import styles from './SensorForm.module.css';

const TYPE_KEYS = ['water_level', 'rainfall', 'soil_moisture'];

function emptyForm() {
  return {
    name: '',
    deviceId: '',
    zoneId: 'akwa',
    address: '',
    lat: '',
    lng: '',
    status: 'active',
    thresholds: structuredClone(DEFAULT_THRESHOLDS),
  };
}

export default function SensorForm({ open, sensor, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (sensor) {
      setForm({
        name: sensor.name ?? '',
        deviceId: sensor.deviceId ?? '',
        zoneId: sensor.zoneId ?? 'akwa',
        address: sensor.address ?? '',
        lat: sensor.lat ?? '',
        lng: sensor.lng ?? '',
        status: sensor.status ?? 'active',
        thresholds: sensor.thresholds ?? structuredClone(DEFAULT_THRESHOLDS),
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, sensor]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.(form);
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function setThreshold(type, key, value) {
    setForm((f) => ({
      ...f,
      thresholds: {
        ...f.thresholds,
        [type]: { ...f.thresholds[type], [key]: Number(value) },
      },
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sensor ? 'Modifier un capteur' : 'Ajouter un capteur'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <Input
            label="Nom du capteur"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            placeholder="Ex : Capteur pont Akwa"
          />
          <Input
            label="ID du dispositif"
            value={form.deviceId}
            onChange={(e) => setField('deviceId', e.target.value)}
            required
            placeholder="ESP32-AKWA-001"
            hint="Identifiant unique du module ESP32 (utilisé par la Cloud Function)"
          />
        </div>

        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>Quartier</label>
            <select
              className={styles.select}
              value={form.zoneId}
              onChange={(e) => setField('zoneId', e.target.value)}
            >
              {DOUALA_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.arrondissement}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>Statut</label>
            <select
              className={styles.select}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <Input
          label="Adresse / repère"
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="Pont Akwa, rue de la Joss"
        />

        <div className={styles.grid2}>
          <Input
            type="number"
            step="0.0001"
            label="Latitude"
            value={form.lat}
            onChange={(e) => setField('lat', e.target.value)}
            placeholder="4.0469"
            required
          />
          <Input
            type="number"
            step="0.0001"
            label="Longitude"
            value={form.lng}
            onChange={(e) => setField('lng', e.target.value)}
            placeholder="9.7034"
            required
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Seuils d'alerte</legend>
          <p className={styles.fieldsetHint}>
            Vigilance = surveillance renforcée · Critique = alerte publique automatique + push
          </p>
          <div className={styles.thresholdsGrid}>
            {TYPE_KEYS.map((t) => {
              const meta = SENSOR_TYPES[t];
              return (
                <div key={t} className={styles.thresholdRow}>
                  <span className={styles.thresholdLabel}>
                    <span aria-hidden="true">{meta.icon}</span> {meta.label}
                  </span>
                  <label>
                    Vigilance ({meta.unit})
                    <input
                      className={styles.numInput}
                      type="number"
                      min="0"
                      max="200"
                      value={form.thresholds[t].warning}
                      onChange={(e) => setThreshold(t, 'warning', e.target.value)}
                    />
                  </label>
                  <label>
                    Critique ({meta.unit})
                    <input
                      className={styles.numInput}
                      type="number"
                      min="0"
                      max="200"
                      value={form.thresholds[t].critical}
                      onChange={(e) => setThreshold(t, 'critical', e.target.value)}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Button as="button" type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            {sensor ? 'Enregistrer' : 'Ajouter le capteur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
