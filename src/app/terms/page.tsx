import type { Metadata } from "next";

import LegalDocumentPage from "@/legal/LegalDocumentPage";
import { termsContent } from "@/legal/legal-content";

export const metadata: Metadata = {
  title: "Terms & Conditions | HireGeneral",
  description:
    "Read HireGeneral's Terms & Conditions for using the job marketplace, employer tools, and candidate services.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsContent} />;
}
