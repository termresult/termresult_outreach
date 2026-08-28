import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { listProprietors } from "@/lib/store/proprietors";
import { ProprietorsBoard } from "./proprietors-board";

export default async function ProprietorsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const rows = await listProprietors();

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Proprietors"
        title="School conversations"
        description="Type a school when you talk to them. If someone else already did, you will see it here."
      />
      <ProprietorsBoard initial={rows} />
    </AppShell>
  );
}
