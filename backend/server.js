import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { ensureSeeded } from './src/db/seed.js';
import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import disastersRoutes from './src/routes/disasters.routes.js';
import sensorsRoutes from './src/routes/sensors.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import publicRoutes from './src/routes/public.routes.js';
import notificationsRoutes from './src/routes/notifications.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFound } from './src/middleware/notFound.js';

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: false }));
// 2 Mo pour accepter les photos en data URL (plafond effectif côté validateur).
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/disasters', disastersRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  const seed = await ensureSeeded();
  if (seed.seeded) {
    console.log(
      `[db] base initialisée : ${seed.usersCount} utilisateur(s) + ${seed.sensorsCount} capteur(s).`,
    );
  } else {
    console.log(
      `[db] base existante (${seed.usersCount} utilisateurs, ${seed.sensorsCount} capteurs).`,
    );
  }
  app.listen(env.port, () => {
    console.log(`[api] Alerte Douala backend écoute sur http://localhost:${env.port}`);
    console.log(`[api] CORS autorisé pour ${env.corsOrigin}`);
  });
}

start().catch((err) => {
  console.error('[api] échec du démarrage :', err);
  process.exit(1);
});
