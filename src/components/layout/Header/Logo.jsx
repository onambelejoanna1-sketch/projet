import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import styles from './Logo.module.css';

export default function Logo({ inverted = false }) {
  return (
    <Link
      to={ROUTES.HOME}
      className={`${styles.logo} ${inverted ? styles.inverted : ''}`}
      aria-label="Alerte Douala — accueil"
    >
      <span className={styles.alerte}>Alerte</span>
      <span className={styles.tri} aria-hidden="true">
        <svg viewBox="0 0 14 14" width="14" height="14">
          <path d="M7 1 L13 13 L1 13 Z" fill="currentColor" />
        </svg>
      </span>
      <span className={styles.douala}>Douala</span>
    </Link>
  );
}
