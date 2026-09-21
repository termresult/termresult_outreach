"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, Phone, Plus, Trash2 } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";
import { BRAND, hexToRgba } from "@/lib/color";
import { defaultReminderSlot, formatReminderWhen, isReminderOverdue } from "@/lib/reminders/when";
import {
  OPERATOR_NAMES,
  OPERATOR_STORAGE_KEY,
  isOperatorName,
} from "@/types/proprietor";
import {
  REMINDER_KIND_LABELS,
  REMINDER_KINDS,
  reminderSchoolKey,
  type Reminder,
  type ReminderKind,
  type ReminderSchool,
} from "@/types/reminder";

type Filter = "open" | "done" | "all";

type FormState = {
  school_key: string;
  school_name: string;
  kind: ReminderKind;
  note: string;
  due_date: string;
  due_time: string;
};

function emptyForm(slot?: { date: string; time: string }): FormState {
  return {
    school_key: "",
    school_name: "",
    kind: "call",
    note: "",
    due_date: slot?.date ?? "",
    due_time: slot?.time ?? "",
  };
}

export function ReminderPanel({
  compact = false,
  onClose,
}: {
  compact?: boolean;
  onClose?: () => void;
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schools, setSchools] = useState<ReminderSchool[]>([]);
  const [operator, setOperator] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(OPERATOR_STORAGE_KEY) ?? "";
    setOperator(isOperatorName(saved) ? saved : "");
    setForm((current) => (current.due_date ? current : emptyForm(defaultReminderSlot())));
    setReady(true);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/reminders");
    const data = (await res.json()) as { reminders?: Reminder[]; schools?: ReminderSchool[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not load reminders.");
      return;
    }
    setReminders(data.reminders ?? []);
    setSchools(data.schools ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onRemind(event: Event) {
      const detail = (event as CustomEvent<{
        school_id: string;
        school_name: string;
        school_source: "proprietor" | "attendee";
        phone: string | null;
      }>).detail;
      if (!detail) return;
      const slot = defaultReminderSlot();
      setForm({
        school_key: reminderSchoolKey(detail.school_source, detail.school_id),
        school_name: detail.school_name,
        kind: "call",
        note: "",
        due_date: slot.date,
        due_time: slot.time,
      });
      setSchoolQuery(detail.school_name);
      setFilter("open");
    }
    window.addEventListener("outreach-remind", onRemind);
    return () => window.removeEventListener("outreach-remind", onRemind);
  }, []);

  const selectedSchool = schools.find((row) => row.key === form.school_key) ?? null;
  const matches = useMemo(() => {
    const q = schoolQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return schools
      .filter((row) => {
        return [row.school_name, row.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [schoolQuery, schools]);

  const visible = reminders.filter((row) => {
    if (filter === "open") return !row.done;
    if (filter === "done") return row.done;
    return true;
  });
  const openCount = reminders.filter((row) => !row.done).length;
  const overdueCount = reminders.filter((row) => !row.done && isReminderOverdue(row.due_at)).length;

  async function saveName(name: string) {
    if (!isOperatorName(name)) return;
    window.localStorage.setItem(OPERATOR_STORAGE_KEY, name);
    setOperator(name);
  }

  async function create() {
    if (!operator) {
      setError("Save who you are first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_name: operator,
          school_id: selectedSchool?.id ?? null,
          school_source: selectedSchool?.source ?? "custom",
          school_name: selectedSchool?.school_name || form.school_name || schoolQuery,
          phone: selectedSchool?.phone ?? null,
          kind: form.kind,
          note: form.note,
          due_date: form.due_date,
          due_time: form.due_time,
        }),
      });
      const data = (await res.json()) as { reminder?: Reminder; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save reminder.");
        return;
      }
      setForm(emptyForm(defaultReminderSlot()));
      setSchoolQuery("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: { done?: boolean }) {
    if (!operator) {
      setError("Save who you are first.");
      return;
    }
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, operator_name: operator }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not update reminder.");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!operator) {
      setError("Save who you are first.");
      return;
    }
    const res = await fetch(`/api/reminders/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator_name: operator }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not delete reminder.");
      return;
    }
    await load();
  }

  return (
    <div className={compact ? "flex h-full flex-col" : "mt-6"}>
      <div className={compact ? "border-b border-slate-100 px-5 py-4" : "mb-4"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reminders</p>
            <p className="mt-1 text-lg font-bold text-slate-900">Call them back</p>
            <p className="mt-1 text-xs text-slate-500">
              {openCount ? `${openCount} open` : "Nothing waiting"}
              {overdueCount ? ` · ${overdueCount} overdue` : ""}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className={compact ? "flex-1 space-y-5 overflow-y-auto px-5 py-4" : "space-y-5"}>
        {!ready ? null : !operator ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-bold text-slate-900">Who are you?</p>
            <FormSelect className="mt-2" value="" onChange={(event) => void saveName(event.target.value)}>
              <option value="">Pick your name</option>
              {OPERATOR_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </FormSelect>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Saving as <span className="font-semibold text-slate-800">{operator}</span>
          </p>
        )}

        <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900">New reminder</p>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">School</span>
            <input
              value={schoolQuery}
              onChange={(event) => {
                setSchoolQuery(event.target.value);
                setForm({ ...form, school_key: "", school_name: event.target.value });
              }}
              placeholder="Search or type a school"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
          {matches.length ? (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100">
              {matches.map((row) => {
                const active = form.school_key === row.key;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, school_key: row.key, school_name: row.school_name });
                      setSchoolQuery(row.school_name);
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm"
                    style={
                      active
                        ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
                        : { backgroundColor: "#fff", color: "#0f172a" }
                    }
                  >
                    <span className="font-semibold">{row.school_name}</span>
                    <span className="text-xs text-slate-500">
                      {row.source === "proprietor" ? "Proprietor" : "Attendee"}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">What for</span>
            <FormSelect
              className="mt-1"
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value as ReminderKind })}
            >
              {REMINDER_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {REMINDER_KIND_LABELS[kind]}
                </option>
              ))}
            </FormSelect>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time</span>
              <input
                type="time"
                value={form.due_time}
                onChange={(event) => setForm({ ...form, due_time: event.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note</span>
            <textarea
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              rows={compact ? 2 : 3}
              placeholder="Call back, send quote, anything"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void create()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            <Plus className="h-4 w-4" />
            {busy ? "Saving…" : "Save reminder"}
          </button>
        </div>

        <div className="flex gap-2">
          {([
            { id: "open" as const, label: "Open" },
            { id: "done" as const, label: "Done" },
            { id: "all" as const, label: "All" },
          ]).map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={
                  active
                    ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
                    : { backgroundColor: "#fff", color: "#475569", border: "1px solid #e2e8f0" }
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white px-4 py-8 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }}>
              <Bell className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">No reminders here</p>
            <p className="mt-1 text-xs text-slate-500">Pick a school, a time, and what you need to do.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((row) => {
              const overdue = !row.done && isReminderOverdue(row.due_at);
              return (
                <div
                  key={row.id}
                  className="rounded-xl border bg-white p-3 shadow-sm"
                  style={{ borderColor: overdue ? "#fecdd3" : "#f1f5f9" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{row.school_name}</p>
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: overdue ? "#be123c" : BRAND }}>
                        {REMINDER_KIND_LABELS[row.kind]}
                        {overdue ? " · Overdue" : ""}
                        {row.done ? " · Done" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatReminderWhen(row.due_at)}</p>
                      {row.note ? <p className="mt-1 text-sm text-slate-700">{row.note}</p> : null}
                      {row.phone ? (
                        <a href={`tel:${row.phone}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: BRAND }}>
                          <Phone className="h-3 w-3" />
                          {row.phone}
                        </a>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">Set by {row.created_by}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => void patch(row.id, { done: !row.done })}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                        aria-label={row.done ? "Reopen reminder" : "Mark reminder done"}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(row.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
