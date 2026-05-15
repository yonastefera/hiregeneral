import type { Metadata } from "next";

import NotificationSettings from "@/job-seekers/settings/notifications/NotificationSettings";

export const metadata: Metadata = {
  title: "Notification Settings | HireGeneral",
  description:
    "Manage your HireGeneral email notification preferences and job alert settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsPage() {
  return <NotificationSettings />;
}
