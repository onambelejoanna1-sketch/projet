import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    n: '01',
    title: 'Vous signalez',
    body:
      'Photo, lieu, courte description : il suffit de quelques secondes. Géolocalisation automatique pour pointer le quartier exact.',
    icon: SignalIcon,
  },
  {
    n: '02',
    title: 'On valide',
    body:
      'Une équipe d\'admins citoyens vérifie chaque signalement avant publication. Pas de fausse alerte, pas de panique inutile.',
    icon: CheckIcon,
  },
  {
    n: '03',
    title: 'Tout Douala est informé',
    body:
      'Notification push aux habitants concernés, fil en direct sur la carte, alertes consultables 24/7. La ville entière prend le pouls.',
    icon: BroadcastIcon,
  },
];

export default function HowItWorks() {
  return (
    <section className={`${styles.section} section`} aria-labelledby="how-title">
      <Container size="xl">
        <div className="section-eyebrow">
          <span className="section-eyebrow__num">02</span>
          <span className="section-eyebrow__label">Comment ça marche</span>
        </div>

        <h2 id="how-title" className={styles.title}>
          Trois gestes <em>pour&nbsp;changer</em> la donne.
        </h2>

        <ol className={styles.grid}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.n}
                className={styles.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className={styles.num}>{step.n}</span>
                <span className={styles.icon} aria-hidden="true">
                  <Icon />
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </motion.li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M32 8 L56 52 L8 52 Z" />
      <line x1="32" y1="24" x2="32" y2="38" />
      <circle cx="32" cy="44" r="2" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <rect x="8" y="8" width="48" height="48" />
      <path d="M18 32 L28 42 L46 22" />
    </svg>
  );
}

function BroadcastIcon() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="32" cy="32" r="6" />
      <path d="M22 22 a14 14 0 0 0 0 20" />
      <path d="M42 22 a14 14 0 0 1 0 20" />
      <path d="M14 14 a26 26 0 0 0 0 36" />
      <path d="M50 14 a26 26 0 0 1 0 36" />
    </svg>
  );
}
