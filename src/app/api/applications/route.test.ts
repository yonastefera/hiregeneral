import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  limit: vi.fn(),
  sendApplicationConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  applicationSubmissionRateLimit: { limit: mocks.limit },
}));

vi.mock("@/lib/email/send", () => ({
  sendApplicationConfirmationEmail: mocks.sendApplicationConfirmationEmail,
}));

import { POST } from "@/app/api/applications/route";

const userId = "22222222-2222-4222-8222-222222222222";
const jobId = "11111111-1111-4111-8111-111111111111";

function validBody() {
  return {
    job_id: jobId,
    resume_url: `${userId}/resume-123.pdf`,
    cover_note: "I build reliable systems.",
    applicant_full_name: "Avery Morgan",
    applicant_email: "avery@example.com",
    applicant_phone: null,
    applicant_location: "New York, NY",
    applicant_linkedin: "https://linkedin.com/in/avery",
    applicant_portfolio: null,
    years_experience: "5-7",
    work_authorization: "citizen",
    requires_sponsorship: "no",
  };
}

function request(body: unknown) {
  return new NextRequest("http://localhost/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createSupabase(options?: {
  user?: { id: string } | null;
  resumeExists?: boolean;
  job?: {
    id: string;
    title: string;
    company_name: string;
    status: string;
    expires_at: string | null;
  } | null;
  applicationError?: { code: string; message: string } | null;
}) {
  const user = options?.user === undefined ? { id: userId } : options.user;
  const resumeExists = options?.resumeExists ?? true;
  const job =
    options?.job === undefined
      ? {
          id: jobId,
          title: "Platform Engineer",
          company_name: "Acme",
          status: "published",
          expires_at: null,
        }
      : options.job;

  const jobQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: job, error: null }),
  };
  jobQuery.select.mockReturnValue(jobQuery);
  jobQuery.eq.mockReturnValue(jobQuery);

  const applicationQuery = {
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { id: "44444444-4444-4444-8444-444444444444", status: "submitted" },
      error: options?.applicationError ?? null,
    }),
  };
  applicationQuery.insert.mockReturnValue(applicationQuery);
  applicationQuery.select.mockReturnValue(applicationQuery);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: resumeExists ? [{ name: "resume-123.pdf" }] : [],
          error: null,
        }),
      }),
    },
    from: vi.fn((table: string) =>
      table === "jobs" ? jobQuery : applicationQuery,
    ),
    applicationQuery,
  };
}

beforeEach(() => {
  mocks.limit.mockResolvedValue({
    success: true,
    reset: Date.now() + 60_000,
  });
  mocks.sendApplicationConfirmationEmail.mockResolvedValue({});
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.RESEND_API_KEY;
});

describe("POST /api/applications", () => {
  it("rejects unauthenticated requests", async () => {
    mocks.createClient.mockResolvedValue(createSupabase({ user: null }));

    const response = await POST(request(validBody()));

    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("rejects malformed application data", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());

    const response = await POST(request({ job_id: "invalid" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.fields.job_id).toBeDefined();
  });

  it("rejects a resume outside the authenticated user's folder", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());

    const response = await POST(
      request({
        ...validBody(),
        resume_url: "33333333-3333-4333-8333-333333333333/resume-123.pdf",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a resume that does not exist in private storage", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({ resumeExists: false }),
    );

    const response = await POST(request(validBody()));

    expect(response.status).toBe(400);
  });

  it("rejects an expired job", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({
        job: {
          id: jobId,
          title: "Platform Engineer",
          company_name: "Acme",
          status: "published",
          expires_at: "2020-01-01T00:00:00Z",
        },
      }),
    );

    const response = await POST(request(validBody()));

    expect(response.status).toBe(409);
  });

  it("returns a conflict for a duplicate application", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({
        applicationError: { code: "23505", message: "duplicate key" },
      }),
    );

    const response = await POST(request(validBody()));

    expect(response.status).toBe(409);
  });

  it("rate limits repeated application attempts", async () => {
    mocks.createClient.mockResolvedValue(createSupabase());
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await POST(request(validBody()));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("creates a valid application and sends a React Email confirmation", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);

    const response = await POST(request(validBody()));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      id: "44444444-4444-4444-8444-444444444444",
      status: "submitted",
    });
    expect(supabase.applicationQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        job_id: jobId,
        resume_url: `${userId}/resume-123.pdf`,
      }),
    );
    expect(mocks.sendApplicationConfirmationEmail).toHaveBeenCalledWith({
      to: "avery@example.com",
      applicantName: "Avery Morgan",
      jobTitle: "Platform Engineer",
      companyName: "Acme",
    });
  });
});
