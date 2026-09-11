import type { AttendanceStatus, Attendee } from "@/types/attendee";

export type AttendeeQuery = {
  q?: string;
  status?: AttendanceStatus | "";
};

export function filterAttendees(rows: Attendee[], query: AttendeeQuery): Attendee[] {
  const needle = query.q?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (
      needle &&
      !`${row.school_name} ${row.contact_name ?? ""} ${row.phone ?? ""} ${row.email ?? ""}`
        .toLowerCase()
        .includes(needle)
    ) {
      return false;
    }
    if (query.status && row.status !== query.status) return false;
    return true;
  });
}

export function parseAttendeeQuery(search: URLSearchParams): AttendeeQuery {
  const status = search.get("status");
  return {
    q: search.get("q") ?? "",
    status: status === "attended" || status === "did_not_attend" ? status : "",
  };
}
