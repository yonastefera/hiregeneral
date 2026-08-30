import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CareerInsightsPage } from "@/job-seekers/career-insights/CareerInsightsPage";
import { getCareerInsightsData } from "@/job-seekers/career-insights/career-insights-data";

export const metadata: Metadata = {
  title: "Career insights | HireGeneral",
  description: "Private career timeline, skill, and sourced salary insights.",
  robots: { index: false, follow: false },
};

export default async function CareerInsightsRoute() {
  const data = await getCareerInsightsData();
  if (!data) redirect("/signin?next=/career-insights");
  return <CareerInsightsPage data={data} />;
}
