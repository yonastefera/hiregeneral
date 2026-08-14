import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const JOB_A = "20000000-0000-4000-8000-000000000001";
const JOB_B = "20000000-0000-4000-8000-000000000002";
const JOB_B_DRAFT = "20000000-0000-4000-8000-000000000003";
const TEMP_SAVED = "60000000-0000-4000-8000-000000000001";
const TEMP_APPLICATION = "60000000-0000-4000-8000-000000000002";
const TEMP_CONVERSATION = "60000000-0000-4000-8000-000000000003";
const TEMP_MESSAGE = "60000000-0000-4000-8000-000000000004";

const required = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_ANON_KEY",
  "SUPABASE_TEST_SERVICE_ROLE_KEY",
  "SUPABASE_TEST_SEEKER_EMAIL",
  "SUPABASE_TEST_SEEKER_PASSWORD",
  "SUPABASE_TEST_RECRUITER_A_EMAIL",
  "SUPABASE_TEST_RECRUITER_A_PASSWORD",
  "SUPABASE_TEST_RECRUITER_B_EMAIL",
  "SUPABASE_TEST_RECRUITER_B_PASSWORD",
  "SUPABASE_TEST_ADMIN_EMAIL",
  "SUPABASE_TEST_ADMIN_PASSWORD",
] as const;

const enabled = process.env.RUN_RLS_INTEGRATION === "1";

