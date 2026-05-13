import { motion } from 'framer-motion';
import Container from '@/components/common/Container/Container';
import Button from '@/components/common/Button/Button';
import { ROUTES } from '@/constants/routes';
import styles from './CTAFinal.module.css';

export default function CTAFinal() {
  return (
    <section className={`${styles.section} section`} aria-labelledby="cta-title">
      <Container size="lg">
        <motion.div
          className={styles.box}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={styles.eyebrow}>Devenez sentinelle</p>
          <h2 id="cta-title" className={styles.title}>
            Une seule alerte peut <em>sauver</em> un quartier.
          </h2>
          <p className={styles.lede}>
            Rejoignez Alerte Douala. Recevez les notifications, signalez quand vous voyez quelque
            chose, contribuez à protéger votre ville. Inscription gratuite, vos données restent au
            Cameroun.
          </p>
          <div className={styles.actions}>
            <Button as="link" to={ROUTES.REGISTER} variant="paper" size="lg">
              Créer un compte →
            </Button>
            <Button as="link" to={ROUTES.REPORT} variant="ghost" size="lg" className={styles.ghostInverted}>
              Signaler maintenant
            </Button>
          </div>
        </motion.div>
      </Container>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeRow}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={styles.marqueeItem}>
              ALERTE DOUALA <span className={styles.marqueeTri}>▲</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
