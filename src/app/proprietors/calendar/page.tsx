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
        title="One school a day"
        description="When a school is free, book that day. The rest of the team cannot take it."
      />
      <InstallCalendar initial={rows} />
    </AppShell>
  );
}
