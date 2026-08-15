import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("seeker and owning recruiter exchange isolated messages", async ({
  browser,
  page,
}) => {
  const seekerEmail = process.env.SUPABASE_TEST_SEEKER_EMAIL;
  const seekerPassword = process.env.SUPABASE_TEST_SEEKER_PASSWORD;
  const recruiterAEmail = process.env.SUPABASE_TEST_RECRUITER_A_EMAIL;
  const recruiterAPassword = process.env.SUPABASE_TEST_RECRUITER_A_PASSWORD;
  const recruiterBEmail = process.env.SUPABASE_TEST_RECRUITER_B_EMAIL;
  const recruiterBPassword = process.env.SUPABASE_TEST_RECRUITER_B_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (
    !seekerEmail ||
    !seekerPassword ||
    !recruiterAEmail ||
    !recruiterAPassword ||
    !recruiterBEmail ||
    !recruiterBPassword ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error("Missing dedicated messaging E2E credentials.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers();
  if (usersError) throw usersError;

  const seeker = usersPage.users.find((user) => user.email === seekerEmail);
  const recruiterA = usersPage.users.find(
    (user) => user.email === recruiterAEmail,
  );
  if (!seeker || !recruiterA) {
    throw new Error("Messaging E2E users are missing from the test project.");
  }

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .insert({
      participant_one: seeker.id,
      participant_two: recruiterA.id,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (conversationError) throw conversationError;

  const seekerMessage = `Seeker E2E ${Date.now()}`;
  const recruiterReply = `Recruiter E2E ${Date.now()}`;

  try {
    await page.goto(`/signin?next=${encodeURIComponent("/messages")}`);
    await page.getByLabel("Email").fill(seekerEmail);
    await page.getByLabel("Password").fill(seekerPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

    await page.getByLabel("Write a message").fill(seekerMessage);
    const [seekerSendResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/messages") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Send message" }).click(),
    ]);
    expect(seekerSendResponse.status()).toBe(200);
    await expect(page.getByText(seekerMessage, { exact: true })).toBeVisible();

    const replay = await page.evaluate(
      async ({ conversationId, body }) => {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, body }),
        });
        return {
          status: response.status,
          retryAfter: response.headers.get("Retry-After"),
        };
      },
      { conversationId: conversation.id, body: seekerMessage },
    );
    expect(replay.status).toBe(429);
    expect(Number(replay.retryAfter)).toBeGreaterThan(0);

    const baseURL = new URL(page.url()).origin;
    const recruiterAContext = await browser.newContext({ baseURL });
    try {
      const recruiterAPage = await recruiterAContext.newPage();
      await recruiterAPage.goto(
        `/signin?next=${encodeURIComponent("/employers/dashboard/messages")}&role=employer`,
      );
      await recruiterAPage.getByLabel("Email").fill(recruiterAEmail);
      await recruiterAPage.getByLabel("Password").fill(recruiterAPassword);
      await recruiterAPage
        .getByRole("button", { name: "Sign in to employer tools" })
        .click();
      await expect(recruiterAPage).toHaveURL(
        /\/employers\/dashboard\/messages/,
      );
      await expect(
        recruiterAPage
          .getByRole("paragraph")
          .filter({ hasText: seekerMessage }),
      ).toBeVisible();

      await recruiterAPage
        .getByPlaceholder("Write a message…")
        .fill(recruiterReply);
      const [replyResponse] = await Promise.all([
        recruiterAPage.waitForResponse(
          (response) =>
            response.url().endsWith("/api/employers/messages") &&
            response.request().method() === "POST",
        ),
        recruiterAPage.getByRole("button", { name: "Send" }).click(),
      ]);
      expect(replyResponse.status()).toBe(200);
      await expect(
        recruiterAPage
          .getByRole("paragraph")
          .filter({ hasText: recruiterReply }),
      ).toBeVisible();
    } finally {
      await recruiterAContext.close();
    }

    await expect(page.getByText(recruiterReply, { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    const recruiterBContext = await browser.newContext({ baseURL });
    try {
      const recruiterBPage = await recruiterBContext.newPage();
      await recruiterBPage.goto(
        `/signin?next=${encodeURIComponent("/employers/dashboard/messages")}&role=employer`,
      );
      await recruiterBPage.getByLabel("Email").fill(recruiterBEmail);
      await recruiterBPage.getByLabel("Password").fill(recruiterBPassword);
      await recruiterBPage
        .getByRole("button", { name: "Sign in to employer tools" })
        .click();
      await expect(recruiterBPage).toHaveURL(
        /\/employers\/dashboard\/messages/,
      );

      const deniedRead = await recruiterBPage.request.get(
        `/api/employers/messages?conversationId=${conversation.id}`,
      );
      expect(deniedRead.status()).toBe(200);
      const deniedReadPayload = (await deniedRead.json()) as {
        data: { threads: Array<{ id: string }> };
      };
      expect(
        deniedReadPayload.data.threads.some(
          (thread) => thread.id === conversation.id,
        ),
      ).toBe(false);

      const deniedSend = await recruiterBPage.request.post(
        "/api/employers/messages",
        {
          data: {
            conversationId: conversation.id,
            body: `Unauthorized E2E ${Date.now()}`,
          },
        },
      );
      expect(deniedSend.status()).toBe(404);
    } finally {
      await recruiterBContext.close();
    }
  } finally {
    const { error } = await admin
      .from("conversations")
      .delete()
      .eq("id", conversation.id);
    if (error) throw error;
  }
});
