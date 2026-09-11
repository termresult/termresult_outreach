"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Pencil,
  Search,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import { EmptyState, StatCard } from "@/components/ui/ds";
import { FormSelect } from "@/components/ui/form-select";
import { filterAttendees, type AttendeeQuery } from "@/lib/attendees/query";
import { BRAND, hexToRgba } from "@/lib/color";
import {
  OPERATOR_NAMES,
  OPERATOR_STORAGE_KEY,
} from "@/types/proprietor";
import type {
  AttendanceStatus,
  Attendee,
  AttendeeInput,
} from "@/types/attendee";

type Totals = {
  all: number;
  attended: number;
  didNotAttend: number;
};

type FormState = {
  contact_name: string;
  school_name: string;
  phone: string;
  email: string;
  status: AttendanceStatus;
  transcription_notes: string;
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  attended: "Attended",
  did_not_attend: "Did not attend",
};

function formFromRow(row: Attendee): FormState {
  return {
    contact_name: row.contact_name ?? "",
    school_name: row.school_name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    status: row.status,
    transcription_notes: row.transcription_notes ?? "",
  };
}

function attendeeInput(form: FormState): AttendeeInput {
  return {
    contact_name: form.contact_name,
    school_name: form.school_name,
    phone: form.phone,
    email: form.email,
    status: form.status,
    transcription_notes: form.transcription_notes,
  };
}

