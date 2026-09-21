import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ReminderPanel } from "@/components/reminder-panel";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";

export default async function RemindersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Reminders"
        title="Call them back"
        description="Pick a school, a time, and what you need to do — call back or anything else."
      />
      <div className="max-w-xl">
        <ReminderPanel />
      </div>
    </AppShell>
  );
}
