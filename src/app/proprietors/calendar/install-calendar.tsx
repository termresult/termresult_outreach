"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatInstallDayLong, todayInLagos } from "@/lib/proprietors/install-date";
import type { Proprietor } from "@/types/proprietor";
import { InstallMonthGrid } from "../install-month-grid";

export function InstallCalendar({ initial }: { initial: Proprietor[] }) {
  const [rows, setRows] = useState(initial);
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState({ year: 2026, month: 1 });

  useEffect(() => {
    const current = todayInLagos();
    const [year, month] = current.split("-").map(Number);
    setToday(current);
    setCursor({ year, month });
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/proprietors");
    if (!response.ok) return;
    const data = (await response.json()) as { proprietors: Proprietor[] };
    setRows(data.proprietors);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(tick);
  }, [refresh]);

  const booked = useMemo(() => {
    const map = new Map<string, Proprietor>();
    for (const row of rows) {
      if (row.install_date) map.set(row.install_date, row);
    }
    return map;
  }, [rows]);

  const upcoming = useMemo(
    () =>
      rows
        .filter((row) => row.install_date && row.install_date >= today)
        .sort((a, b) => (a.install_date ?? "").localeCompare(b.install_date ?? "")),
    [rows, today],
  );

  if (!today) {
    return <p className="mt-6 text-sm text-slate-500">Loading the calendar…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900">Are we free that day?</p>
        <p className="mt-1 text-xs text-slate-500">
          Green days are open. Blue days already have a school. Tap a booked day to open it.
        </p>
        <div className="mt-4">
          <InstallMonthGrid
            year={cursor.year}
            month={cursor.month}
            today={today}
            booked={booked}
            onMonthChange={setCursor}
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
                key={row.id}
                href={`/proprietors?open=${row.id}`}
                className="block rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-900">{row.school_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatInstallDayLong(row.install_date!)}
                  {row.install_booked_by ? ` · ${row.install_booked_by}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
