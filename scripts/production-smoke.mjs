import process from "node:process";

const confirmation = process.env.ALLOW_PRODUCTION_SMOKE;
const configuredBaseUrl = process.env.PRODUCTION_SMOKE_BASE_URL;

if (confirmation !== "YES_I_UNDERSTAND") {
  throw new Error(
    "Set ALLOW_PRODUCTION_SMOKE=YES_I_UNDERSTAND to confirm a read-only production check.",
  );
}

let baseUrl;
try {
  baseUrl = new URL(configuredBaseUrl);
} catch {
  throw new Error("PRODUCTION_SMOKE_BASE_URL must be a valid URL.");
}

if (
  baseUrl.protocol !== "https:" ||
  ["localhost", "127.0.0.1"].includes(baseUrl.hostname)
) {
  throw new Error("Production smoke tests require a non-local HTTPS URL.");
}

async function request(path, expectedContentType) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: { "user-agent": "HireGeneral-Launch-Smoke/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}.`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes(expectedContentType)) {
    throw new Error(`${path} returned unexpected content type.`);
  }
  return response;
}

const healthResponse = await request("/api/health", "application/json");
const health = await healthResponse.json();
if (health.status !== "healthy") {
  throw new Error("Production health endpoint is not healthy.");
}

const homeResponse = await request("/", "text/html");
for (const header of [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
]) {
  if (!homeResponse.headers.has(header)) {
    throw new Error(`Production response is missing ${header}.`);
  }
}

await Promise.all([
  request("/jobs", "text/html"),
  request("/robots.txt", "text/plain"),
  request("/sitemap.xml", "application/xml"),
]);

console.log(
  "Production smoke test passed: health, public pages, crawler files, and security headers.",
);
