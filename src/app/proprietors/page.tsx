import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { bookingFromAttendee } from "@/lib/proprietors/calendar-bookings";
import { listAttendeesWithSeedBaseline } from "@/lib/store/attendees";
import { listProprietors } from "@/lib/store/proprietors";
import { ProprietorsBoard } from "./proprietors-board";

export default async function ProprietorsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { open } = await searchParams;
  const [rows, attendees] = await Promise.all([
    listProprietors(),
    listAttendeesWithSeedBaseline(),
  ]);

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Proprietors"
        title="School conversations"
        description="Type a school when you talk to them. If someone else already did, you will see it here."
      />
      <ProprietorsBoard
        initial={rows}
        openId={open ?? null}
        initialAttendeeBookings={attendees.flatMap((row) => {
          const booking = bookingFromAttendee(row);
          return booking ? [booking] : [];
        })}
      />
    </AppShell>
  );
}
