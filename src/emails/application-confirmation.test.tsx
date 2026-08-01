import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import ApplicationConfirmation from "@/emails/application-confirmation";

describe("ApplicationConfirmation", () => {
  it("escapes applicant and job content when rendering HTML", async () => {
    const html = await render(
      ApplicationConfirmation({
        applicantName: '<img src=x onerror="alert(1)">',
        applicantEmail: "avery@example.com",
        jobTitle: "Engineer <script>alert(1)</script>",
        companyName: "Acme & Partners",
      }),
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Acme &amp; Partners");
  });
});
