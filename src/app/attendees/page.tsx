import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { parseAttendeeQuery } from "@/lib/attendees/query";
import { bookingFromProprietor } from "@/lib/proprietors/calendar-bookings";
import { listAttendeesWithSeedBaseline } from "@/lib/store/attendees";
import { listProprietors } from "@/lib/store/proprietors";
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
  const [all, proprietors] = await Promise.all([
    listAttendeesWithSeedBaseline(),
    listProprietors(),
  ]);
  const totals = {
    all: all.length,
    attended: all.filter((row) => row.status === "attended").length,
    didNotAttend: all.filter((row) => row.status === "did_not_attend").length,
    notContacted: all.filter((row) => !row.contacted).length,
    priority: all.filter((row) => row.priority).length,
  };
  const openId = typeof raw.open === "string" ? raw.open : null;

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Event register"
        title="Attendees"
        description="Contact every school from the event, mark who you have reached, star the priorities, and book their install day."
      />

      <AttendeesBoard
        key={openId ?? "attendees"}
        initialRows={all}
        initialTotals={totals}
        query={query}
        openId={openId}
        proprietorBookings={proprietors.flatMap((row) => {
          const booking = bookingFromProprietor(row);
          return booking ? [booking] : [];
        })}
      />
    </AppShell>
  );
}
