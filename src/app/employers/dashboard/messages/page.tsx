import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getEmployerMessagesData } from "@/employer/dashboard/messages/employer-messages-data";
import { MessagesPage } from "@/employer/dashboard/messages/MessagesPage";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const metadata: Metadata = {
  title: "Messages — HireGeneral",
  description: "Message candidates and manage employer conversations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerMessagesRoute() {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    redirect("/signin?next=/employers/dashboard/messages");
  }

  const initialData = await getEmployerMessagesData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
  });

  return <MessagesPage initialData={initialData} />;
}
