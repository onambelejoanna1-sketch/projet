import { motion } from 'framer-motion';
import Logo from '@/components/layout/Header/Logo';
import styles from './AuthLayout.module.css';

export default function AuthLayout({
  eyebrow,
  headline,
  manifesto,
  bullets,
  children,
}) {
  return (
    <main className={styles.shell}>
      <aside className={styles.aside} aria-hidden="false">
        <div className={styles.asideTop}>
          <Logo inverted />
        </div>

        <motion.div
          className={styles.asideBody}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.headline}>{headline}</h1>
          {manifesto && <p className={styles.manifesto}>{manifesto}</p>}

          {bullets && (
            <ul className={styles.bullets}>
              {bullets.map((b, i) => (
                <li key={i}>
                  <span className={styles.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <TopoDecoration className={styles.topo} />

        <div className={styles.asideFoot}>
          <span>Douala · 4°03'N · 9°46'E</span>
          <span className={styles.dot} aria-hidden="true" />
          <span>Veille citoyenne, 24h/24</span>
        </div>
      </aside>

      <section className={styles.formWrap}>
        <motion.div
          className={styles.formInner}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </section>
    </main>
  );
}

function TopoDecoration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M0,420 C100,400 220,440 360,420 C500,400 600,460 700,440" opacity="0.6" />
        <path d="M0,380 C140,360 240,400 380,380 C520,360 600,420 700,400" opacity="0.45" />
        <path d="M0,340 C160,320 260,360 400,340 C540,320 600,380 700,360" opacity="0.6" />
        <path d="M0,300 C180,280 280,320 420,300 C560,280 600,340 700,320" opacity="0.45" />
        <path d="M-40,180 C140,140 320,200 480,170 C640,140 700,180 800,160" opacity="0.55" />
        <path d="M-40,140 C160,100 340,160 500,130 C660,100 700,140 800,120" opacity="0.4" />
      </g>
      <path
        d="M-20,500 C100,460 220,540 380,490 C520,450 640,540 820,500"
        fill="none"
        stroke="#e5572e"
        strokeWidth="2"
        opacity="0.6"
      />
    </svg>
  );
}
