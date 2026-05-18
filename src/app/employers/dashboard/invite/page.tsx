import type { Metadata } from "next";

import { InvitePage } from "@/employer/dashboard/invite/InvitePage";

export const metadata: Metadata = {
  title: "Invite to Apply — HireGeneral",
  description:
    "Invite recommended candidates to apply to your open roles on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerInviteRoute() {
  return <InvitePage />;
}