function env(name: (typeof required)[number]) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when RUN_RLS_INTEGRATION=1`);
  return value;
}

function client(serviceRole = false) {
  return createClient(
    env("SUPABASE_TEST_URL"),
    serviceRole
      ? env("SUPABASE_TEST_SERVICE_ROLE_KEY")
      : env("SUPABASE_TEST_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function signedInClient(
  emailName:
    | "SUPABASE_TEST_SEEKER_EMAIL"
    | "SUPABASE_TEST_RECRUITER_A_EMAIL"
    | "SUPABASE_TEST_RECRUITER_B_EMAIL"
    | "SUPABASE_TEST_ADMIN_EMAIL",
  passwordName:
    | "SUPABASE_TEST_SEEKER_PASSWORD"
    | "SUPABASE_TEST_RECRUITER_A_PASSWORD"
    | "SUPABASE_TEST_RECRUITER_B_PASSWORD"
    | "SUPABASE_TEST_ADMIN_PASSWORD",
) {
  const actor = client();
  const { data, error } = await actor.auth.signInWithPassword({
    email: env(emailName),
    password: env(passwordName),
  });
  if (error || !data.user) {
    throw new Error(`Could not authenticate ${emailName}: ${error?.message}`);
  }
  return { actor, userId: data.user.id };
}

describe.skipIf(!enabled)("Supabase RLS cross-account isolation", () => {
  let seeker: SupabaseClient;
  let seekerId: string;
  let recruiterA: SupabaseClient;
  let recruiterAId: string;
  let recruiterB: SupabaseClient;
  let recruiterBId: string;
  let admin: SupabaseClient;
  let control: SupabaseClient;

  beforeAll(async () => {
    expect(required.map(env)).toHaveLength(required.length);
    [
      { actor: seeker, userId: seekerId },
      { actor: recruiterA, userId: recruiterAId },
      { actor: recruiterB, userId: recruiterBId },
      { actor: admin },
    ] = await Promise.all([
      signedInClient(
        "SUPABASE_TEST_SEEKER_EMAIL",
        "SUPABASE_TEST_SEEKER_PASSWORD",
      ),
      signedInClient(
        "SUPABASE_TEST_RECRUITER_A_EMAIL",
        "SUPABASE_TEST_RECRUITER_A_PASSWORD",
      ),
      signedInClient(
        "SUPABASE_TEST_RECRUITER_B_EMAIL",
        "SUPABASE_TEST_RECRUITER_B_PASSWORD",
      ),
      signedInClient(
        "SUPABASE_TEST_ADMIN_EMAIL",
        "SUPABASE_TEST_ADMIN_PASSWORD",
      ),
    ]);
    control = client(true);
  });

  afterAll(async () => {
    if (!enabled || !control) return;
    await control.from("messages").delete().eq("id", TEMP_MESSAGE);
    await control.from("conversations").delete().eq("id", TEMP_CONVERSATION);
    await control.from("applications").delete().eq("id", TEMP_APPLICATION);
    await control.from("saved_jobs").delete().eq("id", TEMP_SAVED);
    if (seekerId) {
      await control.storage
        .from("resumes")
        .remove([`${seekerId}/rls-test-resume.pdf`]);
    }
    await control
      .from("jobs")
      .update({
        description: "This draft must remain hidden from other accounts.",
      })
      .eq("id", JOB_B_DRAFT);
  });

  it("prevents anonymous and seeker clients from reading draft jobs", async () => {
    for (const actor of [client(), seeker]) {
      const { data, error } = await actor
        .from("jobs")
        .select("id,status")
        .eq("status", "draft");
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it("prevents recruiter A from reading recruiter B private records", async () => {
    const [jobs, invites] = await Promise.all([
      recruiterA
        .from("jobs")
        .select("id")
        .eq("recruiter_id", recruiterBId)
        .eq("status", "draft"),
      recruiterA
        .from("employer_candidate_invites")
        .select("id")
        .eq("recruiter_id", recruiterBId),
    ]);

    expect(jobs.error).toBeNull();
    expect(jobs.data).toEqual([]);
    expect(invites.error).toBeNull();
    expect(invites.data).toEqual([]);
  });

  it("allows the application admin to read recruiter B's draft", async () => {
    const { data, error } = await admin
      .from("jobs")
      .select("id")
      .eq("recruiter_id", recruiterBId)
      .eq("status", "draft");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("allows the service-role control client to observe recruiter B fixtures", async () => {
    const { data, error } = await control
      .from("jobs")
      .select("id")
      .eq("recruiter_id", recruiterBId);
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it("enforces saved-job role, ownership, and published-job checks", async () => {
    const ownSave = await seeker.from("saved_jobs").insert({
      id: TEMP_SAVED,
      user_id: seekerId,
      job_id: JOB_B,
    });
    expect(ownSave.error).toBeNull();

    const recruiterSave = await recruiterA.from("saved_jobs").insert({
      user_id: recruiterAId,
      job_id: JOB_A,
    });
    expect(recruiterSave.error).not.toBeNull();

    const draftSave = await seeker.from("saved_jobs").insert({
      user_id: seekerId,
      job_id: JOB_B_DRAFT,
    });
    expect(draftSave.error).not.toBeNull();

    const removed = await seeker
      .from("saved_jobs")
      .delete()
      .eq("id", TEMP_SAVED)
      .select("id");
    expect(removed.error).toBeNull();
    expect(removed.data).toHaveLength(1);
  });

  it("isolates applications while allowing the owning recruiter to update status", async () => {
    const created = await seeker.from("applications").insert({
      id: TEMP_APPLICATION,
      user_id: seekerId,
      job_id: JOB_B,
      resume_url: `${seekerId}/test-resume.pdf`,
      cover_note: "Temporary RLS integration application.",
      status: "submitted",
    });
    expect(created.error).toBeNull();

    const hiddenFromA = await recruiterA
      .from("applications")
      .select("id")
      .eq("id", TEMP_APPLICATION);
    expect(hiddenFromA.error).toBeNull();
    expect(hiddenFromA.data).toEqual([]);

    const visibleToB = await recruiterB
      .from("applications")
      .select("id,status")
      .eq("id", TEMP_APPLICATION);
    expect(visibleToB.error).toBeNull();
    expect(visibleToB.data).toHaveLength(1);

    const updated = await recruiterB
      .from("applications")
      .update({ status: "reviewing" })
      .eq("id", TEMP_APPLICATION)
      .select("status");
    expect(updated.error).toBeNull();
    expect(updated.data).toEqual([{ status: "reviewing" }]);
  });

  it("blocks cross-company job writes and permits the owner", async () => {
    const blocked = await recruiterA
      .from("jobs")
      .update({ description: "Unauthorized cross-account edit" })
      .eq("id", JOB_B_DRAFT)
      .select("id");
    expect(blocked.error).toBeNull();
    expect(blocked.data).toEqual([]);

    const owned = await recruiterB
      .from("jobs")
      .update({ description: "Authorized recruiter B test edit" })
      .eq("id", JOB_B_DRAFT)
      .select("id");
    expect(owned.error).toBeNull();
    expect(owned.data).toEqual([{ id: JOB_B_DRAFT }]);
  });

  it("enforces candidate and invitation entitlement boundaries", async () => {
    const seekerProfile = await control
      .from("profiles")
      .select("id")
      .eq("user_id", seekerId)
      .single();
    expect(seekerProfile.error).toBeNull();

    const applicantAccess = await recruiterA
      .from("profiles")
      .select("id")
      .eq("user_id", seekerId);
    expect(applicantAccess.data).toHaveLength(1);

    const paidDatabaseAccess = await recruiterB
      .from("profiles")
      .select("id")
      .eq("user_id", seekerId);
    expect(paidDatabaseAccess.data).toHaveLength(1);

    const starterInvite = await recruiterA
      .from("employer_candidate_invites")
      .insert({
        recruiter_id: recruiterAId,
        candidate_id: seekerProfile.data?.id,
        job_id: JOB_A,
        message: "This starter-plan invitation must fail.",
        status: "sent",
      });
    expect(starterInvite.error).not.toBeNull();
  });

  it("isolates conversations and messages to their participants", async () => {
    const conversation = await recruiterB.from("conversations").insert({
      id: TEMP_CONVERSATION,
      participant_one: recruiterBId,
      participant_two: seekerId,
      job_id: JOB_B,
    });
    expect(conversation.error).toBeNull();

    const message = await recruiterB.from("messages").insert({
      id: TEMP_MESSAGE,
      conversation_id: TEMP_CONVERSATION,
      sender_id: recruiterBId,
      body: "Temporary RLS integration message.",
    });
    expect(message.error).toBeNull();

    const seekerView = await seeker
      .from("messages")
      .select("id")
      .eq("id", TEMP_MESSAGE);
    expect(seekerView.data).toEqual([{ id: TEMP_MESSAGE }]);

    const outsiderView = await recruiterA
      .from("messages")
      .select("id")
      .eq("id", TEMP_MESSAGE);
    expect(outsiderView.data).toEqual([]);

    const outsiderWrite = await recruiterA.from("messages").insert({
      conversation_id: TEMP_CONVERSATION,
      sender_id: recruiterAId,
      body: "Unauthorized message.",
    });
    expect(outsiderWrite.error).not.toBeNull();
  });

  it("enforces resume storage folder ownership", async () => {
    const path = `${seekerId}/rls-test-resume.pdf`;
    const ownUpload = await seeker.storage
      .from("resumes")
      .upload(path, new Blob(["test resume"], { type: "application/pdf" }), {
        upsert: true,
      });
    expect(ownUpload.error).toBeNull();

    const crossAccountUpload = await recruiterB.storage
      .from("resumes")
      .upload(
        `${seekerId}/recruiter-overwrite.pdf`,
        new Blob(["unauthorized"], { type: "application/pdf" }),
        { upsert: true },
      );
    expect(crossAccountUpload.error).not.toBeNull();

    const ownRead = await seeker.storage.from("resumes").download(path);
    expect(ownRead.error).toBeNull();

    const outsiderRead = await recruiterB.storage
      .from("resumes")
      .download(path);
    expect(outsiderRead.error).not.toBeNull();
  });
});
