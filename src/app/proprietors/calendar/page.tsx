import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { listAttendeesWithSeedBaseline } from "@/lib/store/attendees";
import { listProprietors } from "@/lib/store/proprietors";
import { InstallCalendar } from "./install-calendar";

export default async function InstallCalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [rows, attendees] = await Promise.all([
    listProprietors(),
    listAttendeesWithSeedBaseline(),
  ]);

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Install calendar"
        title="Free and booked days"
        description="If a school asks for a day, open this and see whether the team is free. Event bookings show whether they attended."
      />
      <InstallCalendar initial={rows} initialAttendees={attendees} />
    </AppShell>
  );
}
