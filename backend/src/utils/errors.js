export function makeError(code, message, status) {
  const err = new Error(message || code);
  err.code = code;
  if (status) err.status = status;
  return err;
}

export const STATUS_BY_CODE = {
  'auth/invalid-email': 400,
  'auth/weak-password': 400,
  'auth/invalid-display-name': 400,
  'auth/invalid-role': 400,
  'auth/missing-fields': 400,
  'auth/wrong-password': 401,
  'auth/invalid-token': 401,
  'auth/missing-token': 401,
  'auth/forbidden': 403,
  'auth/user-not-found': 404,
  'auth/email-already-in-use': 409,
  'auth/invalid-reset-token': 400,

  'disasters/invalid-payload': 400,
  'disasters/invalid-photo': 400,
  'disasters/not-found': 404,
  'disasters/photo-too-large': 413,
  'disasters/invalid-status': 400,

  'sensors/not-found': 404,
  'sensors/invalid-payload': 400,
  'sensors/unauthorized': 401,
  'sensors/duplicate-device': 409,

  'notifications/not-found': 404,

  'push/disabled': 503,
  'push/invalid-subscription': 400,
};

export function statusForCode(code) {
  return STATUS_BY_CODE[code] || 500;
}
