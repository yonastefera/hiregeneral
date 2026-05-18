import type { Metadata } from "next";

import { DashboardOverviewPage } from "@/employer/dashboard/overview/DashboardOverviewPage";

export const metadata: Metadata = {
  title: "Dashboard — HireGeneral",
  description:
    "View your employer dashboard, job posts, candidates, and hiring activity.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerDashboardPage() {
  return <DashboardOverviewPage />;
}
