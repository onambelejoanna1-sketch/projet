import { Link } from 'react-router-dom';
import Container from '@/components/common/Container/Container';
import Logo from '@/components/layout/Header/Logo';
import { ROUTES } from '@/constants/routes';
import styles from './Footer.module.css';

const EMERGENCY = [
  { label: 'Police secours', number: '117' },
  { label: 'Pompiers / Sécurité civile', number: '118' },
  { label: 'SAMU Cameroun', number: '119' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container size="xl" className={styles.inner}>
        <div className={styles.brandCol}>
          <Logo inverted />
          <p className={styles.tagline}>
            La veille citoyenne des catastrophes naturelles à&nbsp;Douala. Signalez. Informez.
            Protégez.
          </p>
        </div>

        <nav className={styles.linksCol} aria-label="Liens secondaires">
          <p className={styles.colTitle}>Naviguer</p>
          <Link to={ROUTES.MAP}>Carte</Link>
          <Link to={ROUTES.ALERTS}>Alertes en direct</Link>
          <Link to={ROUTES.REPORT}>Signaler</Link>
          <Link to={ROUTES.LOGIN}>Connexion</Link>
        </nav>

        <div className={styles.linksCol}>
          <p className={styles.colTitle}>Numéros d'urgence</p>
          <ul className={styles.emergency}>
            {EMERGENCY.map((e) => (
              <li key={e.number}>
                <span>{e.label}</span>
                <a href={`tel:${e.number}`} className={styles.tel}>
                  {e.number}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linksCol}>
          <p className={styles.colTitle}>Projet</p>
          <p className={styles.about}>
            Initiative citoyenne indépendante. Les signalements sont validés manuellement avant
            publication.
          </p>
        </div>
      </Container>

      <div className={styles.bottom}>
        <Container size="xl" className={styles.bottomInner}>
          <p>© {year} Alerte Douala — Tous droits réservés.</p>
          <p className={styles.coords}>4°03'N · 9°46'E</p>
        </Container>
      </div>
    </footer>
  );
}
