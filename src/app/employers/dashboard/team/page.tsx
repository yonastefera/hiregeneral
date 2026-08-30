import type { Metadata } from "next";

import { TeamPage } from "@/employer/dashboard/team/TeamPage";

export const metadata: Metadata = {
  title: "Hiring Team — HireGeneral",
  robots: { index: false, follow: false },
};

export default function EmployerTeamRoute() {
  return <TeamPage />;
}
