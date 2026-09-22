"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Pencil,
  Phone,
  Search,
  Star,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import { requestRemind } from "@/lib/reminders/open";
import { EmptyState, StatCard } from "@/components/ui/ds";
import { FormSelect } from "@/components/ui/form-select";
import {
  attendeePatchFailure,
  decodeAttendeePatchResponse,
} from "@/lib/attendees/client-response";
import { filterAttendees, type AttendeeQuery } from "@/lib/attendees/query";
import { BRAND, hexToRgba } from "@/lib/color";
import {
  bookingFromAttendee,
  type CalendarBooking,
} from "@/lib/proprietors/calendar-bookings";
import { formatInstallDay } from "@/lib/proprietors/install-date";
import { InstallDateField } from "@/app/proprietors/install-date-field";
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
  notContacted: number;
  priority: number;
};

type EditingState = {
  attendee: Attendee;
  trigger: HTMLButtonElement | null;
};

type FormState = {
  contact_name: string;
  school_name: string;
  phone: string;
  email: string;
  status: AttendanceStatus;
  transcription_notes: string;
  contacted: boolean;
  priority: boolean;
  install_date: string;
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
    contacted: row.contacted,
    priority: row.priority,
    install_date: row.install_date ?? "",
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
    contacted: form.contacted,
    priority: form.priority,
    install_date: form.install_date || null,
  };
}

