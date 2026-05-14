import { useEffect, useState } from 'react';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Badge from '@/components/common/Badge/Badge';
import Spinner from '@/components/common/Spinner/Spinner';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { updateUserProfile } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import {
  FEEDBACK_MAX,
  USER_DISPLAY_NAME_MIN,
  USER_DISPLAY_NAME_MAX,
} from '@/constants/formLimits';
import PushToggle from '@/components/notifications/PushToggle/PushToggle';
import { classNames } from '@/utils/formatters';
import styles from './Profile.module.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: '◆', end: true },
  { to: ROUTES.ALERTS, label: 'Alertes', icon: '!' },
  { to: ROUTES.MAP, label: 'Carte', icon: '◉' },
  { to: ROUTES.REPORT, label: 'Signaler', icon: '+' },
  { to: ROUTES.PROFILE, label: 'Mon profil', icon: '·' },
];

const LANG_KEY = 'alerteDouala.lang';
const FEEDBACK_KEY = 'alerteDouala.feedback';
const NAME_MIN = USER_DISPLAY_NAME_MIN;
const NAME_MAX = USER_DISPLAY_NAME_MAX;

const LANG_OPTIONS = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

const FAQ = [
  {
    q: 'Comment signaler une catastrophe ?',
    a:
      'Allez sur la page « Signaler », activez la caméra et prenez une photo, puis indiquez votre quartier et décrivez la situation observée.',
  },
  {
    q: 'Quand mon signalement sera-t-il visible publiquement ?',
    a:
      'Après validation par un administrateur. Cela prend généralement moins de 24 heures et permet d\'éviter la diffusion de fausses alertes.',
  },
  {
    q: 'Mes données personnelles sont-elles partagées ?',
    a:
      'Non. Votre nom et votre email restent privés. Seul le contenu validé du signalement (titre, zone, photo) est visible publiquement.',
  },
  {
    q: 'Comment se déconnecter ?',
    a:
      'Utilisez le bouton « Déconnexion » au bas du menu latéral à gauche.',
  },
];

