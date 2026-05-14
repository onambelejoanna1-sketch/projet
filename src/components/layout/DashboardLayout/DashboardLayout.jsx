import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { signOut } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import { classNames } from '@/utils/formatters';
import NotificationsBell from '@/components/notifications/NotificationsBell/NotificationsBell';
import SidebarNav from './SidebarNav';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  navItems,
  title,
  eyebrow,
  tone = 'user',
  children,
}) {
  const { profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    notify({ tone: 'info', title: 'Déconnecté', body: 'À très vite.' });
    navigate(ROUTES.HOME, { replace: true });
  }

  const initials = (profile?.displayName || profile?.email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div className={classNames(styles.shell, tone === 'admin' && styles.shellAdmin)}>
      <aside className={classNames(styles.sidebar, drawerOpen && styles.sidebarOpen)}>
        <div className={styles.brandWrap}>
          <Link to={ROUTES.HOME} className={styles.brand}>
            <span className={styles.brandMark}>AD</span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>Alerte Douala</span>
              <span className={styles.brandSub}>
                {tone === 'admin' ? 'Console admin' : 'Espace sentinelle'}
              </span>
            </span>
          </Link>
        </div>

        <SidebarNav items={navItems} />

        <div className={styles.sideFoot}>
          <div className={styles.userCard}>
            <span className={styles.avatar} aria-hidden="true">
              {initials || '·'}
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userName}>
                {profile?.displayName || 'Utilisateur'}
              </span>
              <span className={styles.userEmail}>{profile?.email}</span>
            </span>
          </div>
          <button type="button" onClick={handleSignOut} className={styles.logout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={drawerOpen}
            aria-label="Ouvrir le menu"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className={styles.topbarText}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1 className={styles.title}>{title}</h1>
          </div>
          <div className={styles.topbarActions}>
            <NotificationsBell />
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      {drawerOpen && (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Fermer le menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
