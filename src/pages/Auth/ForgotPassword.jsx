import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { requestPasswordReset } from '@/services/auth';
import { isEmail } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

const BULLETS = [
  'Indiquez votre adresse — on vous envoie un lien si un compte existe.',
  'Le lien reste valable 1 heure, à usage unique.',
  'Aucun email envoyé ? Vérifiez vos spams ou recommencez.',
];

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setFormError('');
    if (!isEmail(email)) {
      setError('Adresse email invalide.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setDone(true);
      if (result?.devToken) setDevToken(result.devToken);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const resetWithToken = devToken
    ? `${ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(devToken)}`
    : null;

  return (
    <AuthLayout
      eyebrow="Récupération d'accès"
      headline={
        <>
          On vous remet en <em>selle</em>.
        </>
      }
      manifesto="Entrez l'adresse email associée à votre compte. Si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe."
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>Mot de passe oublié</p>
        <h2 className={formStyles.title}>
          Réinitialisez votre <em>accès</em>.
        </h2>
        <p className={formStyles.subtitle}>
          Saisissez votre adresse email. Si un compte y est rattaché, vous recevrez les
          instructions pour choisir un nouveau mot de passe.
        </p>
      </header>

      {!done ? (
        <form className={formStyles.form} onSubmit={onSubmit} noValidate>
          {formError && (
            <div className={formStyles.formError} role="alert">
              {formError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
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
                <Spinner size={18} label="" /> Envoi en cours…
              </>
            ) : (
              <>Envoyer le lien →</>
            )}
          </Button>
        </form>
      ) : (
        <div className={formStyles.form} role="status" aria-live="polite">
          <p
            style={{
              padding: '1rem 1.1rem',
              border: '2px solid var(--mangrove)',
              background: 'var(--paper)',
              fontSize: 'var(--fs-sm)',
              lineHeight: 1.6,
            }}
          >
            Si un compte existe pour <strong>{email.trim()}</strong>, un lien de
            réinitialisation a été envoyé. Il reste valable 1 heure. Pensez à vérifier vos
            spams.
          </p>
          {resetWithToken && (
            <div
              style={{
                padding: '0.85rem 1rem',
                border: '2px dashed var(--clay)',
                background: '#FFF7F1',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-xs)',
                lineHeight: 1.6,
              }}
            >
              <p
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--clay)',
                  fontWeight: 'var(--weight-bold)',
                  marginBottom: '0.4rem',
                }}
              >
                Mode développement
              </p>
              <p>
                Aucun email n'est envoyé en local. Utilisez directement le lien :{' '}
                <Link to={resetWithToken} className={formStyles.linkInline}>
                  réinitialiser maintenant →
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>Vous vous souvenez ?</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          Retour à la connexion →
        </Link>
      </div>
    </AuthLayout>
  );
}
