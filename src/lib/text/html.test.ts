import { describe, expect, it } from "vitest";

import { htmlToText, sanitizeJobPostingHtml } from "@/lib/text/html";

describe("sanitizeJobPostingHtml", () => {
  it("preserves job-posting content", () => {
    const result = sanitizeJobPostingHtml(
      "<h2>Responsibilities</h2><ul><li>Build reliable products</li></ul>",
    );

    expect(htmlToText(result)).toContain("Responsibilities");
    expect(htmlToText(result)).toContain("Build reliable products");
  });

  it("removes scripts, event handlers, links, and unsupported attributes", () => {
    const result = sanitizeJobPostingHtml(
      '<script>alert("bad")</script><p onclick="bad()">Join <a href="https://malicious.example">our team</a>.</p>',
    );

    expect(htmlToText(result)).toBe("Join our team .");
    expect(result).not.toMatch(/script|onclick|href|malicious/i);
  });
});

describe("htmlToText", () => {
  it("converts structured HTML into readable plain text", () => {
    expect(
      htmlToText("<h2>Benefits</h2><ul><li>Health</li><li>Dental</li></ul>"),
    ).toBe("Benefits\n• Health\n• Dental");
  });
});
