import type { AttendanceStatus, Attendee } from "@/types/attendee";

export type OutreachFilter = "" | "not_contacted" | "contacted";
export type FlagFilter = "" | "priority" | "booked" | "unbooked";

export type AttendeeQuery = {
  q?: string;
  status?: AttendanceStatus | "";
  outreach?: OutreachFilter;
  flag?: FlagFilter;
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
    if (query.outreach === "contacted" && !row.contacted) return false;
    if (query.outreach === "not_contacted" && row.contacted) return false;
    if (query.flag === "priority" && !row.priority) return false;
    if (query.flag === "booked" && !row.install_date) return false;
    if (query.flag === "unbooked" && row.install_date) return false;
    return true;
  });
}

export function parseAttendeeQuery(search: URLSearchParams): AttendeeQuery {
  const status = search.get("status");
  const outreach = search.get("outreach");
  const flag = search.get("flag");
  return {
    q: search.get("q") ?? "",
    status: status === "attended" || status === "did_not_attend" ? status : "",
    outreach: outreach === "contacted" || outreach === "not_contacted" ? outreach : "",
    flag: flag === "priority" || flag === "booked" || flag === "unbooked" ? flag : "",
  };
}
