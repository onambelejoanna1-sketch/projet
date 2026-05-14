import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

const NotificationsContext = createContext({
  items: [],
  unreadCount: 0,
  loading: false,
  connected: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

const DEFAULT_LIMIT = 30;

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await listNotifications({ limit: DEFAULT_LIMIT });
      setItems(data.items || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error('[notifications] refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Initial load + reset à la déconnexion.
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [user?.uid, refresh]);

  // Abonnement SSE — réouvert quand l'utilisateur change.
  useEffect(() => {
    if (!user?.uid) {
      subscriptionRef.current?.close();
      subscriptionRef.current = null;
      setConnected(false);
      return undefined;
    }
    subscriptionRef.current = subscribeNotifications({
      onOpen: () => setConnected(true),
      onError: () => setConnected(false),
      onNotification: (notif) => {
        setItems((curr) => {
          // Évite les doublons si un refresh REST a déjà inséré la notif.
          if (curr.some((n) => n.id === notif.id)) return curr;
          return [notif, ...curr].slice(0, 100);
        });
        if (!notif.readAt) {
          setUnreadCount((n) => n + 1);
        }
        notify({
          tone:
            notif.type === 'disaster.rejected'
              ? 'error'
              : notif.type === 'sensor.critical'
                ? 'warning'
                : 'info',
          title: notif.title,
          body: notif.body,
        });
      },
    });
    return () => {
      subscriptionRef.current?.close();
      subscriptionRef.current = null;
      setConnected(false);
    };
  }, [user?.uid, notify]);

  const markRead = useCallback(async (id) => {
    try {
      const res = await markNotificationRead(id);
      setItems((curr) => curr.map((n) => (n.id === id ? res.notification : n)));
      setUnreadCount(res.unreadCount ?? 0);
    } catch (err) {
      console.error('[notifications] markRead failed:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((curr) =>
        curr.map((n) => (n.readAt ? n : { ...n, readAt: now })),
      );
      setUnreadCount(res.unreadCount ?? 0);
    } catch (err) {
      console.error('[notifications] markAllRead failed:', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      connected,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, loading, connected, refresh, markRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
