import { createClient } from "@/lib/supabase/server";

import type { CompanyProfile } from "./company-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type CompanyRow = {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  tagline: string | null;
  created_at: string;
};

type JobCompanyFallbackRow = {
  company_name: string;
  company_logo_url: string | null;
  company_website: string | null;
  company_size: string | null;
  company_tagline: string | null;
  location: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Today";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Today";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeWebsite(value: string | null | undefined) {
  const website = value?.trim();

  if (!website) {
    return {
      websiteUrl: "",
      websiteLabel: "Add website",
    };
  }

  const websiteUrl = website.startsWith("http")
    ? website
    : `https://${website}`;

  return {
    websiteUrl,
    websiteLabel: websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
}

function createEmptyCompanyProfile(email?: string | null): CompanyProfile {
  const fallbackName = email?.split("@")[1]?.split(".")[0] || "Your company";
  const name = fallbackName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: null,
    name,
    initials: getInitials(name) || "YC",
    location: "",
    createdAt: "Today",
    activeJobs: 0,
    websiteLabel: "Add website",
    websiteUrl: "",
    industry: "Software",
    size: "1-10",
    tagline: "",
    about: "",
    logoUrl: null,
  };
}

function mapCompanyProfile(
  company: CompanyRow | null,
  fallbackJob: JobCompanyFallbackRow | null,
  activeJobs: number,
  email?: string | null,
): CompanyProfile {
  if (!company && !fallbackJob) {
    return createEmptyCompanyProfile(email);
  }

  const empty = createEmptyCompanyProfile(email);
  const name = company?.name || fallbackJob?.company_name || empty.name;
  const website = normalizeWebsite(
    company?.website || fallbackJob?.company_website,
  );

  return {
    id: company?.id ?? null,
    name,
    initials: getInitials(name) || empty.initials,
    location: company?.location || fallbackJob?.location || "",
    createdAt: formatDate(company?.created_at),
    activeJobs,
    websiteLabel: website.websiteLabel,
    websiteUrl: website.websiteUrl,
    industry: company?.industry || "Software",
    size: company?.size || fallbackJob?.company_size || "1-10",
    tagline: company?.tagline || fallbackJob?.company_tagline || "",
    about: company?.description || "",
    logoUrl: company?.logo_url || fallbackJob?.company_logo_url || null,
  };
}

export async function getEmployerCompanyProfile(
  params: {
    supabase?: SupabaseServerClient;
    recruiterId?: string;
    email?: string | null;
  } = {},
) {
  const supabase = params.supabase ?? (await createClient());
  let recruiterId = params.recruiterId ?? null;
  let email = params.email ?? null;

  if (!recruiterId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    recruiterId = user?.id ?? null;
    email = user?.email ?? email;
  }

  if (!recruiterId) {
    return createEmptyCompanyProfile(email);
  }

  const [companyResult, activeJobsResult, fallbackJobResult] =
    await Promise.all([
      supabase
        .from("companies")
        .select(
          `
          id,
          name,
          logo_url,
          website,
          location,
          description,
          industry,
          size,
          tagline,
          created_at
        `,
        )
        .eq("owner_id", recruiterId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("recruiter_id", recruiterId)
        .eq("status", "published"),
      supabase
        .from("jobs")
        .select(
          `
          company_name,
          company_logo_url,
          company_website,
          company_size,
          company_tagline,
          location
        `,
        )
        .eq("recruiter_id", recruiterId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (companyResult.error) {
    console.error("[getEmployerCompanyProfile:company]", companyResult.error);
  }

  if (activeJobsResult.error) {
    console.error(
      "[getEmployerCompanyProfile:activeJobs]",
      activeJobsResult.error,
    );
  }

  if (fallbackJobResult.error) {
    console.error(
      "[getEmployerCompanyProfile:fallbackJob]",
      fallbackJobResult.error,
    );
  }

  return mapCompanyProfile(
    (companyResult.data as CompanyRow | null) ?? null,
    (fallbackJobResult.data as JobCompanyFallbackRow | null) ?? null,
    activeJobsResult.count ?? 0,
    email,
  );
}
