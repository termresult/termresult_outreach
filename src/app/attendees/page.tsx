import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { filterAttendees, parseAttendeeQuery } from "@/lib/attendees/query";
import { listAttendeesWithSeedBaseline } from "@/lib/store/attendees";
import { AttendeesBoard } from "./attendees-board";

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const query = parseAttendeeQuery(
    new URLSearchParams(
      Object.entries(raw).flatMap(([key, value]) =>
        typeof value === "string" ? [[key, value]] : [],
      ),
    ),
  );
  const all = await listAttendeesWithSeedBaseline();
  const rows = filterAttendees(all, query);
  const totals = {
    all: all.length,
    attended: all.filter((row) => row.status === "attended").length,
    didNotAttend: all.filter((row) => row.status === "did_not_attend").length,
  };

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Event register"
        title="Attendees"
        description="Review the event sheets, verify uncertain transcriptions, and keep each school’s attendance details current."
      />

      <AttendeesBoard
        key={`${query.q ?? ""}:${query.status ?? ""}`}
        initialRows={rows}
        initialTotals={totals}
        query={query}
      />
    </AppShell>
  );
}
