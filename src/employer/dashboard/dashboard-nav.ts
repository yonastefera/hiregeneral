import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CreditCard,
  Database,
  LayoutDashboard,
  MessageSquare,
  PlusSquare,
  Send,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "",
    items: [
      {
        href: "/employers/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Hiring",
    items: [
      {
        href: "/employers/dashboard/post-job",
        label: "Post a job",
        icon: PlusSquare,
      },
      {
        href: "/employers/dashboard/jobs",
        label: "Jobs",
        icon: Briefcase,
      },
      {
        href: "/employers/dashboard/candidates",
        label: "Candidates",
        icon: Users,
      },
      {
        href: "/employers/dashboard/invite",
        label: "Invite to apply",
        icon: Send,
      },
      {
        href: "/employers/dashboard/database",
        label: "Resume database",
        icon: Database,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/employers/dashboard/messages",
        label: "Messages",
        icon: MessageSquare,
      },
      {
        href: "/employers/dashboard/company",
        label: "Company profile",
        icon: Building2,
      },
      {
        href: "/employers/dashboard/subscription",
        label: "Subscription",
        icon: CreditCard,
      },
    ],
  },
];
