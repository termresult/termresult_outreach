import { describe, expect, it } from "vitest";
import { filterAttendees, parseAttendeeQuery } from "@/lib/attendees/query";
import type { Attendee } from "@/types/attendee";

function sample(over: Partial<Attendee> = {}): Attendee {
  return {
    id: "att-1",
    seed_sn: 1,
    contact_name: "Jane Okoro",
    school_name: "Bright Future Academy",
    phone: "08031234567",
    email: "jane@brightfuture.edu.ng",
    status: "attended",
    source_image: "IMG_6769.HEIC",
    transcription_notes: null,
    created_at: "2026-09-11T00:00:00.000Z",
    updated_at: "2026-09-11T00:00:00.000Z",
    updated_by: "Iyanu",
    ...over,
  };
}

const rows: Attendee[] = [
  sample(),
  sample({
    id: "att-2",
    seed_sn: 2,
    contact_name: "Chidi Nwosu",
    school_name: "Green Valley School",
    phone: "07089998877",
    email: "chidi@greenvalley.ng",
    status: "did_not_attend",
  }),
  sample({
    id: "att-3",
    seed_sn: 3,
    contact_name: null,
    school_name: "Hilltop Primary",
    phone: null,
    email: null,
    status: "attended",
  }),
];

describe("parseAttendeeQuery", () => {
  it("parses q and supported status values", () => {
    const params = new URLSearchParams("q=bright&status=attended");
    expect(parseAttendeeQuery(params)).toEqual({ q: "bright", status: "attended" });
  });

  it("treats unsupported status values as all records", () => {
    const params = new URLSearchParams("status=maybe");
    expect(parseAttendeeQuery(params)).toEqual({ q: "", status: "" });
  });
});

describe("filterAttendees", () => {
  it("matches free-text search against school, contact, phone, and email", () => {
    expect(filterAttendees(rows, { q: "green valley" })).toHaveLength(1);
    expect(filterAttendees(rows, { q: "chidi" })).toHaveLength(1);
    expect(filterAttendees(rows, { q: "07089998877" })).toHaveLength(1);
    expect(filterAttendees(rows, { q: "chidi@greenvalley.ng" })).toHaveLength(1);
    expect(filterAttendees(rows, { q: "BRIGHT" })).toHaveLength(1);
  });

  it("returns only rows with the selected attendance status", () => {
    const attended = filterAttendees(rows, { status: "attended" });
    expect(attended).toHaveLength(2);
    expect(attended.every((row) => row.status === "attended")).toBe(true);

    const missed = filterAttendees(rows, { status: "did_not_attend" });
    expect(missed).toHaveLength(1);
    expect(missed[0]?.school_name).toBe("Green Valley School");
  });

  it("returns all rows when status is empty or unsupported", () => {
    expect(filterAttendees(rows, { status: "" })).toHaveLength(3);
    expect(filterAttendees(rows, {})).toHaveLength(3);
  });
});
