export type CandidateStatus =
  | "submitted"
  | "reviewing"
  | "interview"
  | "offer"
  | "rejected";

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
  pipelineStageId: string | null;
};

export type CandidatePipelineStage = {
  id: string | null;
  name: string;
  position: number;
  applicationStatus: Exclude<CandidateStatus, "submitted">;
};

export type CandidateJobFilter = {
  label: string;
  value: string;
};

export type EmployerCandidatesData = {
  candidates: Candidate[];
  filters: CandidateJobFilter[];
  pipelineStages: CandidatePipelineStage[];
};
