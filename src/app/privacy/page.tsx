import type { Metadata } from "next";

import LegalDocumentPage from "@/legal/LegalDocumentPage";
import { privacyPolicyContent } from "@/legal/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy | HireGeneral",
  description:
    "Read HireGeneral's Privacy Policy for job seekers, employers, recruiters, and visitors.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyPolicyContent} />;
}
