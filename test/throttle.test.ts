import { describe, expect, it } from "vitest";
import { canSendEmailTick, canSendFromCursor, lagosDateKey } from "@/lib/send/throttle";
import { emptyMessage } from "@/types/message";

function sentEmail(id: string, completedAt: string) {
  const row = emptyMessage(id, "camp_mail", `contact_${id}`, "email");
  row.status = "sent";
  row.completed_at = completedAt;
  row.attempted_at = completedAt;
  return row;
}

function queuedEmail(id: string) {
  return emptyMessage(id, "camp_mail", `contact_${id}`, "email");
}

describe("email throttle", () => {
  it("blocks when the daily cap is already reached", () => {
    const now = new Date("2026-08-23T12:00:00+01:00");
    const day = lagosDateKey(now);
    expect(day).toBe("2026-08-23");
    const messages = [
      sentEmail("sent_1", "2026-08-23T09:00:00.000Z"),
      queuedEmail("queued_1"),
    ];
    const gate = canSendEmailTick({
      messages,
      throttle: { gap_seconds: 180, daily_cap: 1 },
      now,
    });
    expect(gate).toEqual({ ok: false, reason: "daily_cap" });
  });

  it("blocks when the last send was 60s ago and the gap is 180s", () => {
    const now = new Date("2026-08-23T12:00:00+01:00");
    const last = new Date(now.getTime() - 60_000).toISOString();
    const gate = canSendEmailTick({
      messages: [sentEmail("sent_1", last), queuedEmail("queued_1")],
      throttle: { gap_seconds: 180, daily_cap: 400 },
      now,
    });
    expect(gate).toEqual({ ok: false, reason: "gap" });
  });

  it("gates from a cursor instead of scanning the whole queue", () => {
    const now = new Date("2026-08-23T12:00:00+01:00");
    expect(
      canSendFromCursor({
        queuedLeft: 10,
        lastEmailAt: new Date(now.getTime() - 60_000).toISOString(),
        sentToday: 4,
        throttle: { gap_seconds: 60, daily_cap: 400 },
        now,
      }),
    ).toEqual({ ok: true });
    expect(
      canSendFromCursor({
        queuedLeft: 10,
        lastEmailAt: new Date(now.getTime() - 10_000).toISOString(),
        sentToday: 4,
        throttle: { gap_seconds: 60, daily_cap: 400 },
        now,
      }),
    ).toEqual({ ok: false, reason: "gap" });
    expect(
      canSendFromCursor({
        queuedLeft: 10,
        lastEmailAt: now.toISOString(),
        sentToday: 400,
        throttle: { gap_seconds: 60, daily_cap: 400 },
        now,
      }),
    ).toEqual({ ok: false, reason: "daily_cap" });
  });

  it("allows a send when the gap and cap are clear", () => {
    const now = new Date("2026-08-23T12:00:00+01:00");
    const last = new Date(now.getTime() - 181_000).toISOString();
    const gate = canSendEmailTick({
      messages: [sentEmail("sent_1", last), queuedEmail("queued_1")],
      throttle: { gap_seconds: 180, daily_cap: 400 },
      now,
    });
    expect(gate).toEqual({ ok: true });
  });
});
