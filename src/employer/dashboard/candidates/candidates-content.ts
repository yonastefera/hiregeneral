export type CandidateStatus = "New" | "Reviewed" | "Interview";

export type Candidate = {
  id: string;
  name: string;
  role: string;
  job: string;
  jobId: string;
  location: string;
  experience: string;
  applied: string;
  status: CandidateStatus;
  match: number | null;
  email: string | null;
  resumeUrl: string | null;
};

export type CandidateJobFilter = {
  label: string;
  value: string;
};

export type EmployerCandidatesData = {
  candidates: Candidate[];
  filters: CandidateJobFilter[];
};
