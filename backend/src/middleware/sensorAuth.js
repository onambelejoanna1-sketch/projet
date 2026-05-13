import { env } from '../config/env.js';
import { makeError } from '../utils/errors.js';

export function requireSensorApiKey(req, _res, next) {
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== env.sensorApiKey) {
    return next(
      makeError('sensors/unauthorized', "Clé d'API capteur invalide ou manquante."),
    );
  }
  next();
}
