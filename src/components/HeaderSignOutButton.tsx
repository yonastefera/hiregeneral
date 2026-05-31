"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export function HeaderSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out.");
      }

      void showSuccessToast("Signed out.");

      router.push("/");
      router.refresh();
    } catch {
      void showErrorToast("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="justify-start gap-2"
    >
      <LogOut aria-hidden="true" className="size-4" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
