import { LazyToaster } from "@/components/providers/LazyToaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LazyToaster />
    </>
  );
}
