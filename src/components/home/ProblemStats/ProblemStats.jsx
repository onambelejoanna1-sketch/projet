import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import { getPublicStats } from '@/services/api';
import styles from './ProblemStats.module.css';

const STATIC_DETAILS = {
  floodIncrease: {
    label: "d'inondations recensées à Douala depuis 2010",
    detail: 'Saison des pluies plus longue, urbanisation rapide, drainage saturé.',
    format: (s) => `+${s.value}${s.unit || '%'}`,
  },
  highRiskZones: {
    label: 'quartiers classés à risque élevé',
    detail: 'Bonabéri, Akwa, Ndogpassi, Bépanda, Makepè, Logbessou et 6 autres.',
    format: (s) => `${s.value}`,
  },
  exposedInhabitants: {
    label: 'habitants exposés chaque saison',
    detail: 'Pertes humaines, dommages matériels, déplacements forcés.',
    format: (s) => `${Math.round(s.value / 1000)}K${s.unit || '+'}`,
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
};

export default function ProblemStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((stats) => {
        if (!cancelled) setData(stats);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data
    ? Object.entries(STATIC_DETAILS)
        .filter(([key]) => data[key])
        .map(([key, meta]) => ({
          key,
          value: meta.format(data[key]),
          label: meta.label,
          detail: meta.detail,
        }))
    : [];

  return (
    <section className={`${styles.section} section`} aria-labelledby="problem-title">
      <Container size="xl">
        <div className="section-eyebrow">
          <span className="section-eyebrow__num">01</span>
          <span className="section-eyebrow__label">Le problème</span>
        </div>

        <motion.h2
          id="problem-title"
          className={styles.title}
          {...fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Une ville debout, <em>mais&nbsp;sous tension</em>.
        </motion.h2>

        <p className={styles.lede}>
          Douala vit chaque saison des pluies au rythme de l'eau qui monte. Sans canal d'information
          fiable, les habitants apprennent souvent les dégâts trop tard.
        </p>

        {items.length > 0 && (
          <ul className={styles.grid}>
            {items.map((stat, i) => (
              <motion.li
                key={stat.key}
                className={styles.card}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className={styles.value}>{stat.value}</span>
                <p className={styles.label}>{stat.label}</p>
                <p className={styles.detail}>{stat.detail}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
