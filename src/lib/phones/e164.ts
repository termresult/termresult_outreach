const NG_DIGITS = 13; // 234 + 10

export function toE164Ng(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let full = digits;
  if (digits.startsWith("234") && digits.length === NG_DIGITS) {
    full = digits;
  } else if (digits.startsWith("0") && digits.length === 11) {
    full = `234${digits.slice(1)}`;
  } else if (digits.length === 10 && /^[789]/.test(digits)) {
    full = `234${digits}`;
  } else {
    return null;
  }

  if (full.length !== NG_DIGITS) return null;
  return `+${full}`;
}
