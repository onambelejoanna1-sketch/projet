const EMAIL_RE = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

export function isEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

export function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
