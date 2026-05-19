import type { Metadata } from "next";

import { getEmployerResumeDatabaseData } from "@/employer/dashboard/database/employer-resume-database-data";
import { DatabasePage } from "@/employer/dashboard/database/DatabasePage";

export const metadata: Metadata = {
  title: "Resume Database — HireGeneral",
  description:
    "Browse skill-ranked candidates from the HireGeneral resume database.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerResumeDatabaseRoute() {
  const initialData = await getEmployerResumeDatabaseData();

  return <DatabasePage initialData={initialData} />;
}
