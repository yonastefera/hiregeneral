import type { Metadata } from "next";

import { PublicContactPage } from "@/components/contact/PublicContactPage";

export const metadata: Metadata = {
  title: "Contact Us | HireGeneral",
  description:
    "Contact HireGeneral for job seeker support, employer hiring tools, billing, privacy, accessibility, and partnership questions.",
};

type ContactRouteProps = {
  searchParams?: Promise<{
    topic?: string;
  }>;
};

export default async function ContactRoute({
  searchParams,
}: ContactRouteProps) {
  const params = await searchParams;

  return <PublicContactPage initialTopic={params?.topic ?? null} />;
}
