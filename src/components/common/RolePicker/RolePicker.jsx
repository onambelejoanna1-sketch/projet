import { classNames } from '@/utils/formatters';
import styles from './RolePicker.module.css';

const ROLES = [
  {
    value: 'user',
    title: 'Sentinelle',
    subtitle: 'Client',
    description: 'Je signale les catastrophes et je suis les alertes de mes quartiers.',
    icon: '👁',
  },
  {
    value: 'admin',
    title: 'Administrateur',
    subtitle: 'Console',
    description: 'Je valide les signalements et je supervise la communauté.',
    icon: '⚡',
  },
];

export default function RolePicker({ value, onChange, error, disabled = false, name = 'role' }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Type de compte</p>
      <div
        className={styles.grid}
        role="radiogroup"
        aria-label="Choix du type de compte"
        aria-required="true"
      >
        {ROLES.map((role) => {
          const selected = value === role.value;
          return (
            <label
              key={role.value}
              className={classNames(styles.card, selected && styles.selected)}
              data-disabled={disabled || undefined}
            >
              <input
                type="radio"
                name={name}
                value={role.value}
                checked={selected}
                onChange={() => onChange(role.value)}
                disabled={disabled}
                className={styles.input}
              />
              <span className={styles.icon} aria-hidden="true">{role.icon}</span>
              <span className={styles.body}>
                <span className={styles.eyebrow}>{role.subtitle}</span>
                <span className={styles.title}>{role.title}</span>
                <span className={styles.desc}>{role.description}</span>
              </span>
              <span className={styles.mark} aria-hidden="true">
                {selected ? '●' : '○'}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
