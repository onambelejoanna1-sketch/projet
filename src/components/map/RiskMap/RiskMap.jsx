import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { DOUALA_CENTER, DOUALA_BOUNDS } from '@/constants/doualaZones';
import { ALERT_LEVELS } from '@/constants/sensorTypes';
import RiskLegend from '@/components/map/RiskLegend/RiskLegend';
import styles from './RiskMap.module.css';

const CENTER = [DOUALA_CENTER.lat, DOUALA_CENTER.lng];
const BOUNDS = [
  [DOUALA_BOUNDS.southWest.lat, DOUALA_BOUNDS.southWest.lng],
  [DOUALA_BOUNDS.northEast.lat, DOUALA_BOUNDS.northEast.lng],
];

const SENSOR_OFFLINE_COLOR = '#6B7166';

function getSensorColor(sensor) {
  if (sensor.offline || sensor.status !== 'active') return SENSOR_OFFLINE_COLOR;
  return ALERT_LEVELS[sensor.alertLevel]?.color ?? SENSOR_OFFLINE_COLOR;
}

export default function RiskMap({
  zones = [],
  sensors = null,
  center = CENTER,
  zoom = 12,
  height = 'clamp(420px, 65vh, 600px)',
  onZoneClick,
  onSensorClick,
  showLegend = true,
  className = '',
}) {
  return (
    <div className={`${styles.wrap} ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={11}
        maxZoom={17}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        className={styles.leafletRoot}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {zones.map((zone) => {
          const isNone = zone.risk.level === 'none';
          const radius = isNone ? 8 : 18;
          const fillOpacity = isNone ? 0.4 : 0.82;
          return (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={radius}
              pathOptions={{
                color: '#1A1A1A',
                weight: 2,
                fillColor: zone.risk.color,
                fillOpacity,
              }}
              eventHandlers={
                onZoneClick ? { click: () => onZoneClick(zone) } : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className={styles.tooltip}>
                  <strong>{zone.name}</strong>
                  <span className={styles.tooltipMeta}>
                    Risque {zone.risk.label.toLowerCase()}
                  </span>
                  <span className={styles.tooltipCounts}>
                    {zone.risk.sensorCount} capteur·s · {zone.risk.reportCount} signal.
                    {zone.risk.alertCount > 0 ? ` · ${zone.risk.alertCount} alerte·s` : ''}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {sensors &&
          sensors.map((sensor) => (
            <CircleMarker
              key={sensor.id}
              center={[sensor.lat, sensor.lng]}
              radius={6}
              pathOptions={{
                color: '#1A1A1A',
                weight: 1.5,
                fillColor: getSensorColor(sensor),
                fillOpacity: 0.95,
              }}
              eventHandlers={
                onSensorClick ? { click: () => onSensorClick(sensor) } : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <div className={styles.tooltip}>
                  <strong>{sensor.name}</strong>
                  <span className={styles.tooltipMeta}>
                    {sensor.offline
                      ? 'Hors ligne'
                      : (ALERT_LEVELS[sensor.alertLevel]?.label ?? 'Capteur')}
                  </span>
                  <span className={styles.tooltipCounts}>{sensor.deviceId}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>

      {showLegend && <RiskLegend />}
    </div>
  );
}
