import { afterEach, describe, expect, it } from "vitest";
import { emptyContact } from "@/types/contact";
import { contactStats, getContact, listContacts, upsertContacts } from "@/lib/store/contacts";
import { resetMemoryStore } from "@/lib/store/memory";

describe("memory store (vitest)", () => {
  afterEach(() => {
    resetMemoryStore();
  });

  it("upserts a school and reads it back without Firestore", async () => {
    const contact = emptyContact("emis:lea-store");
    contact.name = "LEA Store Test";
    contact.email = "office@leastore.sch.ng";
    contact.source_place_id = "emis:lea-store";
    const summary = await upsertContacts([contact]);
    expect(summary.created).toBe(1);
    expect(summary.total).toBe(1);
    const loaded = await getContact("emis:lea-store");
    expect(loaded?.name).toBe("LEA Store Test");
    const listed = await listContacts();
    expect(listed).toHaveLength(1);
    const stats = await contactStats();
    expect(stats.with_email).toBe(1);
  });
});
