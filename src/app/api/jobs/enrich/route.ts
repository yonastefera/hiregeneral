import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { htmlToText } from "@/lib/text/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROMPT_VERSION = "job_enrichment_v1";
const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const MAX_LIMIT = 25;
const MAX_DESCRIPTION_CHARS = 5_000;
const SYSTEM_INSTRUCTIONS =
  "You transform raw job postings into clean candidate-facing presentation fields. Keep source facts intact. Do not invent hard requirements, salary, benefits, or locations. Remove legal boilerplate, EEO text, application instructions, duplicate headings, and salary tables from presentation copy.";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const enrichmentSchema = z.object({
  displayTitle: z.string().min(3).max(140),
  displayLocation: z.string().min(2).max(160),
  locationCount: z.number().int().min(0).max(500),
  summary: z.string().min(40).max(420),
  aboutRole: z.string().min(40).max(1_200),
  responsibilities: z.array(z.string().min(8).max(260)).max(8),
  requirements: z.array(z.string().min(8).max(260)).max(8),
  benefits: z.array(z.string().min(8).max(260)).max(6),
  qualityFlags: z
    .array(
      z.enum([
        "weak_description",
        "location_blob",
        "boilerplate_heavy",
        "salary_table",
        "missing_requirements",
        "missing_responsibilities",
        "low_confidence",
      ]),
    )
    .max(8),
  confidence: z.number().min(0).max(1),
});

type JobForEnrichment = {
  id: string;
  company_name: string;
  title: string;
  description: string | null;
  location: string;
  employment_type: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  category: string | null;
  source_name: string | null;
  source_id: string | null;
  apply_url: string | null;
  posted_at: string | null;
  updated_at: string | null;
};

type ExistingEnrichment = {
  job_id: string;
  source_updated_at: string | null;
  status: "ready" | "failed";
};

type OllamaResponse = {
  response?: string;
  error?: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function asInt(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.trunc(parsed);
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Model did not return a JSON object.");
  }

  return match[0];
}

function enrichmentPrompt(job: JobForEnrichment) {
  return [
    SYSTEM_INSTRUCTIONS,
    "",
    "Return only a JSON object with these exact keys:",
    "displayTitle, displayLocation, locationCount, summary, aboutRole, responsibilities, requirements, benefits, qualityFlags, confidence.",
    "qualityFlags must use only: weak_description, location_blob, boilerplate_heavy, salary_table, missing_requirements, missing_responsibilities, low_confidence.",
    "",
    "Raw job JSON:",
    JSON.stringify(compactJobPayload(job)),
  ].join("\n");
}

function compactJobPayload(job: JobForEnrichment) {
  const description = htmlToText(job.description).slice(
    0,
    MAX_DESCRIPTION_CHARS,
  );

  return {
    id: job.id,
    companyName: job.company_name,
    title: htmlToText(job.title),
    location: job.location,
    employmentType: job.employment_type,
    workMode: job.work_mode,
    salary: {
      min: job.salary_min,
      max: job.salary_max,
      currency: job.salary_currency,
    },
    skills: job.skills ?? [],
    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
    category: job.category,
    source: {
      name: job.source_name,
      id: job.source_id,
      applyUrl: job.apply_url,
      postedAt: job.posted_at,
    },
    description,
  };
}

async function enrichJob(job: JobForEnrichment) {
  const model = process.env.OLLAMA_JOB_ENRICHMENT_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const baseUrl =
    process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_OLLAMA_BASE_URL;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: enrichmentPrompt(job),
      stream: false,
      format: "json",
      keep_alive: "10m",
      options: {
        temperature: 0.1,
        num_ctx: 4_096,
        num_predict: 900,
      },
    }),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "fetch failed";

    throw new Error(
      `Could not reach Ollama at ${baseUrl}. Make sure Ollama is running and OLLAMA_BASE_URL is correct. Original error: ${message}`,
    );
  });

  const body = (await response
    .json()
    .catch(() => null)) as OllamaResponse | null;

  if (!response.ok || !body) {
    throw new Error(
      body?.error ?? `Ollama enrichment failed: ${response.status}`,
    );
  }

  if (!body.response) {
    throw new Error("Ollama enrichment returned no response.");
  }

  return {
    model,
    data: enrichmentSchema.parse(JSON.parse(extractJsonObject(body.response))),
  };
}