export function AttendeesBoard({
  initialRows,
  initialTotals,
  query,
  openId = null,
  proprietorBookings,
}: {
  initialRows: Attendee[];
  initialTotals: Totals;
  query: AttendeeQuery;
  openId?: string | null;
  proprietorBookings: CalendarBooking[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [totals, setTotals] = useState(initialTotals);
  const [liveQuery, setLiveQuery] = useState(query);
  const visible = useMemo(() => filterAttendees(rows, liveQuery), [rows, liveQuery]);

  function applyFilters(next: AttendeeQuery) {
    setLiveQuery(next);
    const params = new URLSearchParams();
    const q = next.q?.trim() ?? "";
    if (q) params.set("q", q);
    if (next.status) params.set("status", next.status);
    if (next.outreach) params.set("outreach", next.outreach);
    if (next.flag) params.set("flag", next.flag);
    if (openId) params.set("open", openId);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `/attendees?${search}` : "/attendees");
  }
  const opened = openId ? initialRows.find((row) => row.id === openId) ?? null : null;
  const [editing, setEditing] = useState<EditingState | null>(
    opened ? { attendee: opened, trigger: null } : null,
  );

  function openEditor(
    attendee: Attendee,
    trigger: HTMLButtonElement,
  ) {
    setEditing({ attendee, trigger });
  }

  function applySaved(attendee: Attendee, previous: Attendee) {
    setRows((current) => {
      const updated = current.map((row) =>
        row.id === attendee.id ? attendee : row,
      );
      return updated;
    });
    setTotals((current) => ({
      ...current,
      attended:
        current.attended +
        (attendee.status === "attended" ? 1 : 0) -
        (previous.status === "attended" ? 1 : 0),
      didNotAttend:
        current.didNotAttend +
        (attendee.status === "did_not_attend" ? 1 : 0) -
        (previous.status === "did_not_attend" ? 1 : 0),
      notContacted:
        current.notContacted +
        (attendee.contacted ? 0 : 1) -
        (previous.contacted ? 0 : 1),
      priority:
        current.priority +
        (attendee.priority ? 1 : 0) -
        (previous.priority ? 1 : 0),
    }));
    setEditing(null);
  }

  const installBookings = [
    ...proprietorBookings,
    ...rows.flatMap((row) => {
      const booking = bookingFromAttendee(row);
      return booking ? [booking] : [];
    }),
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        <StatCard
          icon={<Phone className="h-4 w-4" />}
          value={String(totals.notContacted)}
          label="Not contacted"
          hint="Still waiting for a first call"
        />
        <StatCard
          icon={<Star className="h-4 w-4" />}
          value={String(totals.priority)}
          label="Priority"
          hint="Schools to follow first"
        />
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <label>
            <span className="sr-only">Search attendees</span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                name="q"
                value={liveQuery.q ?? ""}
                onChange={(event) => applyFilters({ ...liveQuery, q: event.target.value })}
                placeholder="Search school, contact, phone, or email"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </span>
          </label>
          <label>
            <span className="sr-only">Attendance status</span>
            <FormSelect
              name="status"
              value={liveQuery.status ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...liveQuery,
                  status: event.target.value as AttendeeQuery["status"],
                })
              }
            >
              <option value="">All attendance</option>
              <option value="attended">Attended</option>
              <option value="did_not_attend">Did not attend</option>
            </FormSelect>
          </label>
          <label>
            <span className="sr-only">Contacted</span>
            <FormSelect
              name="outreach"
              value={liveQuery.outreach ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...liveQuery,
                  outreach: event.target.value as AttendeeQuery["outreach"],
                })
              }
            >
              <option value="">All follow-up</option>
              <option value="not_contacted">Not contacted</option>
              <option value="contacted">Contacted</option>
            </FormSelect>
          </label>
          <label>
            <span className="sr-only">Priority and install</span>
            <FormSelect
              name="flag"
              value={liveQuery.flag ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...liveQuery,
                  flag: event.target.value as AttendeeQuery["flag"],
                })
              }
            >
              <option value="">All flags</option>
              <option value="priority">Priority</option>
              <option value="booked">Install booked</option>
              <option value="unbooked">No install date</option>
            </FormSelect>
          </label>
        </div>
        {liveQuery.q || liveQuery.status || liveQuery.outreach || liveQuery.flag ? (
          <button
            type="button"
            onClick={() => applyFilters({ q: "", status: "", outreach: "", flag: "" })}
            className="mt-3 inline-flex text-sm font-semibold"
            style={{ color: BRAND }}
          >
            Clear filters
          </button>
        ) : null}
      </form>

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        Showing {visible.length} of {totals.all} schools.
      </p>

      {totals.all === 0 ? (
        <EmptyState
          icon={<Users className="h-4 w-4" />}
          title="No attendees yet"
          description="Seed the reviewed event sheets to add attendee records."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Search className="h-4 w-4" />}
          title="No matches"
          description="Try a different search or attendance filter."
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
            {visible.map((row, index) => (
              <article
                key={row.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {index + 1}. {row.school_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.contact_name || "Contact name not provided"}
                    </p>
                  </div>
                  <AttendanceBadge status={row.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <OutreachBadge contacted={row.contacted} />
                  {row.priority ? <PriorityBadge /> : null}
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <Detail label="Phone" value={row.phone} />
                  <Detail label="Email" value={row.email} />
                </dl>
                {row.install_date ? (
                  <p className="mt-2 text-sm font-semibold" style={{ color: BRAND }}>
                    Install {formatInstallDay(row.install_date)}
                    {row.install_booked_by ? ` · ${row.install_booked_by}` : ""}
                  </p>
                ) : null}
                {row.transcription_notes ? (
                  <VerificationNote notes={row.transcription_notes} />
                ) : null}
                <button
                  type="button"
                  onClick={(event) => openEditor(row, event.currentTarget)}
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
                  {["#", "School", "Contact", "Phone", "Follow-up", "Attendance", "Install", ""].map(
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
                {visible.map((row, index) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/50">
                    <td className="w-12 px-4 py-3 tabular-nums text-slate-500">
                      {index + 1}.
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.school_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.contact_name || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.phone || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <OutreachBadge contacted={row.contacted} />
                        {row.priority ? <PriorityBadge /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.install_date
                        ? `${formatInstallDay(row.install_date)}${row.install_booked_by ? ` · ${row.install_booked_by}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => openEditor(row, event.currentTarget)}
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
          key={editing.attendee.id}
          attendee={editing.attendee}
          returnFocusTo={editing.trigger}
          bookings={installBookings}
          onClose={() => setEditing(null)}
          onSaved={(saved) => applySaved(saved, editing.attendee)}
        />
      ) : null}
    </div>
  );
}

function OutreachBadge({ contacted }: { contacted: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={
        contacted
          ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
          : { backgroundColor: "#FFF7ED", color: "#C2410C" }
      }
    >
      {contacted ? "Contacted" : "Not contacted"}
    </span>
  );
}

function PriorityBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
      Priority
    </span>
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

function readSavedOperator(): string {
  try {
    const saved = window.localStorage.getItem(OPERATOR_STORAGE_KEY) ?? "";
    return (OPERATOR_NAMES as readonly string[]).includes(saved) ? saved : "";
  } catch {
    return "";
  }
}

function rememberOperator(operator: string): void {
  try {
    window.localStorage.setItem(OPERATOR_STORAGE_KEY, operator);
  } catch {
    // Saving the attendee succeeded; browser storage is only a convenience.
  }
}

function EditAttendeeDialog({
  attendee,
  returnFocusTo,
  bookings,
  onClose,
  onSaved,
}: {
  attendee: Attendee;
  returnFocusTo: HTMLButtonElement | null;
  bookings: CalendarBooking[];
  onClose: () => void;
  onSaved: (attendee: Attendee) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mountedRef = useRef(false);
  const closingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [form, setForm] = useState(() => formFromRow(attendee));
  const [operator, setOperator] = useState(readSavedOperator);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      if (dialog?.open) dialog.close();
      returnFocusTo?.focus();
    };
  }, [returnFocusTo]);

  function dismiss(saved?: Attendee) {
    if (closingRef.current) return;
    closingRef.current = true;

    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    returnFocusTo?.focus();

    if (saved) onSaved(saved);
    else onClose();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!operator) {
      setError("Choose who is saving this correction.");
      return;
    }

    setBusy(true);
    setError(null);
    const controller = new AbortController();
    requestRef.current = controller;
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
          signal: controller.signal,
        },
      );
      const payload = await decodeAttendeePatchResponse(response);
      if (!mountedRef.current) return;

      const failure = attendeePatchFailure(response.ok, payload);
      if (failure) {
        setError(failure);
        return;
      }
      rememberOperator(operator);
      dismiss(payload!.attendee!);
    } catch {
      if (mountedRef.current) {
        setError("Could not reach the server. Try again.");
      }
    } finally {
      requestRef.current = null;
      if (mountedRef.current && !closingRef.current) setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) dismiss();
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
              Mark contact, star a priority, and book an install day.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss()}
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
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.contacted}
              onChange={(event) =>
                setForm({ ...form, contacted: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-900">Contacted</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Priority
            </span>
          </label>
          <InstallDateField
            value={form.install_date}
            ownerId={attendee.id}
            bookings={bookings}
            onChange={(install_date) => setForm({ ...form, install_date })}
          />
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

        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              requestRemind({
                school_id: attendee.id,
                school_name: form.school_name || attendee.school_name,
                school_source: "attendee",
                phone: form.phone || attendee.phone,
              });
              dismiss();
            }}
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            Remind me
          </button>
          <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dismiss()}
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
