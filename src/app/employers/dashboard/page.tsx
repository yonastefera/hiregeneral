import type { Metadata } from "next";

import { getEmployerDashboardData } from "@/employer/dashboard/overview/employer-dashboard-data";
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

export default async function EmployerDashboardPage() {
  const dashboardData = await getEmployerDashboardData();

  return <DashboardOverviewPage data={dashboardData} />;
}
