import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Variable d'environnement requise manquante : ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sensorApiKey: required('SENSOR_API_KEY'),
  // Web Push : optionnel — si absent, les notifications OS-level sont désactivées
  // (le canal SSE in-app continue de fonctionner normalement).
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || null,
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:contact@alerte-douala.cm',
};

export const webPushEnabled = Boolean(env.vapidPublicKey && env.vapidPrivateKey);
