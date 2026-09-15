"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  bookingHref,
  bookingKindLabel,
  calendarBookingMap,
  collectCalendarBookings,
} from "@/lib/proprietors/calendar-bookings";
import { formatInstallDayLong, todayInLagos } from "@/lib/proprietors/install-date";
import { OPERATOR_NAMES, OPERATOR_STORAGE_KEY } from "@/types/proprietor";
import type { Attendee } from "@/types/attendee";
import type { Proprietor } from "@/types/proprietor";
import { InstallMonthGrid } from "../install-month-grid";
import { BookSchoolSheet } from "./book-school-sheet";

export function InstallCalendar({
  initial,
  initialAttendees,
}: {
  initial: Proprietor[];
  initialAttendees: Attendee[];
}) {
  const [rows, setRows] = useState(initial);
  const [attendees, setAttendees] = useState(initialAttendees);
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState({ year: 2026, month: 1 });
  const [picking, setPicking] = useState<string | null>(null);
  const [operator, setOperator] = useState("");

  useEffect(() => {
    const current = todayInLagos();
    const [year, month] = current.split("-").map(Number);
    setToday(current);
    setCursor({ year, month });
    const saved = window.localStorage.getItem(OPERATOR_STORAGE_KEY) ?? "";
    setOperator((OPERATOR_NAMES as readonly string[]).includes(saved) ? saved : "");
  }, []);

  const refresh = useCallback(async () => {
    const [proprietorResponse, attendeeResponse] = await Promise.all([
      fetch("/api/proprietors"),
      fetch("/api/attendees"),
    ]);
    if (proprietorResponse.ok) {
      const data = (await proprietorResponse.json()) as { proprietors: Proprietor[] };
      setRows(data.proprietors);
    }
    if (attendeeResponse.ok) {
      const data = (await attendeeResponse.json()) as { attendees: Attendee[] };
      setAttendees(data.attendees);
    }
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(tick);
  }, [refresh]);

  const bookings = useMemo(
    () => collectCalendarBookings(rows, attendees),
    [rows, attendees],
  );
  const booked = useMemo(() => calendarBookingMap(bookings), [bookings]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((row) => row.install_date >= today)
        .sort((a, b) => a.install_date.localeCompare(b.install_date)),
    [bookings, today],
  );

  if (!today) {
    return <p className="mt-6 text-sm text-slate-500">Loading the calendar…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900">Are we free that day?</p>
        <p className="mt-1 text-xs text-slate-500">
          Tap a green day, search the school, and book it. Blue days already have a school.
          Event schools are marked Attended or Did not attend.
        </p>
        <div className="mt-4">
          <InstallMonthGrid
            year={cursor.year}
            month={cursor.month}
            today={today}
            booked={booked}
            onMonthChange={setCursor}
            onPickFree={setPicking}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">Upcoming installs</p>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No installation days booked yet. Every future day is free.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {upcoming.map((row) => (
              <Link
                key={`${row.kind}-${row.id}`}
                href={bookingHref(row)}
                className="block rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-900">{row.school_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatInstallDayLong(row.install_date)}
                  {row.install_booked_by ? ` · ${row.install_booked_by}` : ""}
                  {` · ${bookingKindLabel(row.kind)}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {picking ? (
        <BookSchoolSheet
          date={picking}
          rows={rows}
          operator={operator}
          onOperator={setOperator}
          onClose={() => setPicking(null)}
          onBooked={(row) => {
            setRows((current) =>
              current
                .map((item) => (item.id === row.id ? row : item))
                .sort((a, b) => a.school_name.localeCompare(b.school_name)),
            );
            setPicking(null);
          }}
        />
      ) : null}
    </div>
  );
}
