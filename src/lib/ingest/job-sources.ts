import { createClient } from "@supabase/supabase-js";
import { logoDevUrl } from "@/lib/logos";

export type JobSourceType =
  | "greenhouse"
  | "lever"
  | "workday"
  | "oracle_hcm"
  | "successfactors"
  | "phenom"
  | "ashby"
  | "rss"
  | "csv"
  | "scraper";

export type JobSource = {
  id: string;
  companyName: string;
  companyDomain: string | null;
  companyLogoUrl?: string;
  metadata: Record<string, unknown>;
  sourceType: JobSourceType;
  sourceSlug: string;
  sourceUrl?: string;
  enabled: boolean;
};

type JobSourceRow = {
  id: string;
  company_name: string;
  company_domain: string | null;
  company_logo_url: string | null;
  metadata: Record<string, unknown> | null;
  source_type: JobSourceType;
  source_slug: string;
  source_url: string | null;
  enabled: boolean;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function toJobSource(row: JobSourceRow): JobSource {
  return {
    id: row.id,
    companyName: row.company_name,
    companyDomain: row.company_domain,
    companyLogoUrl:
      row.company_logo_url ??
      (row.company_domain ? logoDevUrl(row.company_domain) : undefined),
    metadata: row.metadata ?? {},
    sourceType: row.source_type,
    sourceSlug: row.source_slug,
    sourceUrl: row.source_url ?? undefined,
    enabled: row.enabled,
  };
}

export async function getEnabledJobSources() {
  const { data, error } = await supabaseAdmin
    .from("job_sources")
    .select(
      `
      id,
      company_name,
      company_domain,
      company_logo_url,
      metadata,
      source_type,
      source_slug,
      source_url,
      enabled
    `,
    )
    .eq("enabled", true)
    .order("company_name", { ascending: true });

  if (error) {
    throw new Error(`Could not load job sources: ${error.message}`);
  }

  return ((data ?? []) as JobSourceRow[]).map(toJobSource);
}
