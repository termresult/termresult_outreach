"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, NotebookPen, Plus, X } from "lucide-react";
import { EmptyState } from "@/components/ui/ds";
import { FormSelect } from "@/components/ui/form-select";
import { BRAND, hexToRgba } from "@/lib/color";
import { formatInstallDay } from "@/lib/proprietors/install-date";
import { InstallDateField } from "./install-date-field";
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATUSES,
  OPERATOR_NAMES,
  OPERATOR_STORAGE_KEY,
  SOFTWARE_LABELS,
  alreadyTalked,
  firstTalkedBy,
  isLockActive,
  type FollowUpStatus,
  type Proprietor,
  type ProprietorInput,
  type SchoolSoftware,
} from "@/types/proprietor";

const NAME_KEY = OPERATOR_STORAGE_KEY;

type Filter = "all" | "not_yet" | "talked" | "talking";
type FirstTalker = "all" | (typeof OPERATOR_NAMES)[number];

type FormState = {
  school_name: string;
  proprietor_name: string;
  email: string;
  phone: string;
  notes: string;
  status: FollowUpStatus;
  contact_person: string;
  student_count: string;
  average_fees: string;
  software: SchoolSoftware;
  software_other: string;
  install_date: string;
};

const emptyForm = (): FormState => ({
  school_name: "",
  proprietor_name: "",
  email: "",
  phone: "",
  notes: "",
  status: "not_yet_contacted",
  contact_person: "",
  student_count: "",
  average_fees: "",
  software: "none",
  software_other: "",
  install_date: "",
});

function fromRow(row: Proprietor): FormState {
  return {
    school_name: row.school_name,
    proprietor_name: row.proprietor_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    notes: row.notes ?? "",
    status: row.status,
    contact_person: row.contact_person ?? "",
    student_count: row.student_count != null ? String(row.student_count) : "",
    average_fees: row.average_fees != null ? String(row.average_fees) : "",
    software: row.software,
    software_other: row.software_other ?? "",
    install_date: row.install_date ?? "",
  };
}

function toInput(form: FormState): ProprietorInput {
  return {
    school_name: form.school_name,
    proprietor_name: form.proprietor_name,
    email: form.email,
    phone: form.phone,
    notes: form.notes,
    status: form.status,
    contact_person: form.contact_person,
    student_count: form.student_count ? Number(form.student_count) : null,
    average_fees: form.average_fees ? Number(form.average_fees) : null,
    software: form.software,
    software_other: form.software_other,
    install_date: form.install_date || null,
  };
}

function statusTone(status: FollowUpStatus): { bg: string; text: string } {
  switch (status) {
    case "in_conversation":
      return { bg: "#FFFBEB", text: "#B45309" };
    case "email_sent":
      return { bg: hexToRgba(BRAND, 0.08), text: BRAND };
    case "call_scheduled":
      return { bg: "#F5F3FF", text: "#6D28D9" };
    case "closed_not_interested":
      return { bg: "#FFF1F2", text: "#BE123C" };
    default:
      return { bg: "#F8FAFC", text: "#475569" };
  }
}

