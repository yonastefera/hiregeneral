import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 antialiased selection:bg-teal-200/60">
      <DashboardSidebar />

      <div className="lg:pl-58">
        <DashboardTopbar />

        <main className="px-5 pb-8 pt-2">{children}</main>
      </div>
    </div>
  );
}
