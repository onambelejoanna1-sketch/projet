import { classNames } from '@/utils/formatters';
import styles from './Badge.module.css';

export default function Badge({ children, tone = 'neutral', dot = false, className }) {
  return (
    <span className={classNames(styles.badge, styles[`t_${tone}`], className)}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
