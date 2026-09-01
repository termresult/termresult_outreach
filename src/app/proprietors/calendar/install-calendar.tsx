"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BRAND, hexToRgba } from "@/lib/color";
import {
  formatInstallDayLong,
  monthCells,
  monthLabel,
  shiftMonth,
  todayInLagos,
} from "@/lib/proprietors/install-date";
import type { Proprietor } from "@/types/proprietor";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  const cells = monthCells(cursor.year, cursor.month);

  if (!today) {
    return <p className="mt-6 text-sm text-slate-500">Loading the calendar…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          <p className="text-sm font-bold text-slate-900">{monthLabel(cursor.year, cursor.month)}</p>
          <button
            type="button"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">One school per day. Tap a booked day to open that school.</p>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const school = booked.get(cell.date);
            const isToday = cell.date === today;
            const past = cell.date < today;
            if (school) {
              return (
                <Link
                  key={cell.date}
                  href={`/proprietors?open=${school.id}`}
                  className="min-h-[72px] rounded-xl border p-1.5 text-left"
                  style={{
                    borderColor: hexToRgba(BRAND, 0.25),
                    backgroundColor: hexToRgba(BRAND, 0.06),
                    opacity: cell.inMonth ? 1 : 0.45,
                  }}
                >
                  <p className="text-xs font-bold text-slate-900">{Number(cell.date.slice(-2))}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-800">
                    {school.school_name}
                  </p>
                  <p className="text-[10px] text-slate-500">{school.install_booked_by}</p>
                </Link>
              );
            }
            return (
              <div
                key={cell.date}
                className="min-h-[72px] rounded-xl border border-slate-100 bg-slate-50/70 p-1.5"
                style={{ opacity: cell.inMonth ? 1 : 0.35 }}
              >
                <p
                  className="text-xs font-bold"
                  style={{ color: isToday ? BRAND : past ? "#94a3b8" : "#0f172a" }}
                >
                  {Number(cell.date.slice(-2))}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">Upcoming installs</p>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No installation days booked yet.</p>
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
