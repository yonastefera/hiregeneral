import type { Metadata } from "next";

import { MessagesPage } from "@/employer/dashboard/messages/MessagesPage";

export const metadata: Metadata = {
  title: "Messages — HireGeneral",
  description: "Message candidates and manage employer conversations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerMessagesRoute() {
  return <MessagesPage />;
}
