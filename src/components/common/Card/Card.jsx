import { classNames } from '@/utils/formatters';
import styles from './Card.module.css';

export default function Card({
  children,
  variant = 'default',
  as: Tag = 'article',
  className,
  ...rest
}) {
  return (
    <Tag className={classNames(styles.card, styles[`v_${variant}`], className)} {...rest}>
      {children}
    </Tag>
  );
}