export function AttendeesBoard({
  initialRows,
  initialTotals,
  query,
}: {
  initialRows: Attendee[];
  initialTotals: Totals;
  query: AttendeeQuery;
}) {
  const [rows, setRows] = useState(initialRows);
  const [totals, setTotals] = useState(initialTotals);
  const [editing, setEditing] = useState<Attendee | null>(null);

  function applySaved(attendee: Attendee, previousStatus: AttendanceStatus) {
    setRows((current) => {
      const updated = current.map((row) =>
        row.id === attendee.id ? attendee : row,
      );
      return filterAttendees(updated, query);
    });
    if (attendee.status !== previousStatus) {
      setTotals((current) => ({
        ...current,
        attended:
          current.attended + (attendee.status === "attended" ? 1 : -1),
        didNotAttend:
          current.didNotAttend +
          (attendee.status === "did_not_attend" ? 1 : -1),
      }));
    }
    setEditing(null);
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          value={String(totals.all)}
          label="All schools"
          hint="Every transcribed event record"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          value={String(totals.attended)}
          label="Attended"
          hint="Schools with event attendance"
        />
        <StatCard
          icon={<UserRoundX className="h-4 w-4" />}
          value={String(totals.didNotAttend)}
          label="Did not attend"
          hint="Registered schools not present"
        />
      </div>

      <form
        method="get"
        className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label>
            <span className="sr-only">Search attendees</span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                name="q"
                defaultValue={query.q}
                placeholder="Search school, contact, phone, or email"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </span>
          </label>
          <label>
            <span className="sr-only">Attendance status</span>
            <FormSelect name="status" defaultValue={query.status}>
              <option value="">All attendance</option>
              <option value="attended">Attended</option>
              <option value="did_not_attend">Did not attend</option>
            </FormSelect>
          </label>
          <button
            type="submit"
            className="h-10 rounded-full px-5 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: BRAND }}
          >
            Apply filters
          </button>
        </div>
        {query.q || query.status ? (
          <Link
            href="/attendees"
            className="mt-3 inline-flex text-sm font-semibold"
            style={{ color: BRAND }}
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        Showing {rows.length} of {totals.all} schools.
      </p>

      {totals.all === 0 ? (
        <EmptyState
          icon={<Users className="h-4 w-4" />}
          title="No attendees yet"
          description="Seed the reviewed event sheets to add attendee records."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Search className="h-4 w-4" />}
          title="No matches"
          description="Try a different search or attendance filter."
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
            {rows.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {row.school_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.contact_name || "Contact name not provided"}
                    </p>
                  </div>
                  <AttendanceBadge status={row.status} />
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <Detail label="Phone" value={row.phone} />
                  <Detail label="Email" value={row.email} />
                </dl>
                {row.transcription_notes ? (
                  <VerificationNote notes={row.transcription_notes} />
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
                  aria-label={`Edit ${row.school_name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit details
                </button>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm md:block">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["School", "Contact", "Phone", "Email", "Attendance", "Verification", ""].map(
                    (label, index) => (
                      <th
                        key={`${label}-${index}`}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        {label || <span className="sr-only">Actions</span>}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.school_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.contact_name || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.phone || "Not provided"}
                    </td>
                    <td className="max-w-52 break-words px-4 py-3 text-slate-600">
                      {row.email || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={row.status} />
                    </td>
                    <td className="max-w-72 px-4 py-3 text-slate-600">
                      {row.transcription_notes ? (
                        <VerificationNote notes={row.transcription_notes} compact />
                      ) : (
                        <span className="text-slate-400">No note</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm"
                        aria-label={`Edit ${row.school_name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing ? (
        <EditAttendeeDialog
          key={editing.id}
          attendee={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => applySaved(saved, editing.status)}
        />
      ) : null}
    </div>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const attended = status === "attended";
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={
        attended
          ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
          : { backgroundColor: "#FFF7ED", color: "#C2410C" }
      }
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[52px_1fr] gap-2">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words text-slate-600">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

function VerificationNote({
  notes,
  compact = false,
}: {
  notes: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex items-start gap-2 text-xs leading-relaxed text-amber-800"
          : "mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900"
      }
      role="note"
      aria-label="Transcription verification note"
    >
      <FileWarning
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      />
      <span>{notes}</span>
    </div>
  );
}

function EditAttendeeDialog({
  attendee,
  onClose,
  onSaved,
}: {
  attendee: Attendee;
  onClose: () => void;
  onSaved: (attendee: Attendee) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [form, setForm] = useState(() => formFromRow(attendee));
  const [operator, setOperator] = useState(() => {
    const saved = window.localStorage.getItem(OPERATOR_STORAGE_KEY) ?? "";
    return (OPERATOR_NAMES as readonly string[]).includes(saved) ? saved : "";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!operator) {
      setError("Choose who is saving this correction.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/attendees/${encodeURIComponent(attendee.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...attendeeInput(form),
            operator_name: operator,
          }),
        },
      );
      const data = (await response.json()) as {
        attendee?: Attendee;
        error?: string;
      };
      if (!response.ok || !data.attendee) {
        setError(data.error ?? "Could not save attendee details.");
        return;
      }
      window.localStorage.setItem(OPERATOR_STORAGE_KEY, operator);
      onSaved(data.attendee);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="fixed inset-0 m-0 ml-auto h-full max-h-none w-full max-w-lg overflow-hidden border-0 bg-white p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] backdrop:bg-slate-900/20"
    >
      <form onSubmit={save} className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Edit attendee
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-bold text-slate-900">
              {attendee.school_name}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-slate-500">
              Correct the transcription or attendance status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Close attendee editor</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          ) : null}
          <Field
            label="Contact name"
            value={form.contact_name}
            autoFocus
            onChange={(contact_name) => setForm({ ...form, contact_name })}
          />
          <Field
            label="School name"
            value={form.school_name}
            required
            onChange={(school_name) => setForm({ ...form, school_name })}
          />
          <Field
            label="Phone"
            value={form.phone}
            inputMode="tel"
            onChange={(phone) => setForm({ ...form, phone })}
          />
          <Field
            label="Email"
            value={form.email}
            inputMode="email"
            onChange={(email) => setForm({ ...form, email })}
          />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Attendance status
            </span>
            <FormSelect
              className="mt-1"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as AttendanceStatus,
                })
              }
            >
              <option value="attended">Attended</option>
              <option value="did_not_attend">Did not attend</option>
            </FormSelect>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Transcription verification notes
            </span>
            <textarea
              value={form.transcription_notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  transcription_notes: event.target.value,
                })
              }
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Record unclear or cropped source details"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Saved by
            </span>
            <FormSelect
              className="mt-1"
              value={operator}
              required
              onChange={(event) => setOperator(event.target.value)}
            >
              <option value="">Choose your name</option>
              {OPERATOR_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </FormSelect>
          </label>
          <p className="text-xs leading-relaxed text-slate-500">
            Phone and email text is sent exactly as entered. The server only
            trims surrounding spaces and lowercases email.
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 flex-1 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-11 flex-1 rounded-full text-sm font-semibold text-white shadow-sm disabled:cursor-wait disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  inputMode,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputMode?: "email" | "tel";
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        required={required}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}
