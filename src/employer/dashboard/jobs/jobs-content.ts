export type JobStatus = "Active" | "Draft" | "Closed";

export type EmployerJob = {
  id: string;
  slug: string | null;
  title: string;
  companyName: string;
  location: string;
  workMode: string;
  employmentType: string;
  posted: string;
  daysLive: number;
  views: number;
  applicants: number;
  status: JobStatus;
};

export type JobTab = "All" | JobStatus;

export const jobTabs: JobTab[] = ["All", "Active", "Draft", "Closed"];
