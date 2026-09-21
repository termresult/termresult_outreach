import { randomUUID } from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  compareReminders,
  isReminderDueToday,
  isReminderOverdue,
  lagosDateTimeToIso,
  splitLagosDateTime,
} from "@/lib/reminders/when";
import { listAttendeesWithSeedBaseline } from "@/lib/store/attendees";
import { memoryStore, useMemoryStore } from "@/lib/store/memory";
import { listProprietors } from "@/lib/store/proprietors";
import { isOperatorName } from "@/types/proprietor";
import {
  isReminderKind,
  isReminderSchoolSource,
  reminderSchoolKey,
  type Reminder,
  type ReminderInput,
  type ReminderSchool,
  type ReminderSchoolSource,
} from "@/types/reminder";

const COLLECTION = "reminders";

export class ReminderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function requireActor(actor: string): string {
  if (!isOperatorName(actor)) {
    throw new ReminderError("Your name is required.", 400);
  }
  return actor;
}

function asReminder(id: string, data: DocumentData | undefined): Reminder | null {
  if (!data) return null;
  const row = data as Reminder;
  return {
    ...row,
    id: (data.id as string) || id,
    school_id: row.school_id ?? null,
    phone: row.phone ?? null,
    note: row.note ?? null,
    done: Boolean(row.done),
    done_at: row.done_at ?? null,
  };
}

async function persist(row: Reminder): Promise<void> {
  if (useMemoryStore()) {
    memoryStore().reminders[row.id] = row;
    return;
  }
  await adminDb().collection(COLLECTION).doc(row.id).set(row);
}

async function resolveSchool(
  input: ReminderInput,
): Promise<Pick<Reminder, "school_id" | "school_name" | "school_source" | "phone">> {
  const source = input.school_source && isReminderSchoolSource(input.school_source) ? input.school_source : null;
  const schoolId = blank(input.school_id);

  if (schoolId && (source === "proprietor" || source === "attendee")) {
    if (source === "proprietor") {
      const row = (await listProprietors()).find((item) => item.id === schoolId);
      if (!row) throw new ReminderError("School not found.", 404);
      return {
        school_id: row.id,
        school_name: row.school_name,
        school_source: "proprietor",
        phone: blank(input.phone) ?? row.phone,
      };
    }
    const row = (await listAttendeesWithSeedBaseline()).find((item) => item.id === schoolId);
    if (!row) throw new ReminderError("School not found.", 404);
    return {
      school_id: row.id,
      school_name: row.school_name,
      school_source: "attendee",
      phone: blank(input.phone) ?? row.phone,
    };
  }

  const school_name = blank(input.school_name);
  if (!school_name) throw new ReminderError("Pick a school.", 400);
  return {
    school_id: null,
    school_name,
    school_source: "custom",
    phone: blank(input.phone),
  };
}

export async function listReminders(): Promise<Reminder[]> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().reminders).sort(compareReminders);
  }
  const snap = await adminDb().collection(COLLECTION).get();
  return snap.docs
    .map((doc) => asReminder(doc.id, doc.data()))
    .filter((row): row is Reminder => Boolean(row))
    .sort(compareReminders);
}

export async function getReminder(id: string): Promise<Reminder | null> {
  if (useMemoryStore()) return memoryStore().reminders[id] ?? null;
  const snap = await adminDb().collection(COLLECTION).doc(id).get();
  return asReminder(id, snap.data());
}

export async function listReminderSchools(): Promise<ReminderSchool[]> {
  const [proprietors, attendees] = await Promise.all([listProprietors(), listAttendeesWithSeedBaseline()]);
  return [
    ...proprietors.map((row) => ({
      key: reminderSchoolKey("proprietor", row.id),
      id: row.id,
      school_name: row.school_name,
      phone: row.phone,
      source: "proprietor" as const,
    })),
    ...attendees.map((row) => ({
      key: reminderSchoolKey("attendee", row.id),
      id: row.id,
      school_name: row.school_name,
      phone: row.phone,
      source: "attendee" as const,
    })),
  ].sort((a, b) => a.school_name.localeCompare(b.school_name));
}

export async function reminderStats(now = new Date()) {
  const rows = await listReminders();
  const open = rows.filter((row) => !row.done);
  return {
    open: open.length,
    overdue: open.filter((row) => isReminderOverdue(row.due_at, now)).length,
    due_today: open.filter((row) => isReminderDueToday(row.due_at, now)).length,
  };
}

export async function createReminder(input: ReminderInput, actor: string): Promise<Reminder> {
  const name = requireActor(actor);
  let due_at: string;
  try {
    due_at = lagosDateTimeToIso(input.due_date, input.due_time);
  } catch (error) {
    throw new ReminderError(error instanceof Error ? error.message : "Pick a reminder time.", 400);
  }

  const school = await resolveSchool(input);
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: randomUUID(),
    ...school,
    kind: isReminderKind(input.kind) ? input.kind : "call",
    note: blank(input.note),
    due_at,
    done: false,
    done_at: null,
    created_at: now,
    updated_at: now,
    created_by: name,
  };
  await persist(reminder);
  return reminder;
}

export async function updateReminder(
  id: string,
  input: Partial<ReminderInput> & { done?: boolean },
  actor: string,
): Promise<Reminder> {
  const name = requireActor(actor);
  const existing = await getReminder(id);
  if (!existing) throw new ReminderError("Reminder not found.", 404);

  const now = new Date().toISOString();
  let due_at = existing.due_at;
  if (input.due_date != null || input.due_time != null) {
    const current = existing.due_at;
    let date = input.due_date;
    let time = input.due_time;
    if (!date || !time) {
      const parts = splitLagosDateTime(current);
      date = date || parts.date;
      time = time || parts.time;
    }
    try {
      due_at = lagosDateTimeToIso(date, time);
    } catch (error) {
      throw new ReminderError(error instanceof Error ? error.message : "Pick a reminder time.", 400);
    }
  }

  const next: Reminder = {
    ...existing,
    due_at,
    kind: input.kind != null && isReminderKind(input.kind) ? input.kind : existing.kind,
    note: input.note !== undefined ? blank(input.note) : existing.note,
    updated_at: now,
    created_by: existing.created_by || name,
  };

  if (input.school_name !== undefined || input.school_id !== undefined || input.school_source !== undefined) {
    Object.assign(next, await resolveSchool({
      school_id: input.school_id !== undefined ? input.school_id : existing.school_id,
      school_source: input.school_source ?? existing.school_source,
      school_name: input.school_name !== undefined ? input.school_name : existing.school_name,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      due_date: "2000-01-01",
      due_time: "00:00",
    }));
  } else if (input.phone !== undefined) {
    next.phone = blank(input.phone);
  }

  if (input.done === true && !existing.done) {
    next.done = true;
    next.done_at = now;
  }
  if (input.done === false && existing.done) {
    next.done = false;
    next.done_at = null;
  }

  await persist(next);
  return next;
}

export async function deleteReminder(id: string, actor: string): Promise<void> {
  requireActor(actor);
  const existing = await getReminder(id);
  if (!existing) throw new ReminderError("Reminder not found.", 404);
  if (useMemoryStore()) {
    delete memoryStore().reminders[id];
    return;
  }
  await adminDb().collection(COLLECTION).doc(id).delete();
}
