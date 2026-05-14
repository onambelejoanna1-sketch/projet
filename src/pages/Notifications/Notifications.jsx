import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV_ITEMS } from '@/pages/Admin/adminNav';
import { timeSinceISO, formatDateTime } from '@/utils/dates';
import { classNames } from '@/utils/formatters';
import styles from './Notifications.module.css';

const USER_NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: '◆', end: true },
  { to: ROUTES.ALERTS, label: 'Alertes', icon: '!' },
  { to: ROUTES.MAP, label: 'Carte', icon: '◉' },
  { to: ROUTES.REPORT, label: 'Signaler', icon: '+' },
  { to: ROUTES.PROFILE, label: 'Mon profil', icon: '·' },
];

const TYPE_LABEL = {
  'disaster.validated': 'Signalement validé',
  'disaster.rejected': 'Signalement rejeté',
  'sensor.critical': 'Alerte capteur',
};

const TYPE_TONE = {
  'disaster.validated': 'mangrove',
  'disaster.rejected': 'alert',
  'sensor.critical': 'clay',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { items, unreadCount, connected, loading, markRead, markAllRead, refresh } =
    useNotifications();

  async function handleClick(notif) {
    if (!notif.readAt) await markRead(notif.id);
    if (notif.link) navigate(notif.link);
  }

  return (
    <DashboardLayout
      navItems={isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS}
      eyebrow="Centre de messages"
      title="Notifications"
      tone={isAdmin ? 'admin' : 'user'}
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>
            Toutes vos notifications : validation de vos signalements et alertes capteur
            émises dans Douala. Cliquez pour ouvrir l'élément concerné.
          </p>
          <p className={styles.status}>
            {connected ? (
              <>
                <span className={styles.dot} aria-hidden="true" />
                Temps réel actif — {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </>
            ) : (
              <>Hors ligne — affichage du cache</>
            )}
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Rafraîchir
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
          >
            Tout marquer lu
          </Button>
        </div>
      </section>

      {loading && items.length === 0 ? (
        <p className={styles.muted}>Chargement…</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Pas de notifications pour le moment.</p>
          <p className={styles.emptyBody}>
            Vous serez prévenu(e) ici dès qu'un administrateur statue sur l'un de vos
            signalements, ou qu'un capteur détecte une situation critique à Douala.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => (
            <li
              key={n.id}
              className={classNames(styles.item, !n.readAt && styles.itemUnread)}
            >
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => handleClick(n)}
              >
                <span
                  className={classNames(
                    styles.tag,
                    styles[`tag_${TYPE_TONE[n.type] || 'ink'}`],
                  )}
                >
                  {TYPE_LABEL[n.type] || 'Info'}
                </span>
                <span className={styles.titleLine}>{n.title}</span>
                <span className={styles.bodyLine}>{n.body}</span>
                <span className={styles.timeLine} title={formatDateTime(n.createdAt)}>
                  {timeSinceISO(n.createdAt)}
                  {n.readAt ? ' · lue' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
