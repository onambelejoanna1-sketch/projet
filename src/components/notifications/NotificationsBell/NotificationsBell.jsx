import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ROUTES } from '@/constants/routes';
import { timeSinceISO } from '@/utils/dates';
import { classNames } from '@/utils/formatters';
import styles from './NotificationsBell.module.css';

const TYPE_LABEL = {
  'disaster.validated': 'Validation',
  'disaster.rejected': 'Rejet',
  'sensor.critical': 'Capteur',
};

export default function NotificationsBell({ tone = 'light' }) {
  const navigate = useNavigate();
  const { items, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const recent = items.slice(0, 6);

  async function handleItemClick(notif) {
    if (!notif.readAt) await markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div className={classNames(styles.root, styles[`tone_${tone}`])} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
            : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Centre de notifications">
          <header className={styles.panelHead}>
            <div>
              <p className={styles.title}>Notifications</p>
              <p className={styles.subtitle}>
                {connected ? (
                  <>
                    <span className={styles.dot} aria-hidden="true" /> Temps réel
                  </>
                ) : (
                  'Hors ligne'
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAll}
                onClick={() => markAllRead()}
              >
                Tout marquer lu
              </button>
            )}
          </header>

          {recent.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Pas de notifications.</p>
              <p className={styles.emptyBody}>
                Vous serez prévenu(e) ici dès qu'une alerte arrive ou qu'un signalement
                est validé.
              </p>
            </div>
          ) : (
            <ul className={styles.list}>
              {recent.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={classNames(styles.item, !n.readAt && styles.itemUnread)}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className={styles.itemTag}>
                      {TYPE_LABEL[n.type] || 'Info'}
                    </span>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemBody}>{n.body}</span>
                    <span className={styles.itemTime}>{timeSinceISO(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className={styles.panelFoot}>
            <button
              type="button"
              className={styles.seeAll}
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.NOTIFICATIONS);
              }}
            >
              Voir toutes les notifications →
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
