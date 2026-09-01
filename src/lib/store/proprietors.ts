import { randomUUID } from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  asInstallDate,
  isPastInstallDate,
  slotTakenMessage,
  todayInLagos,
  type InstallSlot,
} from "@/lib/proprietors/install-date";
import { schoolKey } from "@/lib/proprietors/school-key";
import { memoryStore, useMemoryStore } from "@/lib/store/memory";
import {
  isFollowUpStatus,
  isLockActive,
  isSchoolSoftware,
  withEffectiveLock,
  type FollowUpStatus,
  type Proprietor,
  type ProprietorInput,
  type SchoolSoftware,
} from "@/types/proprietor";

export class ProprietorError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function asProprietor(id: string, data: DocumentData | undefined): Proprietor | null {
  if (!data) return null;
  return withEffectiveLock({
    ...(data as Proprietor),
    id: (data.id as string) || id,
    install_date: (data.install_date as string | null | undefined) ?? null,
    install_booked_by: (data.install_booked_by as string | null | undefined) ?? null,
  });
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function asCount(value: number | null | undefined): number | null {
  if (value == null || value === ("" as never)) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function applyInput(base: Proprietor, input: Partial<ProprietorInput>): Proprietor {
  const school_name = input.school_name != null ? input.school_name.trim() : base.school_name;
  const software: SchoolSoftware =
    input.software != null && isSchoolSoftware(input.software) ? input.software : base.software;
  const status: FollowUpStatus =
    input.status != null && isFollowUpStatus(input.status) ? input.status : base.status;

  return {
    ...base,
    school_name,
    school_key: schoolKey(school_name),
    proprietor_name: input.proprietor_name !== undefined ? blank(input.proprietor_name) : base.proprietor_name,
    email: input.email !== undefined ? blank(input.email)?.toLowerCase() ?? null : base.email,
    phone: input.phone !== undefined ? blank(input.phone) : base.phone,
    notes: input.notes !== undefined ? blank(input.notes) : base.notes,
    status,
    contact_person: input.contact_person !== undefined ? blank(input.contact_person) : base.contact_person,
    student_count: input.student_count !== undefined ? asCount(input.student_count) : base.student_count,
    average_fees: input.average_fees !== undefined ? asCount(input.average_fees) : base.average_fees,
    software,
    software_other: software === "other"
      ? input.software_other !== undefined
        ? blank(input.software_other)
        : base.software_other
      : null,
    install_date: input.install_date !== undefined ? parseInstallDate(input.install_date) : base.install_date,
  };
}

function parseInstallDate(value: string | null | undefined): string | null {
  try {
    return asInstallDate(value);
  } catch {
    throw new ProprietorError("Install date must be a calendar day.", 400);
  }
}

function requireActor(actor: string): string {
  const name = actor.trim();
  if (!name) throw new ProprietorError("Your name is required.", 400);
  return name;
}

async function persist(row: Proprietor): Promise<void> {
  if (useMemoryStore()) {
    memoryStore().proprietors[row.id] = row;
    return;
  }
  await adminDb().collection("proprietors").doc(row.id).set(row);
}

function emptyInstallFields() {
  return {
    install_date: null as string | null,
    install_booked_by: null as string | null,
  };
}

function asSlot(data: DocumentData | undefined): InstallSlot | null {
  if (!data?.date || !data.proprietor_id) return null;
  return {
    date: String(data.date),
    proprietor_id: String(data.proprietor_id),
    school_name: String(data.school_name ?? ""),
    booked_by: String(data.booked_by ?? ""),
    booked_at: String(data.booked_at ?? ""),
  };
}

function rememberSlot(slot: InstallSlot | null, previousDate: string | null, nextDate: string | null) {
  const slots = memoryStore().install_slots;
  if (previousDate && previousDate !== nextDate) delete slots[previousDate];
  if (nextDate && slot) slots[nextDate] = slot;
  if (!nextDate && previousDate) delete slots[previousDate];
}

async function writeWithInstallSlot(
  previous: Proprietor | null,
  row: Proprietor,
  actor: string,
  now: string,
): Promise<Proprietor> {
  const previousDate = previous?.install_date ?? null;
  const nextDate = row.install_date;
  if (nextDate && nextDate !== previousDate && isPastInstallDate(nextDate)) {
    throw new ProprietorError("That day has already passed.", 400);
  }

  if (nextDate === previousDate) {
    const next = {
      ...row,
      install_booked_by: nextDate ? previous?.install_booked_by ?? actor : null,
    };
    await persist(next);
    return next;
  }

  const slot: InstallSlot | null = nextDate
    ? {
        date: nextDate,
        proprietor_id: row.id,
        school_name: row.school_name,
        booked_by: actor,
        booked_at: now,
      }
    : null;

  if (useMemoryStore()) {
    if (nextDate) {
      const taken = memoryStore().install_slots[nextDate];
      if (taken && taken.proprietor_id !== row.id) {
        throw new ProprietorError(slotTakenMessage(taken), 409);
      }
    }
    rememberSlot(slot, previousDate, nextDate);
    const next = { ...row, install_booked_by: slot?.booked_by ?? null };
    await persist(next);
    return next;
  }

  const db = adminDb();
  const proprietorRef = db.collection("proprietors").doc(row.id);
  const nextRef = nextDate ? db.collection("install_slots").doc(nextDate) : null;
  const previousRef = previousDate && previousDate !== nextDate
    ? db.collection("install_slots").doc(previousDate)
    : null;

  await db.runTransaction(async (tx) => {
    const takenSnap = nextRef ? await tx.get(nextRef) : null;
    const taken = takenSnap ? asSlot(takenSnap.data()) : null;
    if (taken && taken.proprietor_id !== row.id) {
      throw new ProprietorError(slotTakenMessage(taken), 409);
    }
    if (previousRef) tx.delete(previousRef);
    if (nextRef && slot && !taken) tx.set(nextRef, slot);
    tx.set(proprietorRef, { ...row, install_booked_by: slot?.booked_by ?? null });
  });

  return { ...row, install_booked_by: slot?.booked_by ?? null };
}

export async function listProprietors(): Promise<Proprietor[]> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().proprietors)
      .map((row) => withEffectiveLock(row))
      .sort((a, b) => a.school_name.localeCompare(b.school_name));
  }
  const snap = await adminDb().collection("proprietors").get();
  return snap.docs
    .map((doc) => asProprietor(doc.id, doc.data()))
    .filter((row): row is Proprietor => Boolean(row))
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
}

