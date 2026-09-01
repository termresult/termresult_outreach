"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BRAND, hexToRgba } from "@/lib/color";
import { monthCells, monthLabel, shiftMonth } from "@/lib/proprietors/install-date";
import type { Proprietor } from "@/types/proprietor";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function InstallMonthGrid({
  year,
  month,
  today,
  booked,
  selected,
  ownerId,
  onMonthChange,
  onSelect,
}: {
  year: number;
  month: number;
  today: string;
  booked: Map<string, Proprietor>;
  selected?: string;
  ownerId?: string | null;
  onMonthChange: (next: { year: number; month: number }) => void;
  onSelect?: (date: string) => void;
}) {
  const cells = monthCells(year, month);
  const inMonth = cells.filter((cell) => cell.inMonth && cell.date >= today);
  const bookedCount = inMonth.filter((cell) => booked.has(cell.date)).length;
  const freeCount = inMonth.length - bookedCount;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(year, month, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </button>
        <p className="text-sm font-bold text-slate-900">{monthLabel(year, month)}</p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(year, month, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {freeCount} free · {bookedCount} booked this month
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Free
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: BRAND }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BRAND }} />
          Booked
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
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
          const mine = school?.id === ownerId;
          const dayNumber = Number(cell.date.slice(-2));

          if (school) {
            const body = (
              <>
                <p className="text-xs font-bold text-slate-900">{dayNumber}</p>
                <p className="mt-0.5 text-[10px] font-semibold" style={{ color: BRAND }}>
                  Booked
                </p>
                <p className="line-clamp-2 text-[10px] font-semibold text-slate-800">{school.school_name}</p>
                {school.install_booked_by ? (
                  <p className="text-[10px] text-slate-500">{school.install_booked_by}</p>
                ) : null}
              </>
            );
            const style = {
              borderColor: hexToRgba(BRAND, 0.3),
              backgroundColor: selected === cell.date || mine ? hexToRgba(BRAND, 0.1) : hexToRgba(BRAND, 0.05),
              opacity: cell.inMonth ? 1 : 0.4,
            };
            if (onSelect && mine) {
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelect(cell.date)}
                  className="min-h-[76px] rounded-xl border p-1.5 text-left"
                  style={style}
                >
                  {body}
                </button>
              );
            }
            if (!onSelect) {
              return (
                <Link
                  key={cell.date}
                  href={`/proprietors?open=${school.id}`}
                  className="min-h-[76px] rounded-xl border p-1.5 text-left"
                  style={style}
                >
                  {body}
                </Link>
              );
            }
            return (
              <div key={cell.date} className="min-h-[76px] rounded-xl border p-1.5 text-left" style={style}>
                {body}
              </div>
            );
          }

          const free = !past;
          if (onSelect && free && cell.inMonth) {
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelect(cell.date)}
                className="min-h-[76px] rounded-xl border p-1.5 text-left"
                style={{
                  borderColor: selected === cell.date ? "#059669" : "#bbf7d0",
                  backgroundColor: selected === cell.date ? "#d1fae5" : "#f0fdf4",
                }}
              >
                <p className="text-xs font-bold text-slate-900">{dayNumber}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-emerald-700">
                  {selected === cell.date ? "Picked" : "Free"}
                </p>
              </button>
            );
          }

          return (
            <div
              key={cell.date}
              className="min-h-[76px] rounded-xl border p-1.5"
              style={{
                borderColor: free ? "#bbf7d0" : "#e2e8f0",
                backgroundColor: free ? "#f0fdf4" : "#f8fafc",
                opacity: cell.inMonth ? 1 : 0.35,
              }}
            >
              <p
                className="text-xs font-bold"
                style={{ color: isToday ? BRAND : past ? "#94a3b8" : "#0f172a" }}
              >
                {dayNumber}
              </p>
              <p className={`mt-0.5 text-[10px] font-semibold ${past ? "text-slate-400" : "text-emerald-700"}`}>
                {past ? "Past" : "Free"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
