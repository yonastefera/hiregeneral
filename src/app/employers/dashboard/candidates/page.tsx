import type { Metadata } from "next";

import { CandidatesPage } from "@/employer/dashboard/candidates/CandidatesPage";
import { getEmployerCandidates } from "@/employer/dashboard/candidates/employer-candidates-data";

export const metadata: Metadata = {
  title: "Candidates — HireGeneral",
  description: "Review and manage applicants for your active roles.",
};

export default async function EmployerCandidatesRoute() {
  const data = await getEmployerCandidates();

  return <CandidatesPage initialData={data} />;
}
