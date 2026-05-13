import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import styles from './ProtectedRoute.module.css';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();
  const location = useLocation();

  const denied = requireAdmin && !loading && user && !isAdmin;

  useEffect(() => {
    if (denied) {
      notify({
        tone: 'error',
        title: 'Accès réservé',
        body: 'Cette section est réservée aux administrateurs.',
      });
    }
  }, [denied, notify]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <Spinner size={32} label="Chargement…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  if (denied) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}
