import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  listUsers,
  createUserByAdmin,
  deleteUser,
} from '@/services/auth';
import { isEmail, isStrongPassword } from '@/utils/validators';
import { authErrorMessage } from '@/pages/Auth/firebaseAuthErrors';
import { ADMIN_NAV_ITEMS } from '../adminNav';
import styles from './AdminUsers.module.css';

const ROLE_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'admin', label: 'Administrateurs' },
  { value: 'user', label: 'Sentinelles' },
];

export default function AdminUsers() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUsers();
      setUsers(list);
    } catch (err) {
      notify({
        tone: 'error',
        title: 'Erreur de chargement',
        body: authErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);

  function resetForm() {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setFormErrors({});
    setFormError('');
  }

  function validate() {
    const next = {};
    if (displayName.trim().length < 2) {
      next.displayName = 'Indique un nom (2 caractères minimum).';
    }
    if (!isEmail(email)) next.email = 'Adresse email invalide.';
    if (!isStrongPassword(password)) {
      next.password = '8 caractères minimum.';
    }
    if (password !== confirm) {
      next.confirm = 'Les deux mots de passe ne correspondent pas.';
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onCreateAdmin(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const newUser = await createUserByAdmin({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role: 'admin',
      });
      notify({
        tone: 'success',
        title: 'Administrateur créé',
        body: `${newUser.displayName} peut maintenant se connecter avec son email.`,
      });
      resetForm();
      await refresh();
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteUser(target.uid);
      notify({
        tone: 'success',
        title: 'Utilisateur supprimé',
        body: `${target.displayName} a été retiré de la base.`,
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: 'Suppression impossible',
        body: authErrorMessage(err),
      });
    }
  }

  return (
    <DashboardLayout
      navItems={ADMIN_NAV_ITEMS}
      eyebrow="Console admin · Utilisateurs"
      title={`Utilisateurs, ${firstName}`}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Gérez la communauté des sentinelles et l'équipe administrateur. Créez de
          nouveaux comptes admin ou supprimez ceux qui ne sont plus actifs.
        </p>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <p className={styles.eyebrow}>Nouvel administrateur</p>
          <h2 className={styles.cardTitle}>Créer un compte admin</h2>
          <p className={styles.cardSub}>
            Le compte est immédiatement actif. L'administrateur pourra se connecter
            avec l'email et le mot de passe que vous définissez.
          </p>
        </header>

        <form className={styles.form} onSubmit={onCreateAdmin} noValidate>
          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}
          <div className={styles.formRow}>
            <Input
              label="Nom complet"
              type="text"
              placeholder="Ariane Mbappe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={formErrors.displayName}
              required
              disabled={submitting}
            />
            <Input
              label="Email"
              type="email"
              inputMode="email"
              placeholder="admin@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formRow}>
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
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
              error={formErrors.confirm}
              required
              disabled={submitting}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            className={styles.submit}
          >
            {submitting ? (
              <>
                <Spinner size={16} label="" /> Création…
              </>
            ) : (
              <>Créer l'administrateur →</>
            )}
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <p className={styles.eyebrow}>Communauté</p>
          <h2 className={styles.cardTitle}>
            {loading ? 'Chargement…' : `${users.length} compte(s) — ${adminCount} admin`}
          </h2>
          <div className={styles.filters}>
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className={styles.loader}>
            <Spinner size={28} label="Chargement…" />
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Aucun utilisateur ne correspond au filtre.</p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((u) => {
              const isSelf = u.uid === profile?.uid;
              const isLastAdmin = u.role === 'admin' && adminCount <= 1;
              const cannotDelete = isSelf || isLastAdmin;
              return (
                <li key={u.uid} className={styles.row}>
                  <div className={styles.identity}>
                    <span className={styles.avatar}>
                      {u.displayName?.slice(0, 2).toUpperCase() || '??'}
                    </span>
                    <div>
                      <p className={styles.name}>{u.displayName}</p>
                      <p className={styles.email}>{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Sentinelle'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(u)}
                    disabled={cannotDelete}
                    title={
                      isSelf
                        ? 'Vous ne pouvez pas supprimer votre propre compte.'
                        : isLastAdmin
                          ? 'Impossible de supprimer le dernier administrateur.'
                          : 'Supprimer ce compte'
                    }
                  >
                    Supprimer
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pendingDelete && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirmer la suppression</h3>
            <p className={styles.modalBody}>
              Voulez-vous vraiment supprimer définitivement le compte de{' '}
              <strong>{pendingDelete.displayName}</strong> ({pendingDelete.email}) ? Cette
              action est irréversible.
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" size="md" onClick={() => setPendingDelete(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="md" onClick={confirmDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
