import { statusForCode } from '../utils/errors.js';

export function errorHandler(err, _req, res, _next) {
  const code = err.code || 'internal/unknown';
  const status = err.status || statusForCode(code);
  const message = err.message || 'Erreur interne.';
  if (status >= 500) {
    console.error('[errorHandler]', err);
  }
  res.status(status).json({
    error: { code, message },
  });
}
