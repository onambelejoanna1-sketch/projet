import { useEffect, useState } from 'react';
import styles from './InstallPrompt.module.css';

const DISMISSED_KEY = 'alerteDouala.installDismissedAt';
const DISMISS_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if (window.navigator?.standalone) return true;
  return false;
}

function wasDismissedRecently() {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * DAY_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iosFallback, setIosFallback] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isStandalone()) return undefined;
    if (wasDismissedRecently()) return undefined;

    function handleBeforeInstall(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setOpen(true);
    }

    function handleInstalled() {
      setOpen(false);
      setDeferredPrompt(null);
      markDismissed();
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    // iOS Safari ne déclenche pas beforeinstallprompt — on affiche un fallback
    // expliquant la procédure manuelle « Partager → Sur l'écran d'accueil ».
    if (isIos() && !isStandalone()) {
      const timer = setTimeout(() => setIosFallback(true), 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      // ignore
    }
    setDeferredPrompt(null);
    setOpen(false);
    markDismissed();
  }

  function handleDismiss() {
    markDismissed();
    setOpen(false);
    setIosFallback(false);
  }

  const showStandard = open && deferredPrompt;
  const showIos = !showStandard && iosFallback;

  if (!showStandard && !showIos) return null;

  return (
    <div className={styles.wrap} role="dialog" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.body}>
          <p className={styles.kicker}>Installer l'app</p>
          {showStandard ? (
            <>
              <p className={styles.title}>
                Gardez Alerte Douala à portée de main.
              </p>
              <p className={styles.lead}>
                Installez l'app sur votre appareil pour la lancer comme une appli
                native — sans passer par le navigateur.
              </p>
            </>
          ) : (
            <>
              <p className={styles.title}>Ajouter à l'écran d'accueil</p>
              <p className={styles.lead}>
                Sur iPhone / iPad : touchez <strong>Partager</strong>{' '}
                <span aria-hidden="true">⬆︎</span> puis{' '}
                <strong>« Sur l'écran d'accueil »</strong>.
              </p>
            </>
          )}
        </div>
        <div className={styles.actions}>
          {showStandard && (
            <button type="button" className={styles.btnPrimary} onClick={handleInstall}>
              Installer
            </button>
          )}
          <button type="button" className={styles.btnGhost} onClick={handleDismiss}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
