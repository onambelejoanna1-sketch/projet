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
  sensorApiKey: process.env.SENSOR_API_KEY || 'dev-sensor-key',
};
