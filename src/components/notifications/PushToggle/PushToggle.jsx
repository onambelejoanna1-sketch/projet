import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import {
  disablePush,
  enablePush,
  getPushStatus,
  isPushSupported,
} from '@/services/api';
import styles from './PushToggle.module.css';

const PERMISSION_LABEL = {
  default: 'Non demandée',
  granted: 'Accordée',
  denied: 'Bloquée',
  unsupported: 'Non supportée',
};

export default function PushToggle() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getPushStatus();
      setStatus(next);
    } catch (err) {
      console.error('[push] status error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleEnable() {
    setWorking(true);
    try {
      await enablePush();
      notify({
        tone: 'success',
        title: 'Notifications activées',
        body: 'Vous recevrez les alertes même quand l\'app n\'est pas ouverte.',
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: 'Activation impossible',
        body: err?.message || "Une erreur s'est produite.",
      });
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable() {
    setWorking(true);
    try {
      await disablePush();
      notify({
        tone: 'info',
        title: 'Notifications désactivées',
        body: 'Vous ne recevrez plus de notifications push sur cet appareil.',
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: 'Désactivation impossible',
        body: err?.message || "Une erreur s'est produite.",
      });
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingRow}>
        <Spinner size={16} /> Chargement…
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>Compatibilité</dt>
          <dd>{status.supported ? 'Oui' : 'Non — navigateur non supporté'}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Permission</dt>
          <dd>{PERMISSION_LABEL[status.permission] || status.permission}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Abonné cet appareil</dt>
          <dd>{status.subscribed ? 'Oui' : 'Non'}</dd>
        </div>
      </dl>

      {!status.supported && (
        <p className={styles.hint}>
          Votre navigateur ne supporte pas les notifications push. Sur iOS, installez l'app
          sur l'écran d'accueil (Safari 16.4+).
        </p>
      )}

      {status.supported && status.permission === 'denied' && (
        <p className={styles.hint}>
          La permission a été refusée pour ce site. Pour la rétablir, ouvrez les
          paramètres du navigateur (cadenas dans la barre d'adresse → notifications →
          autoriser), puis rechargez la page.
        </p>
      )}

      {status.supported && (
        <div className={styles.actions}>
          {status.subscribed ? (
            <Button
              variant="outline"
              size="md"
              onClick={handleDisable}
              disabled={working}
            >
              {working ? (
                <>
                  <Spinner size={14} /> Désactivation…
                </>
              ) : (
                'Désactiver sur cet appareil'
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleEnable}
              disabled={working || status.permission === 'denied'}
            >
              {working ? (
                <>
                  <Spinner size={14} /> Activation…
                </>
              ) : (
                'Activer les notifications'
              )}
            </Button>
          )}
        </div>
      )}

      <p className={styles.devNote}>
        En développement, les notifications push nécessitent un build (
        <code>npm run preview:build</code>) car le service worker n'est pas actif en mode
        Vite dev.
      </p>
    </div>
  );
}
