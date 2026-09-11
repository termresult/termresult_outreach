import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionUser } from "@/lib/auth/session";
import { ATTENDEE_SEED_ROWS } from "@/lib/attendees/seed-data";
import { resetMemoryStore } from "@/lib/store/memory";
import { updateAttendee, upsertSeedAttendee } from "@/lib/store/attendees";
import { GET } from "@/app/api/attendees/route";
import { PATCH } from "@/app/api/attendees/[id]/route";

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

const sessionUser = {
  email: "operator@example.com",
  uid: "operator-1",
};

function request(body: BodyInit): Request {
  return new Request("http://localhost/api/attendees/printed-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });
}

function context(id = "printed-1") {
  return { params: Promise.resolve({ id }) };
}

async function expectJsonError(response: Response, status: number, error: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toContain("application/json");
  await expect(response.json()).resolves.toEqual({ error });
}

describe("GET /api/attendees", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser);
  });

  afterEach(() => {
    resetMemoryStore();
    vi.clearAllMocks();
  });

  it("returns the complete seed baseline for an authenticated fresh install", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.attendees).toHaveLength(121);
    expect(payload.attendees.map((row: { id: string }) => row.id)).toEqual(
      expect.arrayContaining(ATTENDEE_SEED_ROWS.map((row) => row.id)),
    );
  });

  it("overlays persisted edits without dropping unpersisted baseline attendees", async () => {
    const baseline = ATTENDEE_SEED_ROWS[0];
    await updateAttendee(
      baseline.id,
      { school_name: "API Corrected School", status: "did_not_attend" },
      "Iyanu",
    );

    const response = await GET();
    const payload = await response.json();
    const corrected = payload.attendees.find(
      (row: { id: string }) => row.id === baseline.id,
    );

    expect(payload.attendees).toHaveLength(121);
    expect(corrected).toMatchObject({
      school_name: "API Corrected School",
      status: "did_not_attend",
      updated_by: "Iyanu",
    });
  });
});

describe("PATCH /api/attendees/:id", () => {
  beforeEach(async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser);
    await upsertSeedAttendee({
      id: "printed-1",
      seed_sn: 1,
      contact_name: "Jane Okoro",
      school_name: "Bright Future Academy",
      phone: "08031234567",
      email: "jane@example.com",
      status: "attended",
      source_image: "IMG_6769.HEIC",
      transcription_notes: null,
      source_kind: "printed",
    });
  });

  afterEach(() => {
    resetMemoryStore();
    vi.clearAllMocks();
  });

  it("returns a plain 400 JSON error for malformed JSON", async () => {
    const response = await PATCH(request("{"), context());

    await expectJsonError(response, 400, "Request body must be valid JSON.");
  });

  it.each([
    ["null", "null"],
    ["an array", "[]"],
    ["a string", JSON.stringify("invalid")],
  ])("returns a plain 400 JSON error when the body is %s", async (_label, body) => {
    const response = await PATCH(request(body), context());

    await expectJsonError(response, 400, "Request body must be a JSON object.");
  });

  it.each([null, 42, {}, []])(
    "returns a plain 400 JSON error for non-string operator_name %#",
    async (operatorName) => {
      const response = await PATCH(
        request(JSON.stringify({ operator_name: operatorName })),
        context(),
      );

      await expectJsonError(response, 400, "Operator name must be a string.");
    },
  );

  it.each(["Mallory", "iyanu", " Iyanu "])(
    "rejects non-approved operator name %j",
    async (operatorName) => {
      const response = await PATCH(
        request(JSON.stringify({ operator_name: operatorName })),
        context(),
      );

      await expectJsonError(
        response,
        400,
        "Operator name must be one of: Iyanu, Possible, Abdul, Pelumi.",
      );
    },
  );

  it.each([
    ["contact_name", 42, "Contact name must be a string or null."],
    ["school_name", {}, "School name must be a string."],
    ["phone", true, "Phone must be a string or null."],
    ["email", [], "Email must be a string or null."],
    ["status", 1, "Attendance status must be a string."],
    ["transcription_notes", {}, "Transcription notes must be a string or null."],
  ])("returns a plain 400 JSON error for non-string %s", async (field, value, error) => {
    const response = await PATCH(
      request(JSON.stringify({ operator_name: "Iyanu", [field]: value })),
      context(),
    );

    await expectJsonError(response, 400, error);
  });

  it("maps authenticated attendee domain errors to JSON", async () => {
    const response = await PATCH(
      request(JSON.stringify({ operator_name: "Iyanu", school_name: "School" })),
      context("missing"),
    );

    await expectJsonError(response, 404, "Attendee not found.");
  });

  it("authenticates before parsing the request body", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await PATCH(request("{"), context());

    await expectJsonError(response, 401, "Sign in first.");
  });
});
