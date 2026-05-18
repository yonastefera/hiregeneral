import type { Metadata } from "next";

import { CandidatesPage } from "@/employer/dashboard/candidates/CandidatesPage";

export const metadata: Metadata = {
  title: "Candidates — HireGeneral",
  description: "Review and manage applicants for your active roles.",
};

export default function EmployerCandidatesRoute() {
  return <CandidatesPage />;
}
