export function publicUser(record) {
  if (!record) return null;
  const { password: _password, ...rest } = record;
  return rest;
}
