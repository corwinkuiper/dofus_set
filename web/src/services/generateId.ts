let id = 0;

export function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (id++).toString();
}
