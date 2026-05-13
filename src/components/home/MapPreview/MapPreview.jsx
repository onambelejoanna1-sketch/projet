import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import Button from '@/components/common/Button/Button';
import Badge from '@/components/common/Badge/Badge';
import { ROUTES } from '@/constants/routes';
import { ALERT_LEVELS } from '@/constants/sensorTypes';
import { listPublicSensors } from '@/services/api';
import styles from './MapPreview.module.css';

const PINS = [
  { x: 22, y: 38, label: 'Bonabéri', kind: 'flood' },
  { x: 42, y: 52, label: 'Akwa', kind: 'flood' },
  { x: 56, y: 36, label: 'Bonamoussadi', kind: 'storm' },
  { x: 64, y: 58, label: 'Ndogpassi', kind: 'land' },
  { x: 50, y: 70, label: 'New Bell', kind: 'fire' },
  { x: 30, y: 64, label: 'Village', kind: 'flood' },
];

const KIND_COLOR = {
  flood: 'var(--mangrove)',
  land: 'var(--clay)',
  fire: 'var(--alert)',
  storm: 'var(--ink)',
};

const SENSOR_POSITIONS = {
  'akwa': { x: 42, y: 52 },
  'bonaberi': { x: 22, y: 38 },
  'new-bell': { x: 50, y: 70 },
  'bepanda': { x: 46, y: 60 },
  'ndogpassi': { x: 64, y: 58 },
  'makepe': { x: 60, y: 48 },
};

export default function MapPreview() {
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listPublicSensors()
      .then((rows) => {
        if (!cancelled) setSensors(rows);
      })
      .catch(() => {
        if (!cancelled) setSensors([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={`${styles.section} section`} aria-labelledby="map-title">
      <Container size="xl" className={styles.inner}>
        <motion.div
          className={styles.copy}
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow">
            <span className="section-eyebrow__num">04</span>
            <span className="section-eyebrow__label">La carte</span>
          </div>
          <h2 id="map-title" className={styles.title}>
            Douala <em>en un coup d'œil</em>.
          </h2>
          <p className={styles.lede}>
            Signalements citoyens validés <strong>et capteurs IoT</strong> s'affichent en temps
            réel sur la carte de la ville. Les capteurs ESP32 surveillent niveau d'eau,
            pluviométrie et humidité du sol pour détecter une inondation <em>avant</em> qu'elle
            ne survienne.
          </p>

          <ul className={styles.legend}>
            <li>
              <span className={styles.swatch} style={{ background: 'var(--mangrove)' }} />
              Inondation
            </li>
            <li>
              <span className={styles.swatch} style={{ background: 'var(--clay)' }} />
              Glissement
            </li>
            <li>
              <span className={styles.swatch} style={{ background: 'var(--alert)' }} />
              Incendie
            </li>
            <li>
              <span className={styles.swatch} style={{ background: 'var(--ink)' }} />
              Tempête
            </li>
            <li>
              <span className={styles.swatch} style={{ background: ALERT_LEVELS.critical.color, borderStyle: 'dashed' }} />
              Capteur IoT
            </li>
          </ul>

          <Button as="link" to={ROUTES.MAP} variant="primary" size="lg">
            Explorer la carte complète →
          </Button>
        </motion.div>

        <motion.div
          className={styles.mapWrap}
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.mapHead}>
            <Badge tone="live" dot>
              Carte temps réel
            </Badge>
            <span className={styles.coords}>4°03'N · 9°46'E</span>
          </div>
          <div className={styles.map} role="img" aria-label="Carte de Douala avec marqueurs d'alertes et capteurs">
            <MapBg />
            {PINS.map((pin, i) => (
              <span
                key={i}
                className={styles.pin}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  '--pin': KIND_COLOR[pin.kind],
                }}
              >
                <span className={styles.pinDot} />
                <span className={styles.pinLabel}>{pin.label}</span>
              </span>
            ))}
            {sensors.map((s) => {
              const pos = SENSOR_POSITIONS[s.zoneId];
              if (!pos) return null;
              const color = s.offline ? '#6B7166' : ALERT_LEVELS[s.alertLevel].color;
              const isAlert = !s.offline && s.alertLevel !== 'normal';
              return (
                <span
                  key={s.id}
                  className={`${styles.sensor} ${isAlert ? styles.sensorAlert : ''}`}
                  style={{
                    left: `${pos.x + 4}%`,
                    top: `${pos.y - 4}%`,
                    '--sensor-color': color,
                  }}
                  title={`${s.name} — ${s.alertLevel}`}
                >
                  <span className={styles.sensorBox}>📡</span>
                </span>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function MapBg() {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" stroke="#faf6f0" strokeWidth="0.6" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="800" height="500" fill="#0e3b2e" />
      <rect width="800" height="500" fill="url(#mapGrid)" />
      {/* Wouri river curve */}
      <path
        d="M-20,300 C140,260 260,340 400,290 C540,250 660,330 820,310"
        fill="none"
        stroke="#e5572e"
        strokeWidth="14"
        opacity="0.4"
      />
      <path
        d="M-20,300 C140,260 260,340 400,290 C540,250 660,330 820,310"
        fill="none"
        stroke="#e5572e"
        strokeWidth="3"
        opacity="0.85"
      />
      {/* Coast/contour lines */}
      <g fill="none" stroke="#faf6f0" strokeWidth="0.7" opacity="0.45">
        <path d="M50,80 C200,60 380,120 540,80 C660,50 740,90 820,80" />
        <path d="M0,160 C160,140 320,180 480,160 C620,140 720,170 820,160" />
        <path d="M0,400 C160,420 320,380 480,400 C620,420 720,400 820,400" />
      </g>
      {/* Block labels */}
      <g fill="#faf6f0" opacity="0.55" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.1em" textAnchor="middle">
        <text x="160" y="200">BONABÉRI</text>
        <text x="370" y="240">AKWA</text>
        <text x="540" y="180">BONAMOUSSADI</text>
        <text x="600" y="320">NDOGPASSI</text>
        <text x="420" y="400">NEW BELL</text>
      </g>
    </svg>
  );
}
