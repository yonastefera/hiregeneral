import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Page } from "@playwright/test";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function playwrightSameSite(value: CookieOptions["sameSite"]) {
  if (!value) return undefined;
  if (value === true) return "Strict" as const;
  const normalized = value.toLowerCase();
  if (normalized === "lax") return "Lax" as const;
  if (normalized === "strict") return "Strict" as const;
  if (normalized === "none") return "None" as const;
  return undefined;
}

/**
 * Establishes a real Supabase session without coupling authenticated E2E tests
 * to email delivery. Passwords remain test-fixture credentials only; the
 * customer-facing browser flow is covered separately as passwordless OTP.
 */
export async function signInTestUser(
  page: Page,
  credentials: { email: string; password: string },
  destination: string,
) {
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing dedicated Supabase E2E client configuration.");
  }

  // Resolve the actual configured Playwright origin before attaching cookies.
  await page.goto("/");
  const baseUrl = new URL(page.url()).origin;

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        pendingCookies.push(...cookies);
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    throw new Error(
      `Could not establish the E2E test session: ${error.message}`,
    );
  }

  await page.context().addCookies(
    pendingCookies.map(({ name, value, options }) => ({
      name,
      value,
      url: baseUrl,
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: playwrightSameSite(options.sameSite),
      expires:
        typeof options.maxAge === "number"
          ? Math.floor(Date.now() / 1000) + options.maxAge
          : undefined,
    })),
  );

  await page.goto(destination);
}
