import type { CampaignThrottle } from "@/types/campaign";
import type { Message } from "@/types/message";

const LAGOS = "Africa/Lagos";

export function lagosDateKey(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function emailThrottleFromEnv(): CampaignThrottle {
  const gap = Number(process.env.EMAIL_GAP_SECONDS ?? 60);
  const cap = Number(process.env.EMAIL_DAILY_CAP ?? 400);
  return {
    gap_seconds: Number.isFinite(gap) && gap > 0 ? gap : 60,
    daily_cap: Number.isFinite(cap) && cap > 0 ? cap : 400,
  };
}

export function sentEmailCountOnDay(messages: Message[], dayKey: string): number {
  return messages.filter((row) => {
    if (row.channel !== "email" || row.status !== "sent" || !row.completed_at) return false;
    return lagosDateKey(new Date(row.completed_at)) === dayKey;
  }).length;
}

export function lastSuccessfulEmailAt(messages: Message[]): Date | null {
  let latest: Date | null = null;
  for (const row of messages) {
    if (row.channel !== "email" || row.status !== "sent" || !row.completed_at) continue;
    const at = new Date(row.completed_at);
    if (!latest || at > latest) latest = at;
  }
  return latest;
}

export function nextQueuedEmail(messages: Message[]): Message | null {
  return messages
    .filter((row) => row.channel === "email" && row.status === "queued")
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
}

export type TickGate =
  | { ok: true }
  | { ok: false; reason: "none_queued" | "daily_cap" | "gap" };

export function canSendEmailTick(input: {
  messages: Message[];
  throttle: CampaignThrottle;
  now?: Date;
}): TickGate {
  if (!nextQueuedEmail(input.messages)) return { ok: false, reason: "none_queued" };
  const now = input.now ?? new Date();
  const sentToday = sentEmailCountOnDay(input.messages, lagosDateKey(now));
  if (sentToday >= input.throttle.daily_cap) return { ok: false, reason: "daily_cap" };
  const last = lastSuccessfulEmailAt(input.messages);
  if (last) {
    const elapsed = (now.getTime() - last.getTime()) / 1000;
    if (elapsed < input.throttle.gap_seconds) return { ok: false, reason: "gap" };
  }
  return { ok: true };
}

export function sentTodayFromCursor(
  cursor: { send_day: string | null; sent_today: number },
  now: Date,
): number {
  return cursor.send_day === lagosDateKey(now) ? cursor.sent_today : 0;
}

export function canSendFromCursor(input: {
  queuedLeft: number;
  lastEmailAt: string | null;
  sentToday: number;
  throttle: CampaignThrottle;
  now?: Date;
}): TickGate {
  if (input.queuedLeft <= 0) return { ok: false, reason: "none_queued" };
  const now = input.now ?? new Date();
  if (input.sentToday >= input.throttle.daily_cap) return { ok: false, reason: "daily_cap" };
  if (input.lastEmailAt) {
    const elapsed = (now.getTime() - new Date(input.lastEmailAt).getTime()) / 1000;
    if (elapsed < input.throttle.gap_seconds) return { ok: false, reason: "gap" };
  }
  return { ok: true };
}

export function remainingGapSeconds(
  lastEmailAt: string | null,
  gapSeconds: number,
  now = new Date(),
): number {
  if (!lastEmailAt) return 0;
  const elapsed = (now.getTime() - new Date(lastEmailAt).getTime()) / 1000;
  return Math.max(1, Math.ceil(gapSeconds - elapsed));
}

export function secondsUntilNextLagosMidnight(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const hours = read("hour");
  const minutes = read("minute");
  const seconds = read("second");
  const elapsed = hours * 3600 + minutes * 60 + seconds;
  return Math.max(60, 24 * 3600 - elapsed);
}
