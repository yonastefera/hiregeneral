export type JobStatus = "Active" | "Draft" | "Closed";

export type EmployerJob = {
  title: string;
  posted: string;
  daysLive: number;
  views: number;
  applicants: number;
  status: JobStatus;
};

export type JobTab = "All" | JobStatus;

export const jobs: EmployerJob[] = [
  {
    title: "Senior Product Designer",
    posted: "May 2, 2026",
    daysLive: 15,
    views: 1840,
    applicants: 42,
    status: "Active",
  },
  {
    title: "Staff Backend Engineer",
    posted: "Apr 28, 2026",
    daysLive: 19,
    views: 2120,
    applicants: 31,
    status: "Active",
  },
  {
    title: "Growth Marketing Lead",
    posted: "—",
    daysLive: 0,
    views: 0,
    applicants: 0,
    status: "Draft",
  },
  {
    title: "Customer Success Manager",
    posted: "Apr 20, 2026",
    daysLive: 27,
    views: 980,
    applicants: 12,
    status: "Active",
  },
  {
    title: "Junior Data Analyst",
    posted: "Mar 10, 2026",
    daysLive: 68,
    views: 3110,
    applicants: 88,
    status: "Closed",
  },
];

export const jobTabs: JobTab[] = ["All", "Active", "Draft", "Closed"];
