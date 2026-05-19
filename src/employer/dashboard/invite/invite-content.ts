export type RecommendedCandidate = {
  id: string;
  profileUserId: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  match: number;
  invited: boolean;
};

export type InviteJobOption = {
  id: string;
  title: string;
};

export type InvitePageData = {
  jobs: InviteJobOption[];
  selectedJobId: string | null;
  recommendedCandidates: RecommendedCandidate[];
};

export const defaultInviteMessage =
  "Hi — your background looks like a strong fit for a role we're hiring for on HireGeneral. Would love for you to take a look and apply if it feels aligned.";