function computeInitials(displayName, email) {
  return (displayName || email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '·';
}

function formatJoinDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function pluralize(n, singular, plural) {
  return `${n} ${n > 1 ? plural : singular}`;
}

export default function Profile() {
  const { profile, loading, isAdmin, refreshProfile } = useAuth();
  const { notify } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [lang, setLang] = useState('fr');
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Init language from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') setLang(saved);
  }, []);

  // Reset draft name whenever profile changes
  useEffect(() => {
    if (profile?.displayName !== undefined) setDraftName(profile.displayName ?? '');
  }, [profile?.displayName]);

  if (loading) {
    return (
      <DashboardLayout
        navItems={NAV_ITEMS}
        eyebrow="Espace personnel"
        title="Mon profil"
        tone="user"
      >
        <div className={styles.loadingWrap}>
          <Spinner size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const initials = computeInitials(profile?.displayName, profile?.email);

  function startEdit() {
    setNameError('');
    setDraftName(profile?.displayName ?? '');
    setEditingName(true);
  }

  function cancelEdit() {
    setNameError('');
    setDraftName(profile?.displayName ?? '');
    setEditingName(false);
  }

  async function saveName(e) {
    e?.preventDefault();
    const next = draftName.trim();
    if (next.length < NAME_MIN) {
      setNameError(`Au moins ${NAME_MIN} caractères.`);
      return;
    }
    if (next.length > NAME_MAX) {
      setNameError(`${NAME_MAX} caractères maximum.`);
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await updateUserProfile(profile.uid, { displayName: next });
      await refreshProfile();
      setEditingName(false);
      notify({
        tone: 'success',
        title: 'Profil mis à jour',
        body: 'Votre nom a été enregistré.',
      });
    } catch (err) {
      setNameError(err?.message || 'Échec de la mise à jour.');
    } finally {
      setSavingName(false);
    }
  }

  function changeLang(next) {
    if (next === lang) return;
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // quota — ignore
    }
    notify({
      tone: 'info',
      title: next === 'fr' ? 'Langue : Français' : 'Language: English',
      body:
        next === 'fr'
          ? 'Préférence enregistrée. La traduction complète arrive bientôt.'
          : 'Preference saved. Full translation coming soon.',
    });
  }

  async function sendFeedback() {
    const body = feedback.trim();
    if (body.length < 5) return;
    setSendingFeedback(true);
    try {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `fb-${Date.now().toString(36)}`;
      const entry = {
        id,
        uid: profile?.uid ?? 'anonymous',
        email: profile?.email ?? null,
        body,
        createdAt: new Date().toISOString(),
      };
      const raw = window.localStorage.getItem(FEEDBACK_KEY);
      let list = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          // donnée corrompue : on repart d'une liste vide plutôt que de planter
        }
      }
      list.push(entry);
      window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
      setFeedback('');
      notify({
        tone: 'success',
        title: 'Merci !',
        body: 'Votre commentaire a bien été reçu.',
      });
    } catch {
      notify({
        tone: 'error',
        title: 'Envoi impossible',
        body: 'Stockage saturé. Libérez de l\'espace puis réessayez.',
      });
    } finally {
      setSendingFeedback(false);
    }
  }

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow="Espace personnel"
      title="Mon profil"
      tone="user"
    >
      {/* ============ Identity card ============ */}
      <section className={styles.headerCard}>
        <span className={styles.avatarLg} aria-hidden="true">
          {initials}
        </span>

        <div className={styles.identity}>
          {!editingName ? (
            <>
              <h2 className={styles.name}>{profile?.displayName || 'Utilisateur'}</h2>
              <p className={styles.email}>{profile?.email}</p>
              <div className={styles.metaRow}>
                <Badge tone={isAdmin ? 'live' : 'validated'}>
                  {isAdmin ? 'Administrateur' : 'Sentinelle'}
                </Badge>
                <span>· Membre depuis {formatJoinDate(profile?.createdAt)}</span>
                <span>· {pluralize(profile?.reportsCount ?? 0, 'signalement', 'signalements')} envoyé{(profile?.reportsCount ?? 0) > 1 ? 's' : ''}</span>
              </div>
            </>
          ) : (
            <form className={styles.editForm} onSubmit={saveName}>
              <Input
                label="Nom affiché"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value.slice(0, NAME_MAX))}
                error={nameError}
                maxLength={NAME_MAX}
                autoFocus
              />
              <div className={styles.editActions}>
                <Button type="submit" variant="primary" size="sm" disabled={savingName}>
                  {savingName ? (
                    <>
                      <Spinner size={14} /> Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={savingName}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>

        {!editingName && (
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" onClick={startEdit}>
              Modifier le nom
            </Button>
          </div>
        )}
      </section>

      {/* ============ Settings — Notifications push ============ */}
      <section className={styles.panel} aria-labelledby="push-title">
        <header className={styles.panelHead}>
          <h2 id="push-title" className={styles.panelTitle}>Notifications push</h2>
          <span className={styles.panelHint}>Recevoir les alertes même app fermée</span>
        </header>
        <div className={styles.panelBody}>
          <PushToggle />
        </div>
      </section>

      {/* ============ Settings — Langue ============ */}
      <section className={styles.panel} aria-labelledby="lang-title">
        <header className={styles.panelHead}>
          <h2 id="lang-title" className={styles.panelTitle}>Langue</h2>
          <span className={styles.panelHint}>Préférence d'affichage</span>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.langPills} role="radiogroup" aria-label="Choix de la langue">
            {LANG_OPTIONS.map((opt) => {
              const selected = lang === opt.id;
              return (
                <label
                  key={opt.id}
                  className={classNames(styles.langPill, selected && styles.langPillSelected)}
                >
                  <input
                    type="radio"
                    name="lang"
                    value={opt.id}
                    checked={selected}
                    onChange={() => changeLang(opt.id)}
                    className={styles.hiddenInput}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
          <p className={styles.settingHint}>
            La traduction complète des écrans arrive bientôt. Votre choix est enregistré.
          </p>
        </div>
      </section>

      {/* ============ Settings — Aide ============ */}
      <section className={styles.panel} aria-labelledby="help-title">
        <header className={styles.panelHead}>
          <h2 id="help-title" className={styles.panelTitle}>Aide</h2>
          <span className={styles.panelHint}>Questions fréquentes</span>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.faq}>
            {FAQ.map((item, i) => (
              <details key={i} className={styles.faqItem}>
                <summary className={styles.faqSummary}>{item.q}</summary>
                <p className={styles.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Besoin d'un contact direct ?</span>
            <Button
              as="a"
              href="mailto:contact@alerte-douala.cm"
              variant="ghost"
              size="sm"
            >
              Écrire à l'équipe →
            </Button>
          </div>
        </div>
      </section>

      {/* ============ Settings — Commentaires ============ */}
      <section className={styles.panel} aria-labelledby="feedback-title">
        <header className={styles.panelHead}>
          <h2 id="feedback-title" className={styles.panelTitle}>Commentaires</h2>
          <span className={styles.panelHint}>Aidez-nous à améliorer l'app</span>
        </header>
        <div className={styles.panelBody}>
          <textarea
            className={styles.feedbackTextarea}
            placeholder="Une suggestion, un bug, une idée d'amélioration ?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, FEEDBACK_MAX))}
            rows={5}
          />
          <div className={styles.feedbackRow}>
            <span className={styles.counter}>
              {feedback.length} / {FEEDBACK_MAX}
            </span>
            <Button
              variant="clay"
              onClick={sendFeedback}
              disabled={sendingFeedback || feedback.trim().length < 5}
            >
              {sendingFeedback ? (
                <>
                  <Spinner size={16} /> Envoi…
                </>
              ) : (
                'Envoyer'
              )}
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
