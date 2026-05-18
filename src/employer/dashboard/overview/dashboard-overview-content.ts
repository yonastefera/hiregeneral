import { Briefcase, Eye, FileText, Users } from "lucide-react";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  changeTone: "positive" | "negative";
  icon: typeof Briefcase;
};

export type CurrentRole = {
  title: string;
  meta: string;
  applicants: number;
  status: "Active" | "Draft";
};

export type RecentActivity = {
  name: string;
  description: string;
  time: string;
};

export const dashboardStats: DashboardStat[] = [
  {
    label: "Published jobs",
    value: "12",
    change: "+12%",
    changeTone: "positive",
    icon: Briefcase,
  },
  {
    label: "Draft jobs",
    value: "3",
    change: "+4%",
    changeTone: "positive",
    icon: FileText,
  },
  {
    label: "Applications",
    value: "248",
    change: "+18%",
    changeTone: "positive",
    icon: Users,
  },
  {
    label: "Profile views",
    value: "1,842",
    change: "-2%",
    changeTone: "negative",
    icon: Eye,
  },
];

export const currentRoles: CurrentRole[] = [
  {
    title: "Senior Product Designer",
    meta: "Design · Remote · US",
    applicants: 42,
    status: "Active",
  },
  {
    title: "Staff Backend Engineer",
    meta: "Engineering · New York, NY",
    applicants: 31,
    status: "Active",
  },
  {
    title: "Growth Marketing Lead",
    meta: "Marketing · Hybrid · Austin",
    applicants: 18,
    status: "Draft",
  },
  {
    title: "Customer Success Manager",
    meta: "Sales · Remote",
    applicants: 12,
    status: "Active",
  },
];

export const recentActivity: RecentActivity[] = [
  {
    name: "Maya Chen",
    description: "applied to Senior Product Designer",
    time: "2m ago",
  },
  {
    name: "Daniel Okafor",
    description: "accepted your interview invite",
    time: "1h ago",
  },
  {
    name: "Priya Subramaniam",
    description: "viewed your company profile",
    time: "3h ago",
  },
  {
    name: "Lucas Romero",
    description: "applied to Growth Marketing Lead",
    time: "Yesterday",
  },
];
