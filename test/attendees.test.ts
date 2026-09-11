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
  const expectedHandwrittenIds = [
    "handwritten-creme-quintessence",
    "handwritten-foundation-of-success",
    "handwritten-lofty-height",
    "handwritten-excellent-mindset",
    "handwritten-terrigem-royal",
    "handwritten-winners-joy",
    "handwritten-chessy-kidies",
    "handwritten-first-choice-model",
    "handwritten-victory-of-god",
    "handwritten-advanced-proficiency",
    "handwritten-triple-divine",
    "handwritten-catering-model",
    "handwritten-noble-kiddies",
    "handwritten-aggs-apo",
    "handwritten-purple-lilly",
    "handwritten-jeika-premier",
    "handwritten-meganiel-academy",
  ];

  it("has stable unique IDs and non-empty school names", () => {
    const ids = ATTENDEE_SEED_ROWS.map((row) => row.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ATTENDEE_SEED_ROWS.every((row) => row.school_name.trim().length > 0)).toBe(true);
  });

  it("uses exactly the supported source images and contains both attendance statuses", () => {
    expect(new Set(ATTENDEE_SEED_ROWS.map((row) => row.source_image))).toEqual(
      new Set([
        "IMG_6769.HEIC",
        "IMG_6770.HEIC",
        "IMG_6771.HEIC",
        "IMG_6772.HEIC",
        "IMG_6773.HEIC",
        "IMG_6774.HEIC",
      ]),
    );
    expect(new Set(ATTENDEE_SEED_ROWS.map((row) => row.status))).toEqual(
      new Set(["attended", "did_not_attend"]),
    );
  });

  it("has the exact reviewed handwritten IDs and marks all attended", () => {
    const handwritten = ATTENDEE_SEED_ROWS.filter((row) => row.source_kind === "handwritten");

    expect(handwritten.map((row) => row.id).sort()).toEqual([...expectedHandwrittenIds].sort());
    expect(handwritten.every((row) => row.status === "attended")).toBe(true);
  });

  it("represents every printed serial exactly once", () => {
    const serials = ATTENDEE_SEED_ROWS
      .filter((row) => row.source_kind === "printed")
      .map((row) => row.seed_sn);

    expect(serials).toEqual(Array.from({ length: 104 }, (_, index) => index + 1));
  });

  it("preserves the reviewed row and attendance totals", () => {
    expect(ATTENDEE_SEED_ROWS).toHaveLength(121);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.status === "attended")).toHaveLength(64);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.status === "did_not_attend")).toHaveLength(57);
    expect(ATTENDEE_SEED_ROWS.filter((row) => row.source_kind === "handwritten")).toHaveLength(17);
  });

  it("locks key printed attendance decisions", () => {
    const printedBySerial = new Map(
      ATTENDEE_SEED_ROWS
        .filter((row) => row.source_kind === "printed")
        .map((row) => [row.seed_sn, row]),
    );

    for (const serial of [1, 6, 21, 68, 72, 99, 104]) {
      expect(printedBySerial.get(serial)?.status, `serial ${serial}`).toBe("attended");
    }
    for (const serial of [2, 16, 40, 71, 101]) {
      expect(printedBySerial.get(serial)?.status, `serial ${serial}`).toBe("did_not_attend");
    }
  });

  it("preserves the IMG_6773 extension rows without fake contact values", () => {
    const extensionRows = ATTENDEE_SEED_ROWS.filter(
      (row) => row.source_image === "IMG_6773.HEIC",
    );

    expect(extensionRows).toMatchObject([
      {
        id: "handwritten-catering-model",
        contact_name: "Akiri Joy A.",
        school_name: "Catering Model Academy",
        phone: null,
        email: null,
        status: "attended",
      },
      {
        id: "handwritten-noble-kiddies",
        contact_name: "Ijeoma Kalu",
        school_name: "Noble Kiddies Academy",
        phone: "+2348034783207",
        email: null,
        status: "attended",
      },
      {
        id: "handwritten-aggs-apo",
        contact_name: "Emagborom Magdalene Msember",
        school_name: "AGGS, Apo",
        phone: null,
        email: null,
        status: "attended",
      },
    ]);

    expect(
      ATTENDEE_SEED_ROWS.every(
        (row) =>
          !row.phone?.includes("…") &&
          !row.email?.includes("…") &&
          !row.phone?.includes("[") &&
          !row.email?.includes("["),
      ),
    ).toBe(true);
  });
});
