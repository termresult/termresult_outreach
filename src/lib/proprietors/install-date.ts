const LAGOS = "Africa/Lagos";

export type InstallSlot = {
  date: string;
  proprietor_id: string;
  school_name: string;
  booked_by: string;
  booked_at: string;
};

export function todayInLagos(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function asInstallDate(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("Install date must be a calendar day.");
  }
  const [year, month, day] = raw.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error("Install date must be a calendar day.");
  }
  return raw;
}

export function isPastInstallDate(date: string, now = new Date()): boolean {
  return date < todayInLagos(now);
}

export function formatInstallDay(date: string): string {
  return formatParts(date, { day: "numeric", month: "short" });
}

export function formatInstallDayLong(date: string): string {
  return formatParts(date, { day: "numeric", month: "short", year: "numeric" });
}

export function slotTakenMessage(slot: Pick<InstallSlot, "booked_by" | "school_name" | "date">): string {
  return `${slot.booked_by} already booked ${slot.school_name} on ${formatInstallDay(slot.date)}.`;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

export function monthCells(year: number, month: number): Array<{ date: string; inMonth: boolean }> {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, month - 1, 1 - startOffset));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    return {
      date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      inMonth: y === year && m === month,
    };
  });
}

function formatParts(date: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(Date.UTC(year, month - 1, day)));
}
