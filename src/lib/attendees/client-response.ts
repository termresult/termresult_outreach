import {
  ATTENDANCE_STATUSES,
  type Attendee,
} from "@/types/attendee";

export type AttendeePatchPayload = {
  attendee?: Attendee;
  error?: string;
};

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isAttendee(value: unknown): value is Attendee {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const attendee = value as Record<string, unknown>;
  return (
    typeof attendee.id === "string" &&
    (attendee.seed_sn === null || typeof attendee.seed_sn === "number") &&
    isNullableString(attendee.contact_name) &&
    typeof attendee.school_name === "string" &&
    isNullableString(attendee.phone) &&
    isNullableString(attendee.email) &&
    (ATTENDANCE_STATUSES as readonly unknown[]).includes(attendee.status) &&
    isNullableString(attendee.source_image) &&
    isNullableString(attendee.transcription_notes) &&
    (attendee.contacted === undefined || typeof attendee.contacted === "boolean") &&
    (attendee.priority === undefined || typeof attendee.priority === "boolean") &&
    (attendee.install_date === undefined || isNullableString(attendee.install_date)) &&
    (attendee.install_booked_by === undefined || isNullableString(attendee.install_booked_by)) &&
    typeof attendee.created_at === "string" &&
    typeof attendee.updated_at === "string" &&
    typeof attendee.updated_by === "string"
  );
}

export async function decodeAttendeePatchResponse(
  response: Response,
): Promise<AttendeePatchPayload | null> {
  try {
    const value: unknown = await response.json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    const payload = value as Record<string, unknown>;
    if ("attendee" in payload && !isAttendee(payload.attendee)) {
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
