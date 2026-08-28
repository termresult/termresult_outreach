import { randomUUID } from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
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
  return withEffectiveLock({ ...(data as Proprietor), id: (data.id as string) || id });
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
  };
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
  return {
    schools: rows.length,
    already_talked: rows.filter((row) => row.status !== "not_yet_contacted").length,
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
    },
    { ...input, school_name },
  );

  await persist(proprietor);
  return { proprietor, created: true };
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
    updated_at: now,
    updated_by: name,
    talking_by: null,
    talking_at: null,
  };

  await persist(proprietor);
  return proprietor;
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
