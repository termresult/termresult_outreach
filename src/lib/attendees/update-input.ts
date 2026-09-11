import { AttendeeError } from "@/lib/store/attendees";
import type { AttendeeInput } from "@/types/attendee";
import { isOperatorName, OPERATOR_NAMES } from "@/types/proprietor";

type ParsedAttendeeUpdate = {
  input: Partial<AttendeeInput>;
  actor: string;
};

const NULLABLE_STRING_FIELDS = [
  ["contact_name", "Contact name"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["transcription_notes", "Transcription notes"],
] as const;

export function parseAttendeeUpdateBody(value: unknown): ParsedAttendeeUpdate {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AttendeeError("Request body must be a JSON object.", 400);
  }

  const body = value as Record<string, unknown>;
  if (typeof body.operator_name !== "string") {
    throw new AttendeeError("Operator name must be a string.", 400);
  }
  if (!isOperatorName(body.operator_name)) {
    throw new AttendeeError(
      `Operator name must be one of: ${OPERATOR_NAMES.join(", ")}.`,
      400,
    );
  }

  const input: Partial<AttendeeInput> = {};
  for (const [field, label] of NULLABLE_STRING_FIELDS) {
    const fieldValue = body[field];
    if (fieldValue === undefined) continue;
    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw new AttendeeError(`${label} must be a string or null.`, 400);
    }
    input[field] = fieldValue;
  }

  if (body.school_name !== undefined) {
    if (typeof body.school_name !== "string") {
      throw new AttendeeError("School name must be a string.", 400);
    }
    input.school_name = body.school_name;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string") {
      throw new AttendeeError("Attendance status must be a string.", 400);
    }
    input.status = body.status as AttendeeInput["status"];
  }

  return { input, actor: body.operator_name };
}
