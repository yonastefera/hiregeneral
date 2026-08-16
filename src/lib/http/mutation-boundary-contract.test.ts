import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcRoot = fileURLToPath(new URL("../../", import.meta.url));
const apiRoot = join(srcRoot, "app/api");

function mutationRoutes(directory = apiRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return mutationRoutes(path);
    if (entry.name !== "route.ts") return [];

    const contents = readFileSync(path, "utf8");
    return /export async function (?:POST|PUT|PATCH|DELETE)\b/.test(contents)
      ? [relative(srcRoot, path)]
      : [];
  });
}

type Boundary = {
  authentication: string[];
  authorization: string[];
  validation: string[];
  abuseControl: string[];
  safeError: string[];
};

const contracts: Record<string, Boundary> = {
  "app/api/account/deletion/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: ['.eq("user_id", user.id)'],
    validation: ["export async function POST()"],
    abuseControl: ["accountDeletionRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not request account deletion.")'],
  },
  "app/api/account/employer-access/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: [
      '.eq("user_id", user.id)',
      '.eq("user_type", "job_seeker")',
    ],
    validation: ["boundedJsonBody(request)", "updateSchema.safeParse"],
    abuseControl: ["accountPrivacyRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not save employer-access settings.")'],
  },
  "app/api/admin/seed-schools/route.ts": {
    authentication: [
      'request.headers.get("x-admin-seed-secret")',
      "status: 401",
    ],
    authorization: ["ADMIN_SEED_SECRET", "timingSafeEqual"],
    validation: ["Number.isInteger(startPage)", "startPage < 0"],
    abuseControl: ["adminSeedRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not save schools.")'],
  },
  "app/api/applications/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: [
      "getOwnedResumeFileName",
      "resumeFiles",
      "isJobAcceptingApplications",
    ],
    validation: ["boundedJsonBody(", "applicationSubmissionSchema.safeParse"],
    abuseControl: ["applicationSubmissionRateLimit.limit"],
    safeError: ["INTERNAL_ERROR"],
  },
  "app/api/auth/password-reset/route.ts": {
    authentication: ["RESET_MESSAGE"],
    authorization: ["generateLink", 'type: "recovery"'],
    validation: ["readJsonBody(request)", "passwordResetSchema.safeParse"],
    abuseControl: [
      "passwordResetRateLimit.limit",
      "enforceDuplicateCooldown({",
    ],
    safeError: ["return resetResponse()"],
  },
  "app/api/auth/password-update/route.ts": {
    authentication: ["supabase.auth.getUser()", "verifyRecoveryAuthorization"],
    authorization: ["updateUserById(", "user.id", 'scope: "global"'],
    validation: ["boundedJsonBody(request)", "passwordUpdateSchema.safeParse"],
    abuseControl: ["passwordUpdateRateLimit", "enforceRateLimit({"],
    safeError: ["Could not update password. Request a new link and try again."],
  },
  "app/api/auth/role/route.ts": {
    authentication: ["getCurrentUser()", "status: 401"],
    authorization: ["assignInitialRole({", 'source: "role_selection"'],
    validation: ["readJsonBody(request)", "roleSelectionSchema.safeParse"],
    abuseControl: ["roleSelectionRateLimit.limit"],
    safeError: ['error: "Could not save account role."'],
  },
  "app/api/auth/signout/route.ts": {
    authentication: ["supabase.auth.signOut()"],
    authorization: ["supabase.auth.signOut()"],
    validation: ["export async function POST()"],
    abuseControl: ["export async function POST()"],
    safeError: ['error: "Unable to sign out."'],
  },
  "app/api/auth/signup/route.ts": {
    authentication: ["ELIGIBILITY_MESSAGE"],
    authorization: ["generateLink", 'type: "signup"'],
    validation: ["readJsonBody(request)", "signupSchema.safeParse"],
    abuseControl: ["signupRateLimit.limit", "enforceDuplicateCooldown({"],
    safeError: ["return eligibilityResponse()"],
  },
  "app/api/contact/route.ts": {
    authentication: ["contactSchema"],
    authorization: ["website", "contact_messages"],
    validation: ["boundedJsonBody(", "contactSchema.safeParse"],
    abuseControl: ["contactSubmissionRateLimit", "enforceDuplicateCooldown({"],
    safeError: ['safeServerError("Could not send your message.")'],
  },
  "app/api/employers/billing/create-checkout-session/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: ["getEmployerBillingSummary", "auth.user.id"],
    validation: ["boundedJsonBody(", "checkoutSchema.safeParse"],
    abuseControl: ["employerBillingRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not create checkout session.")'],
  },
  "app/api/employers/billing/create-portal-session/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: ["getEmployerBillingSummary", "auth.user.id"],
    validation: ["export async function POST(request: NextRequest)"],
    abuseControl: ["employerBillingRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not create billing portal session.")'],
  },
  "app/api/employers/company/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: ['.eq("owner_id", auth.user.id)'],
    validation: ["boundedJsonBody(", "companySchema.safeParse"],
    abuseControl: ["employerCompanyRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not save the company profile.")'],
  },
  "app/api/employers/invite/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: [
      '.eq("recruiter_id", user.id)',
      '.eq("visibility", "public")',
    ],
    validation: ["boundedJsonBody(", "inviteSchema.safeParse"],
    abuseControl: ["employerInviteRateLimit", "enforceDuplicateCooldown({"],
    safeError: ['safeServerError("Could not send the invitation.")'],
  },
  "app/api/employers/jobs/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: ['.eq("owner_id", user.id)', "recruiter_id: user.id"],
    validation: ["boundedJsonBody(", "postJobSchema.safeParse"],
    abuseControl: ["employerJobRateLimit", "enforceRateLimit({"],
    safeError: ["safeServerError("],
  },
  "app/api/employers/messages/route.ts": {
    authentication: ["requireEmployerUser()"],
    authorization: [
      "participant_one.eq.${auth.user.id}",
      "sender_id: auth.user.id",
    ],
    validation: ["boundedJsonBody(", "sendMessageSchema.safeParse"],
    abuseControl: ["employerMessageRateLimit", "enforceDuplicateCooldown({"],
    safeError: ['safeServerError("Could not send the message.")'],
  },
  "app/api/ingest/jobs/route.ts": {
    authentication: [
      'request.headers.get("authorization")',
      'error: "Unauthorized"',
    ],
    authorization: ["expectedAuthHeaders()", "isCronRequest"],
    validation: ["ingestionQuerySchema.safeParse"],
    abuseControl: ["ingestionRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Job ingestion failed.")'],
  },
  "app/api/internal/account-deletions/route.ts": {
    authentication: ["process.env.CRON_SECRET", "timingSafeEqual"],
    authorization: ["prepare_account_deletion", "complete_account_deletion"],
    validation: [
      '.lte("deletion_requested_at", cutoff)',
      '.is("deletion_completed_at", null)',
    ],
    abuseControl: ["const BATCH_SIZE = 10", ".limit(BATCH_SIZE)"],
    safeError: ['error: "Could not process account deletions."'],
  },
  "app/api/messages/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: ["participant_one.eq.${user.id}", "sender_id: user.id"],
    validation: ["boundedJsonBody(", "messageSchema.safeParse"],
    abuseControl: ["userMessageRateLimit", "enforceDuplicateCooldown({"],
    safeError: ['safeServerError("Could not send the message.")'],
  },
  "app/api/notification-settings/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: ['.eq("user_id", user.id)'],
    validation: ["boundedJsonBody(", "preferencesSchema.safeParse"],
    abuseControl: ["notificationSettingsRateLimit", "enforceRateLimit({"],
    safeError: ['error: "Could not save notification settings."'],
  },
  "app/api/saved/route.ts": {
    authentication: ["supabase.auth.getUser()", "status: 401"],
    authorization: ["user_id: user.id", '.eq("user_id", user.id)'],
    validation: ["boundedJsonBody(", "savedJobSchema.safeParse"],
    abuseControl: ["savedJobRateLimit", "enforceRateLimit({"],
    safeError: ['safeServerError("Could not update saved jobs.")'],
  },
  "app/api/webhooks/stripe/route.ts": {
    authentication: [
      "verifyStripeWebhookEvent",
      'headers.get("stripe-signature")',
    ],
    authorization: ["claim_billing_event", "finish_billing_event"],
    validation: ["boundedTextBody("],
    abuseControl: ["claim_billing_event"],
    safeError: ['error: "Could not process Stripe webhook."'],
  },
};

describe("mutation security boundary contracts", () => {
  it("accounts for every mutation route", () => {
    expect(mutationRoutes().sort()).toEqual(Object.keys(contracts).sort());
  });

  it.each(Object.entries(contracts))(
    "%s declares every required security boundary",
    (route, boundary) => {
      const contents = readFileSync(join(srcRoot, route), "utf8");

      for (const [category, markers] of Object.entries(boundary)) {
        for (const marker of markers) {
          expect(
            contents,
            `${route}: missing ${category} marker ${marker}`,
          ).toContain(marker);
        }
      }
    },
  );
});
