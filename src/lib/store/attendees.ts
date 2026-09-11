import type { DocumentData } from "firebase-admin/firestore";
import { ATTENDEE_SEED_ROWS, type SeedAttendee } from "@/lib/attendees/seed-data";
import { adminDb } from "@/lib/firebase/admin";
import { memoryStore, useMemoryStore as isMemoryStore } from "@/lib/store/memory";
import {
  ATTENDANCE_STATUSES,
  type Attendee,
  type AttendeeInput,
  type AttendanceStatus,
} from "@/types/attendee";
import { isOperatorName, OPERATOR_NAMES } from "@/types/proprietor";

const COLLECTION = "event_attendees";
const SEED_ATTENDEES_BY_ID = new Map(ATTENDEE_SEED_ROWS.map((row) => [row.id, row]));

export class AttendeeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function asAttendee(id: string, data: DocumentData | undefined): Attendee | null {
  if (!data) return null;
  return {
    ...(data as Attendee),
    id: (data.id as string) || id,
  };
}

function blank(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.includes(value as AttendanceStatus);
}

function requireActor(actor: string): string {
  if (!isOperatorName(actor)) {
    throw new AttendeeError(
      `Operator name must be one of: ${OPERATOR_NAMES.join(", ")}.`,
      400,
    );
  }
  return actor;
}

function compareAttendees(a: Attendee, b: Attendee): number {
  if (a.seed_sn != null && b.seed_sn != null) return a.seed_sn - b.seed_sn;
  if (a.seed_sn != null) return -1;
  if (b.seed_sn != null) return 1;
  return a.school_name.localeCompare(b.school_name);
}

async function getAttendee(id: string): Promise<Attendee | null> {
  if (isMemoryStore()) return memoryStore().attendees[id] ?? null;
  const snap = await adminDb().collection(COLLECTION).doc(id).get();
  return asAttendee(snap.id, snap.data());
}

async function persist(attendee: Attendee): Promise<void> {
  if (isMemoryStore()) {
    memoryStore().attendees[attendee.id] = attendee;
    return;
  }
  await adminDb().collection(COLLECTION).doc(attendee.id).set(attendee);
}

export async function listAttendees(): Promise<Attendee[]> {
  if (isMemoryStore()) {
    return Object.values(memoryStore().attendees).sort(compareAttendees);
  }

  const snap = await adminDb().collection(COLLECTION).get();
  return snap.docs
    .map((doc) => asAttendee(doc.id, doc.data()))
    .filter((attendee): attendee is Attendee => Boolean(attendee))
    .sort(compareAttendees);
}

export async function listAttendeesWithSeedBaseline(): Promise<Attendee[]> {
  const combined = new Map(
    ATTENDEE_SEED_ROWS.map((row) => [row.id, attendeeFromSeed(row)]),
  );
  for (const attendee of await listAttendees()) {
    combined.set(attendee.id, attendee);
  }
  return [...combined.values()].sort(compareAttendees);
}

export async function updateAttendee(
  id: string,
  input: Partial<AttendeeInput>,
  actor: string,
): Promise<Attendee> {
  const name = requireActor(actor);
  const persisted = await getAttendee(id);
  const seed = SEED_ATTENDEES_BY_ID.get(id);
  const existing = persisted ?? (seed ? attendeeFromSeed(seed) : null);
  if (!existing) throw new AttendeeError("Attendee not found.", 404);

  const schoolName =
    typeof input.school_name === "string" ? input.school_name.trim() : input.school_name === undefined
      ? existing.school_name
      : "";
  if (!schoolName) throw new AttendeeError("School name is required.", 400);
  if (input.status !== undefined && !isAttendanceStatus(input.status)) {
    throw new AttendeeError("Attendance status is invalid.", 400);
  }

  const attendee: Attendee = {
    ...existing,
    contact_name:
      input.contact_name !== undefined ? blank(input.contact_name) : existing.contact_name,
    school_name: schoolName,
    phone: input.phone !== undefined ? blank(input.phone) : existing.phone,
    email:
      input.email !== undefined ? blank(input.email)?.toLowerCase() ?? null : existing.email,
    status: input.status ?? existing.status,
    transcription_notes:
      input.transcription_notes !== undefined
        ? blank(input.transcription_notes)
        : existing.transcription_notes,
    updated_at: new Date().toISOString(),
    updated_by: name,
  };

  await persist(attendee);
  return attendee;
}

export async function upsertSeedAttendee(
  row: SeedAttendee,
): Promise<{ attendee: Attendee; created: boolean }> {
  if (isMemoryStore()) {
    const existing = memoryStore().attendees[row.id];
    if (existing) return { attendee: existing, created: false };

    const attendee = attendeeFromSeed(row);
    memoryStore().attendees[attendee.id] = attendee;
    return { attendee, created: true };
  }

  const db = adminDb();
  const ref = db.collection(COLLECTION).doc(row.id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = asAttendee(snap.id, snap.data());
    if (existing) return { attendee: existing, created: false };

    const attendee = attendeeFromSeed(row);
    tx.create(ref, attendee);
    return { attendee, created: true };
  });
}

function attendeeFromSeed(row: SeedAttendee): Attendee {
  const schoolName = row.school_name.trim();
  if (!schoolName) throw new AttendeeError("School name is required.", 400);
  if (!isAttendanceStatus(row.status)) {
    throw new AttendeeError("Attendance status is invalid.", 400);
  }

  const now = new Date().toISOString();
  return {
    id: row.id,
    seed_sn: row.seed_sn,
    contact_name: blank(row.contact_name),
    school_name: schoolName,
    phone: blank(row.phone),
    email: blank(row.email)?.toLowerCase() ?? null,
    status: row.status,
    source_image: blank(row.source_image),
    transcription_notes: blank(row.transcription_notes),
    created_at: now,
    updated_at: now,
    updated_by: "Attendee seed",
  };
}
