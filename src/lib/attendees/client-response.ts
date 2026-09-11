import type { Attendee } from "@/types/attendee";

export type AttendeePatchPayload = {
  attendee?: Attendee;
  error?: string;
};

export async function decodeAttendeePatchResponse(
  response: Response,
): Promise<AttendeePatchPayload | null> {
  try {
    const value: unknown = await response.json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as AttendeePatchPayload;
  } catch {
    return null;
  }
}

export function attendeePatchFailure(
  responseOk: boolean,
  payload: AttendeePatchPayload | null,
): string | null {
  if (!responseOk) {
    return typeof payload?.error === "string"
      ? payload.error
      : "The server could not save attendee details.";
  }
  if (!payload?.attendee) {
    return "The server returned an invalid attendee response.";
  }
  return null;
}
