import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { listProprietors } from "@/lib/store/proprietors";
import { InstallCalendar } from "./install-calendar";

export default async function InstallCalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const rows = await listProprietors();

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Install calendar"
        title="Free and booked days"
        description="If a school asks for a day, open this and see whether the team is free."
      />
      <InstallCalendar initial={rows} />
    </AppShell>
  );
}
