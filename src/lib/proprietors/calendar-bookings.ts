import type { AttendanceStatus, Attendee } from "@/types/attendee";
import type { Proprietor } from "@/types/proprietor";

export type CalendarBookingKind = "proprietor" | AttendanceStatus;

export type CalendarBooking = {
  id: string;
  school_name: string;
  install_date: string;
  install_booked_by: string | null;
  kind: CalendarBookingKind;
};

export function bookingFromProprietor(row: Pick<Proprietor, "id" | "school_name" | "install_date" | "install_booked_by">): CalendarBooking | null {
  if (!row.install_date) return null;
  return {
    id: row.id,
    school_name: row.school_name,
    install_date: row.install_date,
    install_booked_by: row.install_booked_by,
    kind: "proprietor",
  };
}

export function bookingFromAttendee(row: Pick<Attendee, "id" | "school_name" | "install_date" | "install_booked_by" | "status">): CalendarBooking | null {
  if (!row.install_date) return null;
  return {
    id: row.id,
    school_name: row.school_name,
    install_date: row.install_date,
    install_booked_by: row.install_booked_by,
    kind: row.status,
  };
}

export function collectCalendarBookings(
  proprietors: Array<Pick<Proprietor, "id" | "school_name" | "install_date" | "install_booked_by">>,
  attendees: Array<Pick<Attendee, "id" | "school_name" | "install_date" | "install_booked_by" | "status">>,
): CalendarBooking[] {
  const byDate = new Map<string, CalendarBooking>();
  for (const row of proprietors) {
    const booking = bookingFromProprietor(row);
    if (booking) byDate.set(booking.install_date, booking);
  }
  for (const row of attendees) {
    const booking = bookingFromAttendee(row);
    if (booking) byDate.set(booking.install_date, booking);
  }
  return [...byDate.values()];
}

export function calendarBookingMap(bookings: CalendarBooking[]): Map<string, CalendarBooking> {
  return new Map(bookings.map((booking) => [booking.install_date, booking]));
}

export function bookingHref(booking: CalendarBooking): string {
  return booking.kind === "proprietor"
    ? `/proprietors?open=${encodeURIComponent(booking.id)}`
    : `/attendees?open=${encodeURIComponent(booking.id)}`;
}

export function bookingKindLabel(kind: CalendarBookingKind): string {
  if (kind === "attended") return "Attended";
  if (kind === "did_not_attend") return "Did not attend";
  return "Proprietor";
}
