import { classNames } from '@/utils/formatters';
import styles from './Toast.module.css';

export default function Toast({ toast, onDismiss }) {
  return (
    <div className={classNames(styles.toast, styles[`t_${toast.tone}`])} role="status">
      <div className={styles.body}>
        {toast.title && <p className={styles.title}>{toast.title}</p>}
        {toast.body && <p className={styles.text}>{toast.body}</p>}
      </div>
      <button className={styles.close} onClick={onDismiss} aria-label="Fermer la notification">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 6 L18 18 M6 18 L18 6" />
        </svg>
      </button>
    </div>
  );
}
