import { NavLink } from 'react-router-dom';
import { classNames } from '@/utils/formatters';
import styles from './DashboardLayout.module.css';

export default function SidebarNav({ items }) {
  return (
    <nav className={styles.nav} aria-label="Navigation du tableau de bord">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            classNames(styles.navLink, isActive && styles.navLinkActive)
          }
        >
          {item.icon && <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
