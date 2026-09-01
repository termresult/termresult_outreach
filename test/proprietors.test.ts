import { afterEach, describe, expect, it } from "vitest";
import { schoolKey } from "@/lib/proprietors/school-key";
import { REGISTRATION_ROWS } from "@/lib/proprietors/registration-list";
import {
  clearUnsavedTalkState,
  createProprietor,
  getProprietor,
  lockProprietor,
  updateProprietor,
} from "@/lib/store/proprietors";
import { resetMemoryStore, memoryStore } from "@/lib/store/memory";
import { todayInLagos } from "@/lib/proprietors/install-date";
import { LOCK_MS, isLockActive, withEffectiveLock, type Proprietor } from "@/types/proprietor";

function dayFromToday(offset: number): string {
  const [year, month, day] = todayInLagos().split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + offset));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

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
    seed_sn: null,
    install_date: null,
    install_booked_by: null,
    ...over,
  };
}

describe("registration seed", () => {
  it("has all 104 registration lines", () => {
    expect(REGISTRATION_ROWS).toHaveLength(104);
    expect(REGISTRATION_ROWS.map((row) => row.sn)).toEqual(
      Array.from({ length: 104 }, (_, i) => i + 1),
    );
    expect(REGISTRATION_ROWS.filter((row) => schoolKey(row.school_name) === "dafcom private school")).toHaveLength(3);
  });
});

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

  it("does not assign a contact person on create", async () => {
    const first = await createProprietor({ school_name: "Seeded Academy", contact_person: null }, "Registration list");
    expect(first.proprietor.contact_person).toBeNull();
    expect(first.proprietor.status).toBe("not_yet_contacted");
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

  it("clears click-only talk state when nobody has been saved as contact person", async () => {
    const created = await createProprietor({ school_name: "LEA Wuse II" }, "Registration list");
    await lockProprietor(created.proprietor.id, "Possible");
    const cleared = await clearUnsavedTalkState();
    expect(cleared).toBe(1);
    const row = await getProprietor(created.proprietor.id);
    expect(row?.contact_person).toBeNull();
    expect(row?.status).toBe("not_yet_contacted");
    expect(row?.talking_by).toBeNull();
  });

  it("does not steal an active lock from someone else", async () => {
    const created = await createProprietor({ school_name: "LEA Wuse" }, "Amina");
    await lockProprietor(created.proprietor.id, "Amina");
    const again = await lockProprietor(created.proprietor.id, "Chidi");
    expect(again.talking_by).toBe("Amina");
  });
});

describe("install slots", () => {
  afterEach(() => {
    resetMemoryStore();
  });

  it("lets the first school claim a day", async () => {
    const first = await createProprietor({ school_name: "Gracious Grace School" }, "Possible");
    const booked = await updateProprietor(first.proprietor.id, { install_date: dayFromToday(1) }, "Possible");
    expect(booked.install_date).toBe(dayFromToday(1));
    expect(booked.install_booked_by).toBe("Possible");
    expect(memoryStore().install_slots[dayFromToday(1)]?.proprietor_id).toBe(first.proprietor.id);
  });

  it("rejects a second school on the same day", async () => {
    const first = await createProprietor({ school_name: "Gracious Grace School" }, "Possible");
    const second = await createProprietor({ school_name: "Adorable Stars Model Academy" }, "Abdul");
    await updateProprietor(first.proprietor.id, { install_date: dayFromToday(2) }, "Possible");
    await expect(
      updateProprietor(second.proprietor.id, { install_date: dayFromToday(2) }, "Abdul"),
    ).rejects.toThrow("Possible already booked Gracious Grace School");
  });

  it("lets the same school keep its own day", async () => {
    const first = await createProprietor({ school_name: "Armorsville Academy" }, "Iyanu");
    await updateProprietor(first.proprietor.id, { install_date: dayFromToday(3) }, "Iyanu");
    const again = await updateProprietor(
      first.proprietor.id,
      { install_date: dayFromToday(3), notes: "Confirmed" },
      "Pelumi",
    );
    expect(again.install_date).toBe(dayFromToday(3));
    expect(again.install_booked_by).toBe("Iyanu");
    expect(again.notes).toBe("Confirmed");
  });

  it("frees the old day when a school reschedules", async () => {
    const first = await createProprietor({ school_name: "Bankys Private School" }, "Possible");
    const second = await createProprietor({ school_name: "AngelWings Comprehensive College" }, "Abdul");
    await updateProprietor(first.proprietor.id, { install_date: dayFromToday(4) }, "Possible");
    await updateProprietor(first.proprietor.id, { install_date: dayFromToday(5) }, "Possible");
    const moved = await updateProprietor(second.proprietor.id, { install_date: dayFromToday(4) }, "Abdul");
    expect(moved.install_date).toBe(dayFromToday(4));
    expect(memoryStore().install_slots[dayFromToday(5)]?.proprietor_id).toBe(first.proprietor.id);
  });

  it("frees the day when the date is cleared", async () => {
    const first = await createProprietor({ school_name: "Holy Hill School" }, "Pelumi");
    const second = await createProprietor({ school_name: "Joymon academy" }, "Iyanu");
    await updateProprietor(first.proprietor.id, { install_date: dayFromToday(6) }, "Pelumi");
    await updateProprietor(first.proprietor.id, { install_date: null }, "Pelumi");
    const claimed = await updateProprietor(second.proprietor.id, { install_date: dayFromToday(6) }, "Iyanu");
    expect(claimed.install_booked_by).toBe("Iyanu");
  });

  it("rejects booking a past day", async () => {
    const first = await createProprietor({ school_name: "Tots Academy Abuja" }, "Abdul");
    await expect(
      updateProprietor(first.proprietor.id, { install_date: dayFromToday(-1) }, "Abdul"),
    ).rejects.toThrow("already passed");
  });
});
