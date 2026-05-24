import type { Metadata } from "next";
import WhyUsPage from "@/why-us/WhyUsPage";

export const metadata: Metadata = {
  title: "Why HireGeneral — A calmer way to hire",
  description:
    "A modern hiring stack built for craft, calm, and outcomes. See why thousands of teams choose HireGeneral over noisy job boards.",
  openGraph: {
    title: "Why HireGeneral",
    description:
      "A calmer hiring marketplace — vetted candidates, predictive ranking, AI co-pilot. Built for modern teams.",
  },
};

export default function Page() {
  return <WhyUsPage />;
}
