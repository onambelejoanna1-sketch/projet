import Badge from '@/components/common/Badge/Badge';
import styles from '../AdminDashboard.module.css';

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

export default function UsersOverview({ users }) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Utilisateurs</h2>
        <span className={styles.panelHint}>{users.length} comptes</span>
      </header>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th className={styles.cellNum}>Signalements</th>
              <th>Inscription</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className={styles.cellStrong}>{u.displayName || '—'}</td>
                <td>
                  <code className={styles.code}>{u.email}</code>
                </td>
                <td>
                  <Badge tone={u.role === 'admin' ? 'clay' : 'neutral'} dot>
                    {u.role === 'admin' ? 'Admin' : 'Sentinelle'}
                  </Badge>
                </td>
                <td className={styles.cellNum}>{u.reportsCount ?? 0}</td>
                <td className={styles.cellMuted}>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
