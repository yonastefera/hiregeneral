"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function HeaderSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error("Unable to sign out. Please try again.");
      return;
    }

    toast.success("Signed out.");

    router.replace("/jobs");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
