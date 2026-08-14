import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import ConfirmEmail from "@/emails/confirm-email";
import JobAlertEmail from "@/emails/job-alert";
import ResetPassword from "@/emails/reset-password";

describe("transactional email rendering", () => {
  it.each([
    [
      "confirmation",
      <ConfirmEmail
        key="confirmation"
        confirmUrl="https://hiregeneral.test/confirm?token=one&next=/jobs"
        fullName={'<img src=x onerror="alert(1)">'}
      />,
    ],
    [
      "password reset",
      <ResetPassword
        key="reset"
        resetUrl="https://hiregeneral.test/reset?token=one&next=/profile"
        fullName={'<script>alert("x")</script>'}
      />,
    ],
  ])("escapes user content in the %s email", async (_name, email) => {
    const html = await render(email);
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;");
  });

  it("escapes job-alert fields and limits rendered jobs", async () => {
    const jobs = Array.from({ length: 8 }, (_, index) => ({
      companyName: `<Acme ${index}>`,
      title: `Engineer ${index} <script>`,
      url: `https://hiregeneral.test/jobs/${index}`,
    }));
    const html = await render(
      <JobAlertEmail jobs={jobs} fullName="<Candidate>" />,
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;Candidate&gt;");
    expect(html).toContain("Engineer 5");
    expect(html).not.toContain("Engineer 6");
  });
});
