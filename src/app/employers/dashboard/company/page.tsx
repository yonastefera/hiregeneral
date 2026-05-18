import type { Metadata } from "next";

import { CompanyPage } from "@/employer/dashboard/company/CompanyPage";

export const metadata: Metadata = {
  title: "Company Profile — HireGeneral",
  description: "Manage how candidates see your company brand on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerCompanyRoute() {
  return <CompanyPage />;
}
