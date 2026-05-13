import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import styles from './Testimonials.module.css';

const QUOTES = [
  {
    body:
      "Le matin de l'inondation à Akwa, j'ai pu prévenir ma mère en 30 secondes. Ma famille n'attend plus la radio.",
    author: 'Ariane M.',
    role: 'Habitante d\'Akwa',
    initials: 'AM',
  },
  {
    body:
      "Comme commerçant à Bonabéri, je perds des marchandises chaque saison. Avec Alerte Douala, je sais quand fermer la boutique.",
    author: 'Jules N.',
    role: 'Commerçant à Bonabéri',
    initials: 'JN',
  },
  {
    body:
      "Je valide les signalements deux soirs par semaine. C'est ma façon de protéger mon quartier sans bouger de chez moi.",
    author: 'Estelle K.',
    role: 'Admin bénévole',
    initials: 'EK',
  },
];

const COUNTERS = [
  { value: '1 247', label: 'signalements traités' },
  { value: '32', label: 'quartiers couverts' },
  { value: '18', label: 'admins citoyens' },
  { value: '4 min', label: 'délai moyen de validation' },
];

export default function Testimonials() {
  return (
    <section className={`${styles.section} section`} aria-labelledby="testi-title">
      <Container size="xl">
        <div className="section-eyebrow">
          <span className="section-eyebrow__num">05</span>
          <span className="section-eyebrow__label">Communauté</span>
        </div>

        <h2 id="testi-title" className={styles.title}>
          Ils <em>protègent</em> déjà leur quartier.
        </h2>

        <ul className={styles.quotes}>
          {QUOTES.map((q, i) => (
            <motion.li
              key={q.author}
              className={styles.quote}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.65,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className={styles.mark} aria-hidden="true">
                «
              </span>
              <blockquote className={styles.body}>{q.body}</blockquote>
              <footer className={styles.who}>
                <span className={styles.avatar} aria-hidden="true">
                  {q.initials}
                </span>
                <div>
                  <p className={styles.author}>{q.author}</p>
                  <p className={styles.role}>{q.role}</p>
                </div>
              </footer>
            </motion.li>
          ))}
        </ul>

        <ul className={styles.counters}>
          {COUNTERS.map((c) => (
            <li key={c.label}>
              <span className={styles.counterValue}>{c.value}</span>
              <span className={styles.counterLabel}>{c.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
