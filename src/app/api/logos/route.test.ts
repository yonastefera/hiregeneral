import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

const originalToken = process.env.LOGO_DEV_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.LOGO_DEV_TOKEN;
  else process.env.LOGO_DEV_TOKEN = originalToken;
});

describe("GET /api/logos", () => {
  it("returns a valid image fallback when the optional provider is disabled", async () => {
    delete process.env.LOGO_DEV_TOKEN;
    const response = await GET(
      new NextRequest("https://hiregeneral.test/api/logos?domain=example.com"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(await response.text()).toContain(">EX</text>");
  });

  it("rejects invalid domains without contacting a provider", async () => {
    const response = await GET(
      new NextRequest(
        "https://hiregeneral.test/api/logos?domain=https://invalid/path",
      ),
    );

    expect(response.status).toBe(400);
  });
});
