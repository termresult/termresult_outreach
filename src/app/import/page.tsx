import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Import"
        title="Bring in the school list"
        description="Upload the scrape we already have. This updates names and numbers. It does not delete send history, and it does not message anyone."
      />
      <ImportForm />
    </AppShell>
  );
}
