export type ResumeExperience = {
  company: string;
  role: string;
  period: string;
  location: string | null;
  bullets: string[];
};

export type ResumeEducation = {
  school: string;
  degree: string;
  period: string;
  description: string | null;
};

export type ResumeProfileLink = {
  label: string;
  url: string;
};

export type ResumeMatch = {
  id: string;
  profileUserId: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  match: number;
  openToOffers: boolean;
  email: string | null;
  phone: string | null;
  summary: string;
  resumeUrl: string | null;
  resumeViewUrl: string | null;
  resumeFileName: string | null;
  resumeUploadedAt: string | null;
  invited: boolean;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  links: ResumeProfileLink[];
  levelOfExperience: string | null;
  highestDegree: string | null;
  industry: string | null;
  minimumDesiredPay: string | null;
  openToRelocation: boolean;
};

export type ResumeJobOption = {
  id: string;
  title: string;
};

export type ResumeDatabaseData = {
  jobs: ResumeJobOption[];
  selectedJobId: string | null;
  candidates: ResumeMatch[];
  totalCandidates: number;
};

export const defaultResumeInviteMessage =
  "Hi — your profile looks like a strong fit for one of our open roles on HireGeneral. I would love for you to review it and apply if it feels aligned.";
