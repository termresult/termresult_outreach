const JUNK = new Set([
  "john@doe.com",
  "your.address@email.com",
  "email@example.com",
  "user@example.com",
  "name@example.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep as-is
  }
  value = value.replace(/^%20/i, "").replace(/\s+/g, "").toLowerCase();
  if (!value || JUNK.has(value) || !EMAIL_RE.test(value)) return null;
  if (value.endsWith("@example.com") || value.endsWith("@email.com")) return null;
  return value;
}

export function cleanEmails(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const email = cleanEmail(raw);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}