function naira(value: number | null): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString("en-NG")}`;
}

function softwareLine(row: Proprietor): string {
  if (row.software === "other") return row.software_other || "Other software";
  if (row.software === "b4") return "Uses B4";
  return "No software yet";
}

function when(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

export function ProprietorsBoard({
  initial,
  openId = null,
}: {
  initial: Proprietor[];
  openId?: string | null;
}) {
  const [rows, setRows] = useState(initial);
  const [operator, setOperator] = useState("");
  const [draftName, setDraftName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [firstTalker, setFirstTalker] = useState<FirstTalker>("all");
  const openedRow = openId ? initial.find((item) => item.id === openId) ?? null : null;
  const [open, setOpen] = useState(Boolean(openedRow));
  const [editing, setEditing] = useState<Proprietor | null>(openedRow);
  const [form, setForm] = useState<FormState>(openedRow ? fromRow(openedRow) : emptyForm());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY) ?? "";
    const known = (OPERATOR_NAMES as readonly string[]).includes(saved) ? saved : "";
    setOperator(known);
    setDraftName(known);
    setEditingName(!known);
    setReady(true);
  }, []);

  function saveName() {
    if (!(OPERATOR_NAMES as readonly string[]).includes(draftName)) {
      setError("Pick your name, then save.");
      return;
    }
    window.localStorage.setItem(NAME_KEY, draftName);
    setOperator(draftName);
    setEditingName(false);
    setError(null);
  }

  const refresh = useCallback(async () => {
    const response = await fetch("/api/proprietors");
    if (!response.ok) return;
    const data = (await response.json()) as { proprietors: Proprietor[] };
    setRows(data.proprietors);
    setEditing((current) => current ? data.proprietors.find((row) => row.id === current.id) ?? current : current);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(tick);
  }, [refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "not_yet" && row.status !== "not_yet_contacted") return false;
      if (filter === "talked" && !alreadyTalked(row.status)) return false;
      if (filter === "talking" && !isLockActive(row)) return false;
      if (firstTalker !== "all" && firstTalkedBy(row) !== firstTalker) return false;
      if (!q) return true;
      return [row.school_name, row.proprietor_name, row.phone, row.email, row.contact_person]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, query, filter, firstTalker]);

  function needName(): boolean {
    if (operator) return false;
    setError("Save who you are first.");
    setEditingName(true);
    return true;
  }

  async function openNew() {
    if (needName()) return;
    setEditing(null);
    setForm(emptyForm());
    setNotice(null);
    setError(null);
    setOpen(true);
  }

  function openRow(row: Proprietor) {
    if (needName()) return;
    setError(null);
    setNotice(null);
    setEditing(row);
    setForm(fromRow(row));
    setOpen(true);
  }

  async function save() {
    if (needName()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const payload = {
      ...toInput({ ...form, contact_person: editing?.contact_person || operator }),
      operator_name: operator,
    };
    try {
      if (editing) {
        const response = await fetch(`/api/proprietors/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { proprietor?: Proprietor; error?: string };
        if (!response.ok || !data.proprietor) {
          setError(data.error ?? "Could not save.");
          return;
        }
        setRows((current) =>
          current
            .map((item) => (item.id === data.proprietor!.id ? data.proprietor! : item))
            .sort((a, b) => a.school_name.localeCompare(b.school_name)),
        );
        setOpen(false);
        return;
      }

      const response = await fetch("/api/proprietors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        proprietor?: Proprietor;
        created?: boolean;
        error?: string;
      };
      if (!response.ok || !data.proprietor) {
        setError(data.error ?? "Could not save.");
        return;
      }
      if (!data.created) {
        setNotice("That school is already on the list.");
        setEditing(data.proprietor);
        setForm(fromRow(data.proprietor));
        setRows((current) => {
          if (current.some((item) => item.id === data.proprietor!.id)) return current;
          return [...current, data.proprietor!].sort((a, b) => a.school_name.localeCompare(b.school_name));
        });
        return;
      }
      setRows((current) =>
        [...current, data.proprietor!].sort((a, b) => a.school_name.localeCompare(b.school_name)),
      );
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "not_yet", label: "Not yet contacted" },
    { id: "talked", label: "Already talked" },
    { id: "talking", label: "In conversation" },
  ];

  return (
    <div className="mt-6">
      <div className="space-y-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:px-5">
        {!ready ? null : !operator || editingName ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Who are you?</p>
            <p className="mt-1 text-sm text-slate-500">Save this once. We only write your name when you update a school.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <FormSelect
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="flex-1"
              >
                <option value="">Pick your name</option>
                {OPERATOR_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </FormSelect>
              <button
                type="button"
                onClick={saveName}
                className="h-10 rounded-full px-5 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: BRAND }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              You are <span className="font-bold text-slate-900">{operator}</span>
              <button
                type="button"
                onClick={() => {
                  setDraftName(operator);
                  setEditingName(true);
                }}
                className="ml-2 text-sm font-semibold"
                style={{ color: BRAND }}
              >
                Change
              </button>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/proprietors/calendar"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <CalendarDays className="h-4 w-4" />
                Check free dates
              </Link>
              <button
                type="button"
                onClick={() => void openNew()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: BRAND }}
              >
                <Plus className="h-4 w-4" />
                Add school
              </button>
            </div>
          </div>
        )}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search school, proprietor, phone"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
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
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">First talk</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {([{ id: "all" as const, label: "Anyone" }, ...OPERATOR_NAMES.map((name) => ({ id: name, label: name }))]).map(
              (item) => {
                const active = firstTalker === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFirstTalker(item.id)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={
                      active
                        ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
                        : { backgroundColor: "#fff", color: "#475569", border: "1px solid #e2e8f0" }
                    }
                  >
                    {item.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Showing {visible.length} of {rows.length} schools
        {firstTalker === "all" ? "." : ` \u00b7 first talk ${firstTalker}.`}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-4 w-4" />}
          title="No conversations yet"
          description="Add the first school after you talk to them."
        />
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Nothing matches this filter.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
            {visible.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => void openRow(row)}
                className="rounded-xl border bg-white p-4 text-left shadow-sm"
                style={{
                  borderColor: alreadyTalked(row.status) ? hexToRgba(BRAND, 0.25) : "#f1f5f9",
                  backgroundColor: alreadyTalked(row.status) ? hexToRgba(BRAND, 0.03) : "#fff",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{row.school_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.proprietor_name || "No proprietor name"}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{row.phone || "No phone"}</p>
                <p className="text-sm text-slate-600">
                  {row.student_count != null ? `${row.student_count} students` : "Student count unknown"}
                  {" · "}
                  {softwareLine(row)}
                </p>
                {row.install_date ? (
                  <p className="mt-1 text-sm font-semibold" style={{ color: BRAND }}>
                    Install {formatInstallDay(row.install_date)}
                    {row.install_booked_by ? ` · ${row.install_booked_by}` : ""}
                  </p>
                ) : null}
                <TalkLine row={row} />
              </button>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm md:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["School", "Proprietor", "Status", "First talk", "Install", "Students", "Fees", "Software", "Last talk"].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => void openRow(row)}
                    style={
                      alreadyTalked(row.status)
                        ? { backgroundColor: hexToRgba(BRAND, 0.03) }
                        : undefined
                    }
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{row.school_name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.proprietor_name || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{firstTalkedBy(row) ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.install_date
                        ? `${formatInstallDay(row.install_date)}${row.install_booked_by ? ` · ${row.install_booked_by}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.student_count ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{naira(row.average_fees)}</td>
                    <td className="px-4 py-3 text-slate-600">{softwareLine(row)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.updated_by} · {when(row.updated_at)}
                      {isLockActive(row) ? (
                        <span className="mt-1 block text-xs font-semibold text-amber-700">
                          {row.talking_by} is talking
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/20"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {editing ? "Edit school" : "Add school"}
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {editing?.school_name || "New conversation"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {notice ? <p className="text-sm font-semibold text-amber-700">{notice}</p> : null}
              {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
              <Field label="School name" value={form.school_name} onChange={(school_name) => setForm({ ...form, school_name })} />
              <Field label="Proprietor name" value={form.proprietor_name} onChange={(proprietor_name) => setForm({ ...form, proprietor_name })} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">First talk</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {form.contact_person || "Not set yet"}
                </p>
                {!form.contact_person ? (
                  <p className="mt-1 text-xs text-slate-500">Saves as {operator} the first time you update this school.</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Stays with the first person who talked to them.</p>
                )}
              </div>
              <Field label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} type="email" />
              <Field label="Phone number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
              <InstallDateField
                value={form.install_date}
                ownerId={editing?.id ?? null}
                rows={rows}
                onChange={(install_date) => setForm({ ...form, install_date })}
              />
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up status</span>
                <FormSelect
                  className="mt-1"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as FollowUpStatus })}
                >
                  {FOLLOW_UP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {FOLLOW_UP_LABELS[status]}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Number of students"
                  value={form.student_count}
                  onChange={(student_count) => setForm({ ...form, student_count })}
                  type="number"
                />
                <Field
                  label="Average school fees"
                  value={form.average_fees}
                  onChange={(average_fees) => setForm({ ...form, average_fees })}
                  type="number"
                />
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  School software
                </span>
                <FormSelect
                  className="mt-1"
                  value={form.software}
                  onChange={(event) => setForm({ ...form, software: event.target.value as SchoolSoftware })}
                >
                  {Object.entries(SOFTWARE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              {form.software === "other" ? (
                <Field
                  label="Which software"
                  value={form.software_other}
                  onChange={(software_other) => setForm({ ...form, software_other })}
                />
              ) : null}
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes / interest level
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="h-11 w-full rounded-full text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: FollowUpStatus }) {
  const tone = statusTone(status);
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      {FOLLOW_UP_LABELS[status]}
    </span>
  );
}

function TalkLine({ row }: { row: Proprietor }) {
  const first = firstTalkedBy(row);
  if (isLockActive(row)) {
    return (
      <p className="mt-2 text-xs font-semibold text-amber-700">
        {first ? `First talk: ${first} · ` : ""}
        {row.talking_by} is talking to this school
      </p>
    );
  }
  if (first || alreadyTalked(row.status)) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        {first ? `First talk: ${first}` : "First talk not saved"}
        {alreadyTalked(row.status) ? ` · Last: ${row.updated_by} · ${when(row.updated_at)}` : ""}
      </p>
    );
  }
  return <p className="mt-2 text-xs text-slate-500">Nobody has talked yet</p>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
      />
    </label>
  );
}
