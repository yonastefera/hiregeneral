import type { Metadata } from "next";

import { CompanyPage } from "@/employer/dashboard/company/CompanyPage";
import { getEmployerCompanyProfile } from "@/employer/dashboard/company/employer-company-data";

export const metadata: Metadata = {
  title: "Company Profile — HireGeneral",
  description: "Manage how candidates see your company brand on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerCompanyRoute() {
  const company = await getEmployerCompanyProfile();

  return <CompanyPage initialCompany={company} />;
}
