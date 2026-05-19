import type { Metadata } from "next";

import { getEmployerInviteData } from "@/employer/dashboard/invite/employer-invite-data";
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

export default async function EmployerInviteRoute() {
  const data = await getEmployerInviteData();

  return <InvitePage initialData={data} />;
}
