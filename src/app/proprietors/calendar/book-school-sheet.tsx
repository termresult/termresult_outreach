"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";
import { BRAND } from "@/lib/color";
import { formatInstallDayLong, searchSchools } from "@/lib/proprietors/install-date";
import { OPERATOR_NAMES, OPERATOR_STORAGE_KEY } from "@/types/proprietor";
import type { Proprietor } from "@/types/proprietor";

export function BookSchoolSheet({
  date,
  rows,
  operator,
  onOperator,
  onClose,
  onBooked,
}: {
  date: string;
  rows: Proprietor[];
  operator: string;
  onOperator: (name: string) => void;
  onClose: () => void;
  onBooked: (row: Proprietor) => void;
}) {
  const [query, setQuery] = useState("");
  const [draftName, setDraftName] = useState(operator);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const matches = useMemo(() => searchSchools(rows, query).slice(0, 40), [rows, query]);

  async function pick(row: Proprietor) {
    const name = operator || draftName;
    if (!(OPERATOR_NAMES as readonly string[]).includes(name)) {
      setError("Save who you are first.");
      return;
    }
    if (!operator) {
      window.localStorage.setItem(OPERATOR_STORAGE_KEY, name);
      onOperator(name);
    }
    setBusyId(row.id);
    setError(null);
    try {
      const response = await fetch(`/api/proprietors/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ install_date: date, operator_name: name }),
      });
      const data = (await response.json()) as { proprietor?: Proprietor; error?: string };
      if (!response.ok || !data.proprietor) {
        setError(data.error ?? "Could not book that school.");
        return;
      }
      onBooked(data.proprietor);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Add school</p>
            <p className="text-lg font-bold text-slate-900">{formatInstallDayLong(date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 border-b border-slate-100 px-5 py-4">
          {!operator ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Who are you?</p>
              <FormSelect
                className="mt-1"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              >
                <option value="">Pick your name</option>
                {OPERATOR_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Booking as <span className="font-bold text-slate-900">{operator}</span>
            </p>
          )}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search school, proprietor, phone"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400"
          />
          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {matches.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No school matches that search.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void pick(row)}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm disabled:opacity-60"
                >
                  <p className="text-sm font-bold text-slate-900">{row.school_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.proprietor_name || "No proprietor name"}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                  {row.install_date ? (
                    <p className="mt-1 text-xs font-semibold" style={{ color: BRAND }}>
                      Already booked {formatInstallDayLong(row.install_date)} — tap to move them
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">No install day yet</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
