import { describe, expect, it, vi } from "vitest";

import {
  applicationSubmissionSchema,
  getOwnedResumeFileName,
  isJobAcceptingApplications,
} from "@/lib/applications/submission";

const userId = "22222222-2222-4222-8222-222222222222";

function validSubmission() {
  return {
    job_id: "11111111-1111-4111-8111-111111111111",
    resume_url: `${userId}/resume-123.pdf`,
    cover_note: "  I build reliable systems.  ",
    applicant_full_name: "  Avery Morgan  ",
    applicant_email: "avery@example.com",
    applicant_phone: "",
    applicant_location: "New York, NY",
    applicant_linkedin: "https://linkedin.com/in/avery",
    applicant_portfolio: null,
    years_experience: "5-7",
    work_authorization: "citizen",
    requires_sponsorship: "no",
  };
}

describe("applicationSubmissionSchema", () => {
  it("accepts and normalizes a valid submission", () => {
    const result = applicationSubmissionSchema.parse(validSubmission());

    expect(result.applicant_full_name).toBe("Avery Morgan");
    expect(result.cover_note).toBe("I build reliable systems.");
    expect(result.applicant_phone).toBeNull();
    expect(result.applicant_portfolio).toBeNull();
  });

  it("rejects invalid URLs, enum values, and unknown fields", () => {
    const result = applicationSubmissionSchema.safeParse({
      ...validSubmission(),
      applicant_linkedin: "javascript:alert(1)",
      years_experience: "twenty",
      is_admin: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an HTTP URL without a hostname", () => {
    const result = applicationSubmissionSchema.safeParse({
      ...validSubmission(),
      applicant_portfolio: "https://",
    });

    expect(result.success).toBe(false);
  });
});

describe("getOwnedResumeFileName", () => {
  it("accepts a supported file in the authenticated user's folder", () => {
    expect(getOwnedResumeFileName(`${userId}/resume-123.docx`, userId)).toBe(
      "resume-123.docx",
    );
  });

  it.each([
    "33333333-3333-4333-8333-333333333333/resume.pdf",
    `${userId}/nested/resume.pdf`,
    `${userId}/resume.exe`,
    "https://example.com/resume.pdf",
  ])("rejects an unowned or invalid resume path: %s", (path) => {
    expect(getOwnedResumeFileName(path, userId)).toBeNull();
  });
});

describe("isJobAcceptingApplications", () => {
  it("accepts a published, unexpired job", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));

    expect(
      isJobAcceptingApplications({
        status: "published",
        expires_at: "2026-08-02T12:00:00Z",
      }),
    ).toBe(true);

    vi.useRealTimers();
  });

  it.each([
    { status: "draft", expires_at: null },
    { status: "published", expires_at: "2020-01-01T00:00:00Z" },
    { status: "published", expires_at: "not-a-date" },
  ])("rejects an unavailable job", (job) => {
    expect(isJobAcceptingApplications(job)).toBe(false);
  });
});