export async function getProprietor(id: string): Promise<Proprietor | null> {
  if (useMemoryStore()) {
    const row = memoryStore().proprietors[id];
    return row ? withEffectiveLock(row) : null;
  }
  const snap = await adminDb().collection("proprietors").doc(id).get();
  return asProprietor(id, snap.data());
}

export async function getProprietorBySchoolKey(key: string): Promise<Proprietor | null> {
  const normalized = schoolKey(key);
  if (!normalized) return null;
  if (useMemoryStore()) {
    const row = Object.values(memoryStore().proprietors).find((item) => item.school_key === normalized);
    return row ? withEffectiveLock(row) : null;
  }
  const snap = await adminDb().collection("proprietors").where("school_key", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  return asProprietor(snap.docs[0].id, snap.docs[0].data());
}

export async function proprietorStats() {
  const rows = await listProprietors();
  const today = todayInLagos();
  return {
    schools: rows.length,
    already_talked: rows.filter((row) => row.status !== "not_yet_contacted").length,
    upcoming_installs: rows.filter((row) => row.install_date && row.install_date >= today).length,
  };
}

export async function createProprietor(
  input: ProprietorInput,
  actor: string,
): Promise<{ proprietor: Proprietor; created: boolean }> {
  const name = requireActor(actor);
  const school_name = input.school_name?.trim() ?? "";
  if (!school_name) throw new ProprietorError("School name is required.", 400);

  const existing = await getProprietorBySchoolKey(school_name);
  if (existing) return { proprietor: existing, created: false };

  const now = new Date().toISOString();
  const id = randomUUID();
  const proprietor = applyInput(
    {
      id,
      school_name,
      school_key: schoolKey(school_name),
      proprietor_name: null,
      email: null,
      phone: null,
      notes: null,
      status: "not_yet_contacted",
      contact_person: null,
      student_count: null,
      average_fees: null,
      software: "none",
      software_other: null,
      created_at: now,
      updated_at: now,
      updated_by: name,
      talking_by: null,
      talking_at: null,
      seed_sn: null,
      ...emptyInstallFields(),
    },
    { ...input, school_name },
  );

  const saved = await writeWithInstallSlot(null, proprietor, name, now);
  return { proprietor: saved, created: true };
}

export async function updateProprietor(
  id: string,
  input: Partial<ProprietorInput>,
  actor: string,
): Promise<Proprietor> {
  const name = requireActor(actor);
  const existing = await getProprietor(id);
  if (!existing) throw new ProprietorError("School not found.", 404);

  if (input.school_name != null) {
    const nextKey = schoolKey(input.school_name);
    if (!nextKey) throw new ProprietorError("School name is required.", 400);
    const clash = await getProprietorBySchoolKey(nextKey);
    if (clash && clash.id !== id) {
      throw new ProprietorError("That school is already on the list.", 409);
    }
  }

  const now = new Date().toISOString();
  const next = applyInput(existing, input);
  const proprietor: Proprietor = {
    ...next,
    contact_person: existing.contact_person ?? next.contact_person ?? name,
    updated_at: now,
    updated_by: name,
    talking_by: null,
    talking_at: null,
  };

  return writeWithInstallSlot(existing, proprietor, name, now);
}

export async function lockProprietor(id: string, actor: string): Promise<Proprietor> {
  const name = requireActor(actor);
  const existing = await getProprietor(id);
  if (!existing) throw new ProprietorError("School not found.", 404);
  if (isLockActive(existing) && existing.talking_by && existing.talking_by !== name) {
    return existing;
  }

  const now = new Date().toISOString();
  const proprietor: Proprietor = {
    ...existing,
    status: existing.status === "not_yet_contacted" ? "in_conversation" : existing.status,
    talking_by: name,
    talking_at: now,
    updated_at: now,
    updated_by: name,
  };

  await persist(proprietor);
  return proprietor;
}

export async function upsertSeededProprietor(
  sn: number,
  input: ProprietorInput,
): Promise<{ proprietor: Proprietor; created: boolean }> {
  const id = `reg-${sn}`;
  const existing = await getProprietor(id);
  if (existing?.contact_person || existing?.install_date || (existing && existing.status !== "not_yet_contacted")) {
    return { proprietor: existing, created: false };
  }

  const now = new Date().toISOString();
  const school_name = input.school_name.trim();
  const base: Proprietor = existing ?? {
    id,
    school_name,
    school_key: schoolKey(school_name),
    proprietor_name: null,
    email: null,
    phone: null,
    notes: null,
    status: "not_yet_contacted",
    contact_person: null,
    student_count: null,
    average_fees: null,
    software: "none",
    software_other: null,
    created_at: now,
    updated_at: now,
    updated_by: "Registration list",
    talking_by: null,
    talking_at: null,
    seed_sn: sn,
    ...emptyInstallFields(),
  };

  const proprietor = applyInput(
    { ...base, seed_sn: sn, contact_person: existing?.contact_person ?? null },
    { ...input, school_name, contact_person: existing?.contact_person ?? null },
  );
  await persist({ ...proprietor, seed_sn: sn, contact_person: null, status: existing?.status ?? "not_yet_contacted" });
  return { proprietor: { ...proprietor, seed_sn: sn, contact_person: null }, created: !existing };
}

export async function deleteCollapsedRegistrationRows(): Promise<number> {
  const rows = await listProprietors();
  let removed = 0;
  for (const row of rows) {
    if (row.id.startsWith("reg-")) continue;
    if (row.updated_by !== "Registration list") continue;
    if (row.contact_person || row.status !== "not_yet_contacted") continue;
    if (useMemoryStore()) {
      delete memoryStore().proprietors[row.id];
    } else {
      await adminDb().collection("proprietors").doc(row.id).delete();
    }
    removed += 1;
  }
  return removed;
}

export async function clearUnsavedTalkState(): Promise<number> {
  const rows = await listProprietors();
  let cleared = 0;
  for (const row of rows) {
    if (row.contact_person) continue;
    const dirty = Boolean(row.talking_by || row.talking_at || row.status === "in_conversation");
    if (!dirty) continue;
    await persist({
      ...row,
      status: row.status === "in_conversation" ? "not_yet_contacted" : row.status,
      talking_by: null,
      talking_at: null,
    });
    cleared += 1;
  }
  return cleared;
}
