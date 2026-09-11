import { describe, expect, it } from "vitest";
import {
  attendeePatchFailure,
  decodeAttendeePatchResponse,
} from "@/lib/attendees/client-response";

describe("attendee PATCH client response", () => {
  it("preserves a plain JSON API error", async () => {
    const response = Response.json(
      { error: "School name is required." },
      { status: 400 },
    );
    const payload = await decodeAttendeePatchResponse(response);

    expect(attendeePatchFailure(response.ok, payload)).toBe(
      "School name is required.",
    );
  });

  it("uses a server error when an unsuccessful response is not JSON", async () => {
    const response = new Response("<h1>Server error</h1>", {
      status: 500,
      headers: { "content-type": "text/html" },
    });
    const payload = await decodeAttendeePatchResponse(response);

    expect(payload).toBeNull();
    expect(attendeePatchFailure(response.ok, payload)).toBe(
      "The server could not save attendee details.",
    );
  });

  it("rejects a successful response without an attendee", async () => {
    const response = Response.json({ ok: true });
    const payload = await decodeAttendeePatchResponse(response);

    expect(attendeePatchFailure(response.ok, payload)).toBe(
      "The server returned an invalid attendee response.",
    );
  });
});
