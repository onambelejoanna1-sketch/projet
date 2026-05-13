export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
