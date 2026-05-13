import styles from './Spinner.module.css';

export default function Spinner({ size = 24, label = 'Chargement…' }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
