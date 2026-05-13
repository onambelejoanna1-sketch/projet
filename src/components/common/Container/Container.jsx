import styles from './Container.module.css';
import { classNames } from '@/utils/formatters';

export default function Container({ children, size = 'lg', className, as: Tag = 'div', ...rest }) {
  return (
    <Tag className={classNames(styles.container, styles[`s_${size}`], className)} {...rest}>
      {children}
    </Tag>
  );
}
