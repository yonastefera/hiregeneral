"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Sonner />
    </>
  );
}
