import { afterEach, describe, expect, it } from "vitest";
import { createProprietor } from "@/lib/store/proprietors";
import {
  createReminder,
  deleteReminder,
  listReminders,
  reminderStats,
  updateReminder,
} from "@/lib/store/reminders";
import { resetMemoryStore } from "@/lib/store/memory";
import { isReminderOverdue, lagosDateTimeToIso } from "@/lib/reminders/when";

describe("reminders", () => {
  afterEach(() => {
    resetMemoryStore();
  });

  it("creates a call-back reminder for a picked school and time", async () => {
    const school = await createProprietor({ school_name: "LEA Garki" }, "Iyanu");
    const reminder = await createReminder(
      {
        school_id: school.proprietor.id,
        school_source: "proprietor",
        kind: "call",
        note: "Call proprietor about fees",
        due_date: "2026-09-22",
        due_time: "15:30",
      },
      "Iyanu",
    );

    expect(reminder.school_name).toBe("LEA Garki");
    expect(reminder.kind).toBe("call");
    expect(reminder.due_at).toBe("2026-09-22T15:30:00+01:00");
    expect(reminder.done).toBe(false);
    expect(reminder.created_by).toBe("Iyanu");
  });

  it("lets you remind yourself to do anything for a typed school", async () => {
    const reminder = await createReminder(
      {
        school_name: "Custom Academy",
        kind: "other",
        note: "Send the brochure",
        due_date: "2026-09-23",
        due_time: "09:00",
      },
      "Possible",
    );
    expect(reminder.school_source).toBe("custom");
    expect(reminder.school_id).toBeNull();
    expect(reminder.kind).toBe("other");
  });

  it("requires a school, a time, and an operator", async () => {
    await expect(
      createReminder({ due_date: "2026-09-22", due_time: "10:00" }, "Iyanu"),
    ).rejects.toThrow("Pick a school");
    await expect(
      createReminder({ school_name: "LEA Wuse", due_date: "nope", due_time: "10:00" }, "Iyanu"),
    ).rejects.toThrow("Pick a reminder date");
    await expect(
      createReminder({ school_name: "LEA Wuse", due_date: "2026-09-22", due_time: "10:00" }, "  "),
    ).rejects.toThrow("Your name");
  });

  it("marks a reminder done and counts open and overdue", async () => {
    await createReminder(
      { school_name: "Overdue School", due_date: "2020-01-01", due_time: "08:00" },
      "Abdul",
    );
    const later = await createReminder(
      { school_name: "Later School", due_date: "2030-01-01", due_time: "08:00" },
      "Abdul",
    );
    await updateReminder(later.id, { done: true }, "Abdul");

    const rows = await listReminders();
    expect(rows[0].school_name).toBe("Overdue School");
    expect(rows[1].done).toBe(true);

    const stats = await reminderStats(new Date("2026-09-21T12:00:00+01:00"));
    expect(stats.open).toBe(1);
    expect(stats.overdue).toBe(1);
  });

  it("edits reminder fields one at a time", async () => {
    const reminder = await createReminder(
      {
        school_name: "Old Academy",
        kind: "call",
        note: "First note",
        due_date: "2026-09-22",
        due_time: "10:00",
      },
      "Iyanu",
    );

    const kind = await updateReminder(reminder.id, { kind: "other" }, "Iyanu");
    expect(kind.kind).toBe("other");
    expect(kind.school_name).toBe("Old Academy");
    expect(kind.due_at).toBe("2026-09-22T10:00:00+01:00");

    const when = await updateReminder(reminder.id, { due_time: "16:45" }, "Iyanu");
    expect(when.due_at).toBe("2026-09-22T16:45:00+01:00");
    expect(when.kind).toBe("other");

    const note = await updateReminder(reminder.id, { note: "Send the quote" }, "Iyanu");
    expect(note.note).toBe("Send the quote");
    expect(note.due_at).toBe("2026-09-22T16:45:00+01:00");

    const school = await updateReminder(
      reminder.id,
      { school_id: null, school_source: "custom", school_name: "New Academy" },
      "Iyanu",
    );
    expect(school.school_name).toBe("New Academy");
    expect(school.note).toBe("Send the quote");
  });

  it("deletes a reminder", async () => {
    const reminder = await createReminder(
      { school_name: "Temp School", due_date: "2026-09-22", due_time: "11:00" },
      "Pelumi",
    );
    await deleteReminder(reminder.id, "Pelumi");
    expect(await listReminders()).toHaveLength(0);
  });
});

describe("reminder time", () => {
  it("stores Lagos wall time as WAT", () => {
    expect(lagosDateTimeToIso("2026-09-22", "15:30")).toBe("2026-09-22T15:30:00+01:00");
    expect(isReminderOverdue("2020-01-01T08:00:00+01:00", new Date("2026-09-21T12:00:00+01:00"))).toBe(true);
  });
});
