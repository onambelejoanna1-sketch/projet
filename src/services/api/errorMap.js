export function mapHttpError(status, body) {
  const fromServer = body?.error?.code;
  if (fromServer) {
    const err = new Error(body.error.message || fromServer);
    err.code = fromServer;
    err.status = status;
    return err;
  }
  const fallbackByStatus = {
    400: 'auth/invalid-argument',
    401: 'auth/invalid-credential',
    403: 'auth/forbidden',
    404: 'auth/user-not-found',
    409: 'auth/email-already-in-use',
    500: 'internal/server-error',
  };
  const code = fallbackByStatus[status] || 'internal/unknown';
  const err = new Error(`Erreur ${status}`);
  err.code = code;
  err.status = status;
  return err;
}

export function networkError(cause) {
  const err = new Error('Impossible de joindre le serveur.');
  err.code = 'auth/network-request-failed';
  err.cause = cause;
  return err;
}
