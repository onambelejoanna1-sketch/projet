import { Link } from 'react-router-dom';
import { classNames } from '@/utils/formatters';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  as = 'button',
  to,
  href,
  fullWidth = false,
  className,
  ...rest
}) {
  const cls = classNames(
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    fullWidth && styles.full,
    className,
  );

  if (as === 'link' && to) {
    return (
      <Link to={to} className={cls} {...rest}>
        <span className={styles.inner}>{children}</span>
      </Link>
    );
  }
  if (as === 'a' && href) {
    return (
      <a href={href} className={cls} {...rest}>
        <span className={styles.inner}>{children}</span>
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      <span className={styles.inner}>{children}</span>
    </button>
  );
}
