import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { listContacts } from "@/lib/store/contacts";
import { CampaignForm } from "./campaign-form";

export default async function NewCampaignPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const areas = [
    ...new Set(listContacts().map((c) => c.area).filter((area): area is string => Boolean(area))),
  ].sort();

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Campaigns"
        title="New campaign"
        description="Pick a channel, write the message, then queue it. Providers are not connected, so nobody is contacted."
      />
      <CampaignForm areas={areas} />
    </AppShell>
  );
}
