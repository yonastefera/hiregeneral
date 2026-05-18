export type CandidateStatus = "New" | "Reviewed" | "Interview";

export type Candidate = {
  name: string;
  role: string;
  job: string;
  location: string;
  experience: string;
  applied: string;
  status: CandidateStatus;
  match: number;
};

export const candidates: Candidate[] = [
  {
    name: "Maya Chen",
    role: "Senior Product Designer",
    job: "Senior Product Designer",
    location: "San Francisco, CA",
    experience: "8 yrs",
    applied: "2d ago",
    status: "New",
    match: 96,
  },
  {
    name: "Daniel Okafor",
    role: "Staff Engineer",
    job: "Staff Backend Engineer",
    location: "Remote · US",
    experience: "11 yrs",
    applied: "3d ago",
    status: "Reviewed",
    match: 92,
  },
  {
    name: "Priya Subramaniam",
    role: "Product Designer",
    job: "Senior Product Designer",
    location: "Austin, TX",
    experience: "6 yrs",
    applied: "5d ago",
    status: "Interview",
    match: 88,
  },
  {
    name: "Lucas Romero",
    role: "Growth Marketer",
    job: "Growth Marketing Lead",
    location: "New York, NY",
    experience: "7 yrs",
    applied: "1w ago",
    status: "New",
    match: 84,
  },
  {
    name: "Amelia Foster",
    role: "CSM",
    job: "Customer Success Manager",
    location: "Remote",
    experience: "5 yrs",
    applied: "1w ago",
    status: "Reviewed",
    match: 80,
  },
];

export const candidateJobFilters = [
  "All jobs",
  "Senior Product Designer",
  "Staff Backend Engineer",
  "Growth Marketing Lead",
] as const;
