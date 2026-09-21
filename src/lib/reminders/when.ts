const LAGOS = "Africa/Lagos";

export function lagosDateTimeToIso(date: string, time: string): string {
  const day = date.trim();
  const clock = time.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("Pick a reminder date.");
  }
  if (!/^\d{2}:\d{2}$/.test(clock)) {
    throw new Error("Pick a reminder time.");
  }
  const [year, month, dayNum] = day.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, dayNum));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== dayNum) {
    throw new Error("Pick a reminder date.");
  }
  const [hour, minute] = clock.split(":").map(Number);
  if (hour > 23 || minute > 59) {
    throw new Error("Pick a reminder time.");
  }
  return `${day}T${clock}:00+01:00`;
}

export function splitLagosDateTime(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour")}:${read("minute")}`,
  };
}

export function formatReminderWhen(iso: string, now = new Date()): string {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return iso;
  const dueDay = splitLagosDateTime(iso).date;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS,
    hour: "numeric",
    minute: "2-digit",
  }).format(due);
  if (dueDay === today) return `Today ${clock}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);
  if (dueDay === yesterdayDay) return `Yesterday ${clock}`;
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(due);
  return `${weekday} ${clock}`;
}

export function isReminderOverdue(iso: string, now = new Date()): boolean {
  const due = Date.parse(iso);
  if (Number.isNaN(due)) return false;
  return due < now.getTime();
}

export function isReminderDueToday(iso: string, now = new Date()): boolean {
  const dueDay = splitLagosDateTime(iso).date;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return dueDay === today;
}

export function compareReminders(
  a: { done: boolean; due_at: string; created_at: string },
  b: { done: boolean; due_at: string; created_at: string },
): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const due = a.due_at.localeCompare(b.due_at);
  if (due) return due;
  return a.created_at.localeCompare(b.created_at);
}

export function defaultReminderSlot(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Math.min(23, Number(read("hour")) + 1);
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${String(hour).padStart(2, "0")}:00`,
  };
}
