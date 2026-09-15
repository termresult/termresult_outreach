export const ATTENDANCE_STATUSES = ["attended", "did_not_attend"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type Attendee = {
  id: string;
  seed_sn: number | null;
  contact_name: string | null;
  school_name: string;
  phone: string | null;
  email: string | null;
  status: AttendanceStatus;
  source_image: string | null;
  transcription_notes: string | null;
  contacted: boolean;
  priority: boolean;
  install_date: string | null;
  install_booked_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string;
};

export type AttendeeInput = {
  contact_name?: string | null;
  school_name: string;
  phone?: string | null;
  email?: string | null;
  status?: AttendanceStatus;
  transcription_notes?: string | null;
  contacted?: boolean;
  priority?: boolean;
  install_date?: string | null;
};
