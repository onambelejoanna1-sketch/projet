import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import Button from '@/components/common/Button/Button';
import Badge from '@/components/common/Badge/Badge';
import LiveTicker from '@/components/home/LiveTicker/LiveTicker';
import { ROUTES } from '@/constants/routes';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <DoualaTopo className={styles.topo} />

      <Container size="xl" className={styles.inner}>
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge tone="live" dot>
            En direct · Douala
          </Badge>

          <h1 id="hero-title" className={styles.title}>
            Quand <em>Douala</em> parle, <span className={styles.underline}>on écoute</span>.
          </h1>

          <p className={styles.lede}>
            La première veille citoyenne dédiée aux catastrophes naturelles à&nbsp;Douala.
            Inondations, glissements, incendies&nbsp;: signalez en quelques secondes, recevez les
            alertes validées dans votre quartier.
          </p>

          <div className={styles.ctas}>
            <Button as="link" to={ROUTES.REPORT} variant="primary" size="lg">
              Signaler une catastrophe →
            </Button>
            <Button as="link" to={ROUTES.MAP} variant="outline" size="lg">
              Voir la carte
            </Button>
          </div>

          <div className={styles.proof}>
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>1 247</span>
              <span className={styles.proofLabel}>signalements traités</span>
            </div>
            <div className={styles.proofDivider} aria-hidden="true" />
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>32</span>
              <span className={styles.proofLabel}>quartiers couverts</span>
            </div>
            <div className={styles.proofDivider} aria-hidden="true" />
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>24/24</span>
              <span className={styles.proofLabel}>veille citoyenne</span>
            </div>
          </div>
        </motion.div>

        <motion.aside
          className={styles.right}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.frontPage}>
            <div className={styles.fpHead}>
              <span className={styles.fpDate}>Douala · 4°03'N</span>
              <span className={styles.fpEdition}>Édition n°{new Date().getFullYear()}</span>
            </div>
            <hr className={styles.fpRule} />
            <p className={styles.fpKicker}>Saison des pluies · alerte renforcée</p>
            <h2 className={styles.fpHeadline}>
              Akwa et Bonabéri sous surveillance après 36&nbsp;mm en 2&nbsp;heures.
            </h2>
            <div className={styles.fpMap}>
              <DoualaTopo variant="card" />
              <span className={styles.fpPin}>
                <span className={styles.pinDot} />
              </span>
              <span className={styles.fpPin2}>
                <span className={styles.pinDot} />
              </span>
            </div>
            <div className={styles.fpFooter}>
              <span>Suivi par 4 admins</span>
              <span className={styles.fpBadge}>Mise à jour il y a 3 min</span>
            </div>
          </div>
        </motion.aside>
      </Container>

      <LiveTicker />

      <svg className={styles.wave} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0,40 C160,72 320,8 480,40 C640,72 800,8 960,40 C1120,72 1280,8 1440,40 L1440,80 L0,80 Z"
          fill="#0e3b2e"
        />
        <path
          d="M0,55 C200,80 360,30 540,55 C720,80 900,30 1080,55 C1260,80 1380,40 1440,55 L1440,80 L0,80 Z"
          fill="#1a1a1a"
          opacity="0.85"
        />
      </svg>
    </section>
  );
}

function DoualaTopo({ className, variant }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="topoGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#topoGrid)" opacity="0.4" />
      {/* Topo lines — stylized representation of Wouri estuary */}
      <g fill="none" stroke="currentColor" strokeWidth={variant === 'card' ? '1.2' : '0.9'}>
        <path d="M0,420 C120,400 220,440 360,420 C500,400 620,460 800,440" opacity="0.35" />
        <path d="M0,380 C140,360 240,400 380,380 C520,360 640,420 800,400" opacity="0.5" />
        <path d="M0,340 C160,320 260,360 400,340 C540,320 660,380 800,360" opacity="0.65" />
        <path d="M0,300 C180,280 280,320 420,300 C560,280 680,340 800,320" opacity="0.5" />
        <path d="M0,260 C200,240 300,280 440,260 C580,240 700,300 800,280" opacity="0.35" />
        <path d="M-40,180 C140,140 320,200 480,170 C640,140 760,180 840,160" opacity="0.45" />
        <path d="M-40,140 C160,100 340,160 500,130 C660,100 780,140 840,120" opacity="0.3" />
      </g>
      {/* Wouri river */}
      <path
        d="M-20,500 C100,460 220,540 380,490 C520,450 640,540 820,500"
        fill="none"
        stroke="#e5572e"
        strokeWidth={variant === 'card' ? '2' : '1.2'}
        opacity="0.55"
      />
    </svg>
  );
}
