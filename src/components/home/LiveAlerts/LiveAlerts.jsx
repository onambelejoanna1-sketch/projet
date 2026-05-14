import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { ROUTES } from '@/constants/routes';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import { getPublicFeed } from '@/services/api';
import { disasterLabel, zoneName, severityInfo } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import styles from './LiveAlerts.module.css';

const COVER_BY_TYPE = {
  flood: 'flood',
  landslide: 'land',
  fire: 'fire',
  storm: 'storm',
};

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicFeed(6)
      .then((rows) => {
        if (!cancelled) setAlerts(rows);
      })
      .catch(() => {
        if (!cancelled) setAlerts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={`${styles.section} section`} aria-labelledby="live-title">
      <Container size="xl">
        <div className={styles.head}>
          <div>
            <div className="section-eyebrow">
              <span className="section-eyebrow__num">03</span>
              <span className="section-eyebrow__label">En direct</span>
            </div>
            <h2 id="live-title" className={styles.title}>
              Les dernières <em>alertes&nbsp;validées</em>.
            </h2>
          </div>
          <Button as="link" to={ROUTES.ALERTS} variant="outline" size="md">
            Toutes les alertes
          </Button>
        </div>

        {alerts == null ? null : alerts.length === 0 ? (
          <p className={styles.empty}>
            Aucune alerte récente — soyez la première sentinelle de Douala.
          </p>
        ) : (
          <ul className={styles.grid}>
            {alerts.map((alert, i) => {
              const src = COVER_BY_TYPE[alert.type] || 'flood';
              const sev = severityInfo(alert.severity);
              return (
                <motion.li
                  key={alert.id}
                  className={styles.cardWrap}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.55,
                    delay: (i % 3) * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <article className={styles.card}>
                    <div className={`${styles.cover} ${styles[`cover_${src}`]}`}>
                      <SrcGlyph src={src} />
                    </div>
                    <div className={styles.body}>
                      <div className={styles.meta}>
                        <Badge tone="validated" dot>
                          Validée
                        </Badge>
                        <span className={styles.metaTime}>{timeSinceISO(alert.createdAt)}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{alert.title}</h3>
                      {alert.description && (
                        <p className={styles.excerpt}>{alert.description}</p>
                      )}
                      <div className={styles.cardFooter}>
                        <span className={styles.kind}>{disasterLabel(alert.type)}</span>
                        <span className={styles.dotSep} aria-hidden="true">
                          •
                        </span>
                        <span className={styles.zone}>{zoneName(alert.quartierId)}</span>
                        <span className={styles.dotSep} aria-hidden="true">
                          •
                        </span>
                        <span className={styles.severity} style={{ color: sev.color }}>
                          {SEVERITY_LABEL[alert.severity] || sev.label}
                        </span>
                      </div>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}

function SrcGlyph({ src }) {
  if (src === 'flood') {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M10 70 Q30 55, 50 70 T90 70 T130 70" />
        <path d="M10 85 Q30 70, 50 85 T90 85 T130 85" opacity="0.7" />
        <path d="M10 100 Q30 85, 50 100 T90 100 T130 100" opacity="0.4" />
      </svg>
    );
  }
  if (src === 'land') {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M5 100 L40 50 L60 75 L85 35 L115 100 Z" />
        <path d="M30 75 L50 65" opacity="0.6" />
      </svg>
    );
  }
  if (src === 'fire') {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M60 20 C70 40, 90 50, 80 75 C95 65, 95 90, 80 100 C70 105, 50 105, 40 100 C25 90, 25 65, 40 75 C30 55, 50 45, 60 20 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M10 50 Q40 35, 70 50 T120 50" />
      <path d="M10 70 Q40 55, 70 70 T120 70" opacity="0.7" />
      <path d="M10 90 Q40 75, 70 90 T120 90" opacity="0.4" />
    </svg>
  );
}
