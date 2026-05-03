// lib/db/types.ts

export type JobStatus = "draft" | "published" | "closed";
export type AppRole = "admin" | "recruiter" | "job_seeker";

export interface Job {
  id: string;
  recruiter_id: string;
  company_id: string | null;
  company_name: string;
  company_logo_url: string | null;
  company_tagline: string | null;
  company_size: string | null;
  company_website: string | null;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
  employment_type: string;
  work_mode: string;
  experience_level: string | null;
  category: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills: string[];
  status: JobStatus;
  slug: string;
  source_name: string | null;
  source_id: string | null;
  apply_url: string | null;
  posted_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // joined from job_applicant_counts view
  applicant_count?: number;
}

export interface JobsResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JobFilters {
  query?: string;
  location?: string;
  daysAgo?: number;
  workMode?: string;
  employmentType?: string;
  page?: number;
  pageSize?: number;
}

// Shape JobCard expects — mapped from Job
export interface JobCardShape {
  id: string;
  slug: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  postedDaysAgo: number;
  employmentType: string;
  summary: string;
  salary: string | null;
  workMode: string;
  distance: number;
  skills: string[];
  applicants: number;
  applyUrl: string | null;
}
