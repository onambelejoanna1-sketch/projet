export const ROUTES = {
  HOME: '/',
  LOGIN: '/connexion',
  REGISTER: '/inscription',
  REPORT: '/signaler',
  ALERTS: '/alertes',
  ALERT_DETAIL: '/alertes/:id',
  MAP: '/carte',
  SENSORS: '/capteurs',
  PROFILE: '/profil',
  DASHBOARD: '/tableau-de-bord',
  ADMIN: '/admin',
  ADMIN_PENDING: '/admin/en-attente',
  ADMIN_ALERTS: '/admin/alertes',
  ADMIN_SENSORS: '/admin/capteurs',
  ADMIN_MAP: '/admin/carte',
  ADMIN_USERS: '/admin/utilisateurs',
};

export function alertDetailPath(id) {
  return `/alertes/${id}`;
}

export function sensorDetailPath(id) {
  return `/capteurs/${id}`;
}