async function getCandidateJobs(params: {
  jobId: string | null;
  limit: number;
}) {
  let query = supabaseAdmin
    .from("jobs")
    .select(
      [
        "id",
        "company_name",
        "title",
        "description",
        "location",
        "employment_type",
        "work_mode",
        "salary_min",
        "salary_max",
        "salary_currency",
        "skills",
        "responsibilities",
        "requirements",
        "benefits",
        "category",
        "source_name",
        "source_id",
        "apply_url",
        "posted_at",
        "updated_at",
      ].join(","),
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .not("source_name", "is", null)
    .order("updated_at", { ascending: false })
    .limit(params.limit * 4);

  if (params.jobId) {
    query = query.eq("id", params.jobId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load jobs to enrich: ${error.message}`);
  }

  return (data ?? []) as unknown as JobForEnrichment[];
}

async function getExistingEnrichments(jobIds: string[]) {
  if (jobIds.length === 0) return new Map<string, ExistingEnrichment>();

  const { data, error } = await supabaseAdmin
    .from("job_enrichments")
    .select("job_id, source_updated_at, status")
    .in("job_id", jobIds);

  if (error) {
    throw new Error(`Could not load existing enrichments: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as ExistingEnrichment[]).map((row) => [row.job_id, row]),
  );
}

async function upsertFailure(job: JobForEnrichment, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown enrichment error";

  await supabaseAdmin.from("job_enrichments").upsert(
    {
      job_id: job.id,
      display_title: htmlToText(job.title).slice(0, 140) || "Untitled role",
      display_location: job.location.slice(0, 160) || "Not specified",
      location_count: 1,
      summary:
        "This job could not be enriched yet. Review the original posting.",
      about_role:
        "This job could not be enriched yet. Review the original posting for full details.",
      responsibilities: [],
      requirements: [],
      benefits: [],
      quality_flags: ["low_confidence"],
      confidence: 0,
      status: "failed",
      error_message: message.slice(0, 1_000),
      model: `ollama:${
        process.env.OLLAMA_JOB_ENRICHMENT_MODEL ?? DEFAULT_OLLAMA_MODEL
      }`,
      prompt_version: PROMPT_VERSION,
      source_updated_at: job.updated_at,
      enriched_at: new Date().toISOString(),
    },
    { onConflict: "job_id" },
  );

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const ingestSecret = requireEnv("INGEST_SECRET");
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${ingestSecret}`) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const jobId = searchParams.get("jobId");
    const force = searchParams.get("force") === "true";
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, asInt(searchParams.get("limit"), 5)),
    );

    const candidates = await getCandidateJobs({ jobId, limit });
    const existingByJobId = await getExistingEnrichments(
      candidates.map((job) => job.id),
    );
    const jobs = candidates
      .filter((job) => {
        if (force || jobId) return true;

        const existing = existingByJobId.get(job.id);

        return (
          !existing ||
          existing.status === "failed" ||
          existing.source_updated_at !== job.updated_at
        );
      })
      .slice(0, limit);

    const results: Array<{
      jobId: string;
      companyName: string;
      title: string;
      status: "ready" | "failed";
      error: string | null;
    }> = [];

    for (const job of jobs) {
      try {
        const enrichment = await enrichJob(job);

        const { error } = await supabaseAdmin.from("job_enrichments").upsert(
          {
            job_id: job.id,
            display_title: enrichment.data.displayTitle,
            display_location: enrichment.data.displayLocation,
            location_count: enrichment.data.locationCount,
            summary: enrichment.data.summary,
            about_role: enrichment.data.aboutRole,
            responsibilities: enrichment.data.responsibilities,
            requirements: enrichment.data.requirements,
            benefits: enrichment.data.benefits,
            quality_flags: enrichment.data.qualityFlags,
            confidence: enrichment.data.confidence,
            status: "ready",
            error_message: null,
            model: `ollama:${enrichment.model}`,
            prompt_version: PROMPT_VERSION,
            source_updated_at: job.updated_at,
            enriched_at: new Date().toISOString(),
          },
          { onConflict: "job_id" },
        );

        if (error) {
          throw new Error(`Could not save enrichment: ${error.message}`);
        }

        results.push({
          jobId: job.id,
          companyName: job.company_name,
          title: job.title,
          status: "ready",
          error: null,
        });
      } catch (error) {
        const message = await upsertFailure(job, error);

        results.push({
          jobId: job.id,
          companyName: job.company_name,
          title: job.title,
          status: "failed",
          error: message,
        });
      }
    }

    return NextResponse.json({
      ok: results.every((result) => result.status === "ready"),
      requested: limit,
      candidates: candidates.length,
      skipped: candidates.length - jobs.length,
      enriched: results.filter((result) => result.status === "ready").length,
      failed: results.filter((result) => result.status === "failed").length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown enrichment error",
      },
      { status: 500 },
    );
  }
}
