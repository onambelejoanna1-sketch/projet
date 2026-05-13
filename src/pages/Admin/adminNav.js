import { ROUTES } from '@/constants/routes';

export const ADMIN_NAV_ITEMS = [
  { to: ROUTES.ADMIN, label: 'Vue d’ensemble', icon: '◆', end: true },
  { to: ROUTES.ADMIN_PENDING, label: 'À valider', icon: '!' },
  { to: ROUTES.ADMIN_ALERTS, label: 'Alertes', icon: '◉' },
  { to: ROUTES.ADMIN_SENSORS, label: 'Capteurs IoT', icon: '⏚' },
  { to: ROUTES.ADMIN_MAP, label: 'Carte', icon: '⌖' },
  { to: ROUTES.ADMIN_USERS, label: 'Utilisateurs', icon: '◫' },
  { to: ROUTES.HOME, label: 'Site public', icon: '↗' },
];
