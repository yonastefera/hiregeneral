export type ProfileVisibility = "public" | "private";
export type ResumeScanStatus = "pending_scan" | "available" | "rejected";

export type JobSeekerProfile = {
  id: string;
  user_id: string;

  full_name: string | null;
  headline: string | null;
  user_type: string;

  location: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;

  phone: string | null;
  email: string | null;

  resume_url: string | null;
  resume_file_name?: string | null;
  resume_file_size?: number | null;
  resume_uploaded_at?: string | null;
  resume_scan_status?: ResumeScanStatus | null;

  avatar_url?: string | null;
  avatar_file_name?: string | null;
  avatar_uploaded_at?: string | null;

  work_experience?: WorkExperience[] | null;
  skills: string[] | null;
  profile_links?: ProfileLink[] | null;
  education?: EducationItem[] | null;
  achievements?: Achievement[] | null;
  licenses_certifications?: LicenseCertification[] | null;

  additional_info: string | null;
  executive_summary?: string | null;
  objective?: string | null;

  open_to_relocation?: boolean | null;
  minimum_desired_pay?: string | null;
  level_of_experience?: string | null;
  highest_degree?: string | null;
  industry?: string | null;

  gender: string | null;
  gender_self_describe?: string | null;
  ethnicity: string | null;
  ethnicity_self_describe?: string | null;
  veteran_status: string | null;
  disability_status: string | null;

  visibility: ProfileVisibility | string | null;

  created_at: string;
  updated_at: string;
  deletion_requested_at: string | null;
  deleted_at: string | null;
};

export type JobSeekerProfileUpdate = {
  full_name: string | null;
  headline: string | null;

  location: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;

  phone: string | null;

  resume_url: string | null;
  avatar_url: string | null;

  skills: string[];

  additional_info: string | null;
  executive_summary: string | null;
  objective: string | null;

  open_to_relocation: boolean;
  minimum_desired_pay: string | null;
  level_of_experience: string | null;
  highest_degree: string | null;
  industry: string | null;

  gender: string | null;
  gender_self_describe: string | null;
  ethnicity: string | null;
  ethnicity_self_describe: string | null;
  veteran_status: string | null;
  disability_status: string | null;

  visibility: ProfileVisibility;
};

export type ProfileFormErrors = Partial<
  Record<
    | "full_name"
    | "headline"
    | "phone"
    | "city"
    | "state"
    | "zip_code"
    | "resume"
    | "avatar"
    | "executive_summary"
    | "objective"
    | "gender_self_describe"
    | "ethnicity_self_describe"
    | "form",
    string
  >
>;

export type ResumeViewState = {
  label: string;
  href: string | null;
};

export type AvatarViewState = {
  href: string | null;
};

export type WorkExperience = {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
};

export type EducationItem = {
  id: string;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  description?: string;
};

export type Skills = {
  id: string;
};

export type LicenseCertification = {
  id: string;
  name: string;
  issuer: string;
  issue_year: string | null;
  description: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
};

export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};
