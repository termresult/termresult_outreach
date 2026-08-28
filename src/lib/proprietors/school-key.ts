export function schoolKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
