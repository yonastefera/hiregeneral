import type { Metadata } from "next";

import { DashboardShell } from "@/employer/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Employer Dashboard — HireGeneral",
  description: "Manage jobs, candidates, and your hiring pipeline.",
  robots: {
    index: false,
    follow: false,
  },
};

type EmployerDashboardLayoutProps = {
  children: React.ReactNode;
};

export default function EmployerDashboardLayout({
  children,
}: EmployerDashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
