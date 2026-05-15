import type { Metadata } from "next";

import AccountSettings from "@/job-seekers/account/settings/AccountSettings";

export const metadata: Metadata = {
  title: "Account Settings | HireGeneral",
  description:
    "Manage your HireGeneral account, notifications, privacy, and deletion preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountSettingsPage() {
  return <AccountSettings />;
}
