export function allowlistEmails(raw = process.env.ALLOWLIST_EMAILS): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const defaults = ["officialtermresult@gmail.com"];
  return [...new Set([...defaults, ...fromEnv])];
}

export function isAllowlisted(
  email: string | null | undefined,
  raw = process.env.ALLOWLIST_EMAILS,
): boolean {
  if (!email) return false;
  return allowlistEmails(raw).includes(email.trim().toLowerCase());
}
