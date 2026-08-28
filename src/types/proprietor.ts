export const FOLLOW_UP_STATUSES = [
  "not_yet_contacted",
  "in_conversation",
  "email_sent",
  "call_scheduled",
  "closed_not_interested",
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  not_yet_contacted: "Not yet contacted",
  in_conversation: "In conversation",
  email_sent: "Email sent",
  call_scheduled: "Call scheduled",
  closed_not_interested: "Closed - not interested",
};

export const SCHOOL_SOFTWARE = ["none", "b4", "other"] as const;

export type SchoolSoftware = (typeof SCHOOL_SOFTWARE)[number];

export const SOFTWARE_LABELS: Record<SchoolSoftware, string> = {
  none: "None",
  b4: "B4",
  other: "Other",
};

export const OPERATOR_NAMES = ["Iyanu", "Possible", "Abdul", "Pelumi"] as const;

export const LOCK_MS = 15 * 60 * 1000;

export type Proprietor = {
  id: string;
  school_name: string;
  school_key: string;
  proprietor_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: FollowUpStatus;
  contact_person: string | null;
  student_count: number | null;
  average_fees: number | null;
  software: SchoolSoftware;
  software_other: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string;
  talking_by: string | null;
  talking_at: string | null;
};

export type ProprietorInput = {
  school_name: string;
  proprietor_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: FollowUpStatus;
  contact_person?: string | null;
  student_count?: number | null;
  average_fees?: number | null;
  software?: SchoolSoftware;
  software_other?: string | null;
};

export function alreadyTalked(status: FollowUpStatus): boolean {
  return status !== "not_yet_contacted";
}

export function isFollowUpStatus(value: unknown): value is FollowUpStatus {
  return typeof value === "string" && (FOLLOW_UP_STATUSES as readonly string[]).includes(value);
}

export function isSchoolSoftware(value: unknown): value is SchoolSoftware {
  return typeof value === "string" && (SCHOOL_SOFTWARE as readonly string[]).includes(value);
}

export function isLockActive(row: Proprietor, now = Date.now()): boolean {
  if (!row.talking_by || !row.talking_at) return false;
  const started = Date.parse(row.talking_at);
  if (Number.isNaN(started)) return false;
  return now - started < LOCK_MS;
}

export function withEffectiveLock(row: Proprietor, now = Date.now()): Proprietor {
  if (isLockActive(row, now)) return row;
  if (!row.talking_by && !row.talking_at) return row;
  return { ...row, talking_by: null, talking_at: null };
}
