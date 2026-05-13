import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { register } from '@/services/auth';
import { isEmail, isNonEmpty, isStrongPassword } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

const BULLETS = [
  'Inscription gratuite, en moins d\'une minute.',
  'Vos données restent privées et chiffrées.',
  'Validation manuelle de chaque signalement par un admin.',
];

export default function Register() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const target = isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      navigate(target, { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  function validate() {
    const next = {};
    if (!isNonEmpty(displayName) || displayName.trim().length < 2) {
      next.displayName = 'Indique ton nom (2 caractères minimum).';
    }
    if (!isEmail(email)) next.email = 'Adresse email invalide.';
    if (!isStrongPassword(password)) {
      next.password = '8 caractères minimum.';
    }
    if (password !== confirm) {
      next.confirm = 'Les deux mots de passe ne correspondent pas.';
    }
    if (!acceptTerms) {
      next.terms = 'Tu dois accepter les conditions pour continuer.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const newUser = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      notify({
        tone: 'success',
        title: 'Bienvenue parmi les sentinelles !',
        body: 'Votre compte est créé. Bonne veille à vous.',
      });
      const target = newUser?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Devenez sentinelle"
      headline={
        <>
          Une seule alerte peut <em>sauver</em> un quartier.
        </>
      }
      manifesto="Rejoignez la communauté des sentinelles de Douala. Une vigie collective, indépendante, qui protège la ville un signalement à la fois."
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>Inscription</p>
        <h2 className={formStyles.title}>
          Créez votre <em>compte</em>.
        </h2>
        <p className={formStyles.subtitle}>
          Quelques infos suffisent. Inscription gratuite, sans engagement.
        </p>
      </header>

      <form className={formStyles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <div className={formStyles.formError} role="alert">
            {formError}
          </div>
        )}

        <p className={formStyles.adminNote}>
          Compte créé en tant que <strong>sentinelle citoyenne</strong>. Les accès
          administrateurs sont attribués par l'équipe Alerte Douala.
        </p>

        <Input
          label="Nom complet"
          type="text"
          autoComplete="name"
          placeholder="Ariane Mbappe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          required
          disabled={submitting}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          disabled={submitting}
        />

        <div className={formStyles.row}>
          <Input
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="8 caractères minimum"
            required
            disabled={submitting}
          />
          <Input
            label="Confirmer"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            required
            disabled={submitting}
          />
        </div>

        <Terms
          checked={acceptTerms}
          onChange={setAcceptTerms}
          error={errors.terms}
          disabled={submitting}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
          className={formStyles.submit}
        >
          {submitting ? (
            <>
              <Spinner size={18} label="" /> Création en cours…
            </>
          ) : (
            <>Créer mon compte →</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>Déjà sentinelle ?</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          Se connecter →
        </Link>
      </div>
    </AuthLayout>
  );
}

function Terms({ checked, onChange, error, disabled }) {
  return (
    <label className="termsBox" style={{ display: 'block' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.85rem 1rem',
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{
            marginTop: '2px',
            width: '16px',
            height: '16px',
            accentColor: 'var(--clay)',
            flexShrink: 0,
          }}
        />
        <span>
          J'accepte que mes signalements soient examinés par les administrateurs avant publication
          et je m'engage à fournir des informations sincères.
        </span>
      </span>
      {error && (
        <span
          role="alert"
          style={{
            display: 'block',
            marginTop: '0.4rem',
            fontSize: 'var(--fs-xs)',
            color: 'var(--alert)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}
