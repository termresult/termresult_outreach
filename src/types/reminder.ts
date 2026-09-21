export const REMINDER_KINDS = ["call", "other"] as const;

export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_KIND_LABELS: Record<ReminderKind, string> = {
  call: "Call back",
  other: "Other",
};

export const REMINDER_SCHOOL_SOURCES = ["proprietor", "attendee", "custom"] as const;

export type ReminderSchoolSource = (typeof REMINDER_SCHOOL_SOURCES)[number];

export type Reminder = {
  id: string;
  school_id: string | null;
  school_name: string;
  school_source: ReminderSchoolSource;
  phone: string | null;
  kind: ReminderKind;
  note: string | null;
  due_at: string;
  done: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type ReminderInput = {
  school_id?: string | null;
  school_source?: ReminderSchoolSource;
  school_name?: string | null;
  phone?: string | null;
  kind?: ReminderKind;
  note?: string | null;
  due_date: string;
  due_time: string;
};

export type ReminderSchool = {
  key: string;
  id: string;
  school_name: string;
  phone: string | null;
  source: Exclude<ReminderSchoolSource, "custom">;
};

export function isReminderKind(value: unknown): value is ReminderKind {
  return typeof value === "string" && (REMINDER_KINDS as readonly string[]).includes(value);
}

export function isReminderSchoolSource(value: unknown): value is ReminderSchoolSource {
  return typeof value === "string" && (REMINDER_SCHOOL_SOURCES as readonly string[]).includes(value);
}

export function reminderSchoolKey(source: ReminderSchool["source"], id: string): string {
  return `${source}:${id}`;
}
