import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function handler(_req, res) {
  res.status(429).json({
    error: {
      code: 'rate-limit/too-many-requests',
      message: 'Trop de requêtes. Réessayez dans quelques minutes.',
    },
  });
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const sensorIngestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) =>
    `${ipKeyGenerator(req, res)}:${req.params.deviceId || 'unknown'}`,
  handler,
});
