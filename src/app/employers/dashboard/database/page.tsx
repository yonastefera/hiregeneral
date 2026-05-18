import type { Metadata } from "next";

import { DatabasePage } from "@/employer/dashboard/database/DatabasePage";

export const metadata: Metadata = {
  title: "Resume Database — HireGeneral",
  description:
    "Browse AI-matched candidates from the HireGeneral resume database.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerResumeDatabaseRoute() {
  return <DatabasePage />;
}
