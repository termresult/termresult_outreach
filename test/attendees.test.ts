import { describe, expect, it } from "vitest";
import { filterAttendees, parseAttendeeQuery } from "@/lib/attendees/query";
import { ATTENDEE_SEED_ROWS } from "@/lib/attendees/seed-data";
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

describe("ATTENDEE_SEED_ROWS", () => {
  it("has stable unique IDs and non-empty school names", () => {
    const ids = ATTENDEE_SEED_ROWS.map((row) => row.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ATTENDEE_SEED_ROWS.every((row) => row.school_name.trim().length > 0)).toBe(true);
  });

  it("names a source image and contains both attendance statuses", () => {
    expect(ATTENDEE_SEED_ROWS.every((row) => /^IMG_677\d\.HEIC$|^IMG_6769\.HEIC$/.test(row.source_image))).toBe(true);
    expect(new Set(ATTENDEE_SEED_ROWS.map((row) => row.status))).toEqual(
      new Set(["attended", "did_not_attend"]),
    );
  });

  it("marks every fully handwritten source record attended", () => {
    const handwritten = ATTENDEE_SEED_ROWS.filter((row) => row.source_kind === "handwritten");

    expect(handwritten.length).toBeGreaterThan(0);
    expect(handwritten.every((row) => row.status === "attended")).toBe(true);
  });

  it("represents every printed serial exactly once", () => {
    const serials = ATTENDEE_SEED_ROWS
      .filter((row) => row.source_kind === "printed")
      .map((row) => row.seed_sn);

    expect(serials).toEqual(Array.from({ length: 104 }, (_, index) => index + 1));
  });

  it("preserves the reviewed row and attendance totals", () => {
    expect(ATTENDEE_SEED_ROWS).toHaveLength(118);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.status === "attended")).toHaveLength(61);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.status === "did_not_attend")).toHaveLength(57);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.source_kind === "handwritten")).toHaveLength(14);
  });
});
