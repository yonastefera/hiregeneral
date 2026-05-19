import { Briefcase } from "lucide-react";

export type DashboardStat = {
  label: string;
  value: string;
  change?: string;
  changeTone?: "positive" | "negative";
  icon: typeof Briefcase;
};

export type CurrentRole = {
  id: string;
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
