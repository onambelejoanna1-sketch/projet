import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { confirmPasswordReset } from '@/services/auth';
import { isStrongPassword } from '@/utils/validators';
import { USER_PASSWORD_MIN } from '@/constants/formLimits';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

const BULLETS = [
  'Choisissez un mot de passe que vous n\'avez jamais utilisé ailleurs.',
  '8 caractères minimum, sans expression évidente.',
  'Vous serez redirigé vers la page de connexion juste après.',
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const initialToken = useMemo(() => (params.get('token') || '').trim(), [params]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!token || token.length < 16) {
      next.token = 'Jeton manquant. Recommencez la demande depuis la page Mot de passe oublié.';
    }
    if (!isStrongPassword(password)) {
      next.password = `Mot de passe trop faible (${USER_PASSWORD_MIN} caractères minimum).`;
    }
    if (password !== confirm) {
      next.confirm = 'Les deux mots de passe ne correspondent pas.';
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
      await confirmPasswordReset({ token, password });
      notify({
        tone: 'success',
        title: 'Mot de passe mis à jour',
        body: 'Vous pouvez vous connecter avec votre nouveau mot de passe.',
      });
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Nouveau mot de passe"
      headline={
        <>
          Choisissez un mot de passe <em>solide</em>.
        </>
      }
      manifesto="Cette opération invalide votre ancien mot de passe immédiatement. Pensez à le retenir."
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>Réinitialisation</p>
        <h2 className={formStyles.title}>
          Réinitialisez votre <em>mot de passe</em>.
        </h2>
        <p className={formStyles.subtitle}>
          Saisissez votre nouveau mot de passe ci-dessous. Le jeton de réinitialisation est
          à usage unique et expire après une heure.
        </p>
      </header>

      <form className={formStyles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <div className={formStyles.formError} role="alert">
            {formError}
          </div>
        )}

        {!initialToken && (
          <Input
            label="Jeton de réinitialisation"
            type="text"
            autoComplete="off"
            placeholder="Collez le jeton reçu par email"
            value={token}
            onChange={(e) => setToken(e.target.value.trim())}
            error={errors.token}
            required
            disabled={submitting}
          />
        )}

        <div className={formStyles.row}>
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={`${USER_PASSWORD_MIN} caractères minimum`}
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
              <Spinner size={18} label="" /> Mise à jour…
            </>
          ) : (
            <>Mettre à jour le mot de passe →</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>Vous vous souvenez ?</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          Retour à la connexion →
        </Link>
      </div>
    </AuthLayout>
  );
}
