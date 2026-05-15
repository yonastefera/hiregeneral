import type { Metadata } from "next";

import MessagesPage from "@/job-seekers/messages/MessagesPage";

export const metadata: Metadata = {
  title: "Messages | HireGeneral",
  description:
    "View and reply to your HireGeneral conversations with employers and candidates.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MessagesPageRoute() {
  return <MessagesPage />;
}
