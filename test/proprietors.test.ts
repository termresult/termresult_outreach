import { afterEach, describe, expect, it } from "vitest";
import { schoolKey } from "@/lib/proprietors/school-key";
import {
  createProprietor,
  lockProprietor,
  updateProprietor,
} from "@/lib/store/proprietors";
import { resetMemoryStore, memoryStore } from "@/lib/store/memory";
import { LOCK_MS, isLockActive, withEffectiveLock, type Proprietor } from "@/types/proprietor";

function sample(over: Partial<Proprietor> = {}): Proprietor {
  return {
    id: "p1",
    school_name: "Bright Future Academy",
    school_key: "bright future academy",
    proprietor_name: "Jane",
    email: null,
    phone: null,
    notes: null,
    status: "not_yet_contacted",
    contact_person: null,
    student_count: null,
    average_fees: null,
    software: "none",
    software_other: null,
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
    updated_by: "Amina",
    talking_by: "Amina",
    talking_at: new Date().toISOString(),
    ...over,
  };
}

describe("schoolKey", () => {
  it("trims, lowercases, and collapses spaces", () => {
    expect(schoolKey("  Bright   Future  Academy ")).toBe("bright future academy");
  });
});

describe("talking lock", () => {
  it("is active inside 15 minutes", () => {
    const row = sample({ talking_at: new Date(Date.now() - 60_000).toISOString() });
    expect(isLockActive(row)).toBe(true);
    expect(withEffectiveLock(row).talking_by).toBe("Amina");
  });

  it("expires after 15 minutes", () => {
    const row = sample({
      talking_at: new Date(Date.now() - LOCK_MS - 1_000).toISOString(),
    });
    expect(isLockActive(row)).toBe(false);
    expect(withEffectiveLock(row).talking_by).toBeNull();
    expect(withEffectiveLock(row).talking_at).toBeNull();
  });
});

describe("proprietor store", () => {
  afterEach(() => {
    resetMemoryStore();
  });

  it("creates one row and treats the same school name as a duplicate", async () => {
    const first = await createProprietor({ school_name: "  Bright Future Academy " }, "Amina");
    expect(first.created).toBe(true);
    expect(first.proprietor.school_key).toBe("bright future academy");

    const second = await createProprietor({ school_name: "bright   future academy" }, "Chidi");
    expect(second.created).toBe(false);
    expect(second.proprietor.id).toBe(first.proprietor.id);
    expect(Object.keys(memoryStore().proprietors)).toHaveLength(1);
  });

  it("requires a school name and an operator name", async () => {
    await expect(createProprietor({ school_name: "   " }, "Amina")).rejects.toThrow("School name");
    await expect(createProprietor({ school_name: "LEA Garki" }, "  ")).rejects.toThrow("Your name");
  });

  it("sets a talking lock and clears it on save", async () => {
    const created = await createProprietor({ school_name: "LEA Garki" }, "Amina");
    const locked = await lockProprietor(created.proprietor.id, "Amina");
    expect(locked.status).toBe("in_conversation");
    expect(locked.talking_by).toBe("Amina");
    expect(locked.talking_at).toBeTruthy();

    const saved = await updateProprietor(
      created.proprietor.id,
      { status: "email_sent", student_count: 200, average_fees: 85000, software: "b4" },
      "Amina",
    );
    expect(saved.status).toBe("email_sent");
    expect(saved.talking_by).toBeNull();
    expect(saved.talking_at).toBeNull();
    expect(saved.student_count).toBe(200);
    expect(saved.average_fees).toBe(85000);
    expect(saved.software).toBe("b4");
  });

  it("does not steal an active lock from someone else", async () => {
    const created = await createProprietor({ school_name: "LEA Wuse" }, "Amina");
    await lockProprietor(created.proprietor.id, "Amina");
    const again = await lockProprietor(created.proprietor.id, "Chidi");
    expect(again.talking_by).toBe("Amina");
  });
});
