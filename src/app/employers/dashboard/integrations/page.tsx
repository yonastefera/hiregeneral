import type { Metadata } from "next";

import { IntegrationsPage } from "@/employer/dashboard/integrations/IntegrationsPage";
import { getEmployerCandidates } from "@/employer/dashboard/candidates/employer-candidates-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Integrations & exports — HireGeneral",
  description: "Export company hiring data for ATS and reporting workflows.",
};

export default async function EmployerIntegrationsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: membership }, data] = await Promise.all([
    user
      ? supabase
          .from("employer_team_members")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getEmployerCandidates({ limit: 1 }),
  ]);
  const canExport =
    membership?.role === "owner" || membership?.role === "admin";

  return <IntegrationsPage canExport={canExport} jobFilters={data.filters} />;
}
