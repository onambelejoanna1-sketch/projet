import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { signIn } from '@/services/auth';
import { isEmail, isNonEmpty } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

const BULLETS = [
  'Suivez les alertes validées de votre quartier.',
  'Activez les notifications push dès la connexion.',
  'Reprenez vos signalements là où vous les avez laissés.',
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirection automatique si l'utilisateur est déjà connecté en arrivant sur la page.
    // La redirection post-login est gérée directement dans onSubmit, à partir du rôle renvoyé
    // par signIn() — pour éviter une race condition avec le chargement du profil.
    if (!loading && user) {
      const fallback = isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      const redirectTo = location.state?.from ?? fallback;
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, isAdmin, navigate, location.state]);

  function validate() {
    const next = {};
    if (!isEmail(email)) next.email = 'Adresse email invalide.';
    if (!isNonEmpty(password)) next.password = 'Mot de passe requis.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const signedInUser = await signIn({ email: email.trim(), password });
      notify({
        tone: 'success',
        title: 'Bienvenue',
        body: 'Connexion réussie. Bonne veille !',
      });
      const fallback = signedInUser?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      const redirectTo = location.state?.from ?? fallback;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Espace sentinelle"
      headline={
        <>
          Bon retour, <em>sentinelle</em>.
        </>
      }
      manifesto="Reprenez la veille là où vous l'avez laissée. Vos signalements, vos alertes, vos quartiers — tout est resté à sa place."
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>Connexion</p>
        <h2 className={formStyles.title}>
          Reprenez la <em>veille</em>.
        </h2>
        <p className={formStyles.subtitle}>
          Entrez votre adresse email et votre mot de passe pour accéder à votre espace.
        </p>
      </header>

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
          error={errors.email}
          required
          disabled={submitting}
        />

        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          disabled={submitting}
        />

        <div className={formStyles.aside}>
          <span className={formStyles.helper}>Mot de passe oublié ?</span>
          <Link to={ROUTES.FORGOT_PASSWORD} className={formStyles.linkInline}>
            Le réinitialiser →
          </Link>
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
              <Spinner size={18} label="" /> Connexion en cours…
            </>
          ) : (
            <>Se connecter →</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>Pas encore de compte ?</span>
        <Link to={ROUTES.REGISTER} className={formStyles.linkInline}>
          Devenir sentinelle →
        </Link>
      </div>
    </AuthLayout>
  );
}
