// src/app/(seekers)/profile/page.tsx

import type { Metadata } from "next";

import ProfilePage from "@/job-seekers/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | HireGeneral",
  description: "Manage your HireGeneral job seeker profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ProfilePage />;
}
