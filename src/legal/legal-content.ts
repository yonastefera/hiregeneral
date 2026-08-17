import type { LegalApprovalStatus } from "./policy-release";

export type LegalSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  version: string;
  approvalStatus: LegalApprovalStatus;
  sections: LegalSection[];
};

export const privacyPolicyContent: LegalDocument = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  description:
    "This Privacy Policy explains how HireGeneral collects, uses, discloses, retains, and protects information from job seekers, employers, recruiters, and visitors.",
  effectiveDate: "August 16, 2026",
  version: "privacy-2026-08-16-draft",
  approvalStatus: "pending_counsel",
  sections: [
    {
      title: "1. Information we collect",
      body: [
        "HireGeneral may collect information that you provide directly when you create an account, build a job seeker profile, upload a resume, apply to a role, post a job, create a company profile, contact support, or otherwise use the platform.",
        "This information may include your name, email address, phone number, location, work history, education history, skills, resume details, job preferences, company information, billing details, messages, support requests, and communication preferences.",
      ],
    },
    {
      title: "2. Information from external sources",
      body: [
        "We may receive information from external sources, such as public professional profiles, social login providers, employer systems, application tracking tools, business partners, or publicly available sources.",
        "We may use this information to help complete profiles, improve candidate recommendations, support employer recruiting workflows, verify company information, and improve the quality of the marketplace.",
      ],
    },
    {
      title: "3. Information collected automatically",
      body: [
        "When you use HireGeneral, we may automatically collect information about your device, browser, IP address, pages viewed, searches performed, clicks, referring pages, approximate location, session activity, and interactions with job posts, profiles, messages, or employer tools.",
        "We use essential cookies and operational logs to provide sessions, protect against fraud, troubleshoot failures, and operate the platform. With your permission, we may also use Vercel Analytics, Google Analytics, and Microsoft Clarity to understand site usage and improve the service.",
      ],
    },
    {
      title: "4. How we use your information",
      body: [
        "HireGeneral uses information to provide, maintain, personalize, secure, and improve the job marketplace and employer tools.",
      ],
      bullets: [
        "Create and manage job seeker, employer, and recruiter accounts",
        "Support job applications, resumes, profiles, company pages, and job posts",
        "Recommend jobs, candidates, companies, and marketplace content",
        "Help employers manage hiring workflows and applicant activity",
        "Communicate account updates, service messages, support responses, and marketing preferences",
        "Analyze product performance, troubleshoot issues, prevent fraud, and protect platform security",
        "Comply with legal obligations and enforce our agreements",
      ],
    },
    {
      title: "5. How we disclose information",
      body: [
        "We may disclose information when necessary to operate HireGeneral, provide requested services, support hiring activity, or comply with legal obligations.",
      ],
      bullets: [
        "With the employer responsible for a role when a job seeker submits an application, including the application fields and resume selected for that application",
        "With entitled employers when a job seeker makes a profile public and discoverable in the candidate database; private profiles are not generally searchable by employers",
        "With job seekers when an employer publishes public job posts, company pages, or recruiter-facing information",
        "With service providers that help us operate hosting, analytics, security, payments, communications, customer support, and product functionality",
        "With business partners or integrations when you choose to connect third-party tools or services",
        "With authorities, courts, or other parties when required by law or necessary to protect rights, safety, security, or platform integrity",
        "In connection with a merger, acquisition, financing, restructuring, or sale of assets",
      ],
    },
    {
      title: "6. Personalized content, analytics, and advertising",
      body: [
        "Optional web analytics are not loaded until a visitor selects Accept analytics. Selecting Essential only keeps those tools disabled. Visitors can reopen Privacy choices and change that selection.",
        "HireGeneral does not currently use the optional analytics tools for targeted advertising. Essential operational logs and session technologies remain necessary to provide and secure the service.",
      ],
    },
    {
      title: "7. Your choices and rights",
      body: [
        "You can update profile information, change communication preferences, control candidate visibility, delete an uploaded resume, download a JSON export of your account data, or request account deletion through account settings.",
        "Changing a profile from public to private prevents general candidate-database discovery, but it does not retract application materials already submitted to an employer. Resume access is provided through short-lived, server-authorized links.",
        "An account-deletion request has a 14-day grace period during which it can be cancelled. After that period, HireGeneral removes or anonymizes covered account data and closes employer jobs. Active employer subscriptions are cancelled before final deletion.",
        "Some information may be retained where necessary to provide services, complete transactions, protect security, comply with legal obligations, resolve disputes, or enforce agreements.",
      ],
    },
    {
      title: "8. Opt-out rights",
      body: [
        "Depending on where you live, you may have the right to opt out of certain disclosures of personal information that may be considered a sale, sharing, or processing for targeted advertising under applicable privacy laws.",
        "If HireGeneral offers cookie settings or privacy controls, you may use those controls to manage analytics, advertising, and personalization preferences. If your browser sends a legally recognized opt-out signal, such as Global Privacy Control, we may honor that signal where required by law.",
        "We do not knowingly sell the personal information of minors under 16 years of age.",
      ],
    },
    {
      title: "9. International visitors",
      body: [
        "HireGeneral is operated from the United States. If you access the platform from outside the United States, your information may be transferred to, stored in, or processed in the United States or other countries where we or our service providers operate.",
        "Where required by applicable law, we rely on appropriate legal bases for processing personal information, such as performing our services, complying with legal obligations, protecting legitimate business interests, or obtaining consent.",
      ],
    },
    {
      title: "10. Data security",
      body: [
        "We use reasonable technical, administrative, and organizational safeguards designed to protect information from unauthorized access, loss, misuse, disclosure, alteration, or destruction.",
        "These safeguards may include limiting access to personal information, using security policies and procedures, monitoring platform activity, and using technologies designed to protect information during transmission.",
        "No internet-based service can guarantee complete security. You are responsible for keeping your account credentials confidential and for notifying us if you believe your account or information has been compromised.",
      ],
    },
    {
      title: "11. Children under 16",
      body: [
        "HireGeneral is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.",
        "If we learn that we have collected personal information from a child under 16 without appropriate consent, we will take reasonable steps to delete that information.",
      ],
    },
    {
      title: "12. Third-party links",
      body: [
        "HireGeneral may contain links to third-party websites, employer career pages, application systems, payment providers, or integrations. Information collected by those third parties is governed by their own privacy policies, not this Privacy Policy.",
        "For example, if you click an external apply link on a job post, the employer or third-party application system may collect information directly from you.",
        "A current list of service providers that process information for HireGeneral is available on our Subprocessors page.",
      ],
    },
    {
      title: "13. Retention of information",
      body: [
        "Our current operational schedule retains contact submissions for up to 12 months, read notifications for up to 180 days, and closed applications, inactive conversations, security audit events, and role audit events for up to 24 months, unless a shorter period is required or a legal, billing, fraud-prevention, dispute, or security hold applies.",
        "Account deletion begins after the 14-day cancellation period. Application or billing information already provided to an employer or payment provider may also be retained independently by that recipient under its own obligations and privacy practices.",
        "When information is no longer needed, we delete or anonymize it. Encrypted backup copies may remain inaccessible until the provider's rotating backup window expires. If a backup is restored, outstanding deletion records must be reapplied before the restored system serves users.",
      ],
    },
    {
      title: "14. California privacy notice",
      body: [
        "If you are a California resident, you may have additional rights under California privacy law, including rights to know, access, correct, delete, and receive information about certain categories of personal information we collect, use, disclose, sell, or share.",
        "The categories of personal information HireGeneral may collect can include identifiers, contact information, account credentials, employment and education information, resume and application information, employer profile information, device information, usage data, general geolocation information, and communication records.",
      ],
      bullets: [
        "We may use these categories to provide accounts, job applications, employer tools, candidate recommendations, customer support, analytics, security, fraud prevention, and legal compliance.",
        "We may disclose information to employers, job seekers, service providers, business partners, legal authorities, or other parties as described in this Privacy Policy.",
        "If HireGeneral uses advertising or analytics partners in a way considered a sale or sharing under California law, California residents may have the right to opt out.",
      ],
    },
    {
      title: "15. Sensitive personal information",
      body: [
        "HireGeneral asks users not to include sensitive information in resumes, job applications, messages, or profile materials unless it is necessary for the hiring process and you choose to provide it.",
        "Optional gender, ethnicity, veteran-status, and disability-status responses are not provided through employer candidate lists or the resume database and are not used for candidate search, ranking, matching, recommendations, applicant review, or hiring decisions.",
        "Where we process sensitive information, we limit access and use it only for disclosed and permitted purposes, such as account security, authentication, service delivery, compliance, or other purposes allowed by applicable law.",
      ],
    },
    {
      title: "16. Do Not Track",
      body: [
        "Some browsers offer a Do Not Track setting. Because there is not yet a uniform industry standard for responding to Do Not Track signals, HireGeneral may not respond to browser-initiated Do Not Track signals.",
        "Where required by applicable law, we may recognize legally required opt-out preference signals.",
      ],
    },
    {
      title: "17. Changes to this policy",
      body: [
        "We may update this Privacy Policy from time to time because of changes to our services, legal requirements, business practices, or privacy controls.",
        "If we make material changes, we may provide notice through the platform, by email, or by updating the effective date on this page. Your continued use of HireGeneral after an update means you acknowledge the revised policy.",
      ],
    },
    {
      title: "18. Contact us",
      body: [
        "For privacy questions, requests, or complaints, contact HireGeneral LLC at privacy@hiregeneral.com.",
        "Mailing address: HireGeneral LLC, 1165 Spring Wood Connector, Atlanta, GA 30328. General support is available at support@hiregeneral.com.",
      ],
    },
  ],
};

export const termsContent: LegalDocument = {
  eyebrow: "Terms",
  title: "Terms & Conditions",
  description:
    "These Terms explain the basic rules for using HireGeneral as a job seeker, employer, recruiter, company representative, or visitor.",
  effectiveDate: "August 16, 2026",
  version: "terms-2026-08-16-draft",
  approvalStatus: "pending_counsel",
  sections: [
    {
      title: "1. Acceptance of terms",
      body: [
        "These Terms & Conditions are between you and HireGeneral LLC and govern your access to and use of HireGeneral, including our job marketplace, employer tools, candidate profiles, job posts, company pages, applications, dashboards, communications, and related services.",
        "By accessing or using HireGeneral, you agree to these Terms and our Privacy Policy. If you do not agree, you should not use the platform.",
      ],
    },
    {
      title: "2. Our services",
      body: [
        "HireGeneral provides a marketplace and hiring platform that helps job seekers discover opportunities and helps employers post jobs, manage hiring activity, promote company profiles, and connect with candidates.",
        "Job seekers may create profiles, upload resumes, apply to jobs, save roles, and interact with employer listings. Employers may create company pages, publish job posts, review applicant activity, and use hiring workflow tools.",
        "Some features may be free, paid, limited, experimental, or available only to certain users or organizations.",
      ],
    },
    {
      title: "3. Changes to these terms",
      body: [
        "We may update these Terms from time to time. When we make changes, we may post the updated Terms on this page or provide notice through the platform.",
        "Your continued use of HireGeneral after changes become effective means you accept the updated Terms.",
      ],
    },
    {
      title: "4. Privacy",
      body: [
        "Information that you provide to HireGeneral, or that we collect through your use of the platform, is handled according to our Privacy Policy.",
        "You should review the Privacy Policy to understand how we may collect, use, disclose, and protect information related to job seekers, employers, recruiters, and visitors.",
      ],
    },
    {
      title: "5. User content",
      body: [
        "HireGeneral may allow users to submit, upload, publish, or display content. This may include resumes, profiles, work history, education history, job preferences, job posts, company descriptions, logos, images, messages, reviews, comments, and other materials.",
        "You are responsible for the content you submit and for making sure it is accurate, lawful, complete, appropriate, and not misleading.",
      ],
      bullets: [
        "Job seekers are responsible for the accuracy of resumes, profiles, applications, and messages.",
        "Employers are responsible for the accuracy of company pages, job posts, compensation details, hiring requirements, and application instructions.",
        "You should only submit content that you own or have permission to use.",
      ],
    },
    {
      title: "6. License to user content",
      body: [
        "By submitting content to HireGeneral, you grant HireGeneral a limited, worldwide, non-exclusive license to host, store, copy, display, publish, format, transmit, and use that content as needed to provide, operate, improve, promote, and secure the platform.",
        "For example, we may display employer job posts to job seekers, show company profile information on public company pages, or transmit job seeker application materials to employers when a job seeker applies.",
        "You retain ownership of your content, subject to the rights you grant us under these Terms.",
      ],
    },
    {
      title: "7. HireGeneral intellectual property",
      body: [
        "HireGeneral owns or licenses the platform, software, design, branding, logos, trademarks, service marks, text, graphics, interfaces, and other materials that make up the service.",
        "You may not copy, reproduce, modify, distribute, sell, lease, reverse engineer, scrape, or create derivative works from HireGeneral except as permitted by these Terms or with our written permission.",
      ],
    },
    {
      title: "8. Acceptable use",
      body: [
        "You agree to use HireGeneral only for lawful purposes and in a way that does not harm the platform, other users, candidates, employers, or third parties.",
      ],
      bullets: [
        "Do not post fake, misleading, discriminatory, unlawful, or abusive job posts, profiles, applications, or messages.",
        "Do not upload malware, spam, scraping tools, bots, or code designed to interfere with the platform.",
        "Do not use HireGeneral to harass, threaten, defame, impersonate, or invade the privacy of another person or organization.",
        "Do not access, collect, copy, or use platform data through automated means unless expressly authorized by HireGeneral.",
        "Do not interfere with platform security, availability, performance, or integrity.",
      ],
    },
    {
      title: "9. Employer responsibilities",
      body: [
        "Employers are responsible for all job posts, company information, hiring communications, application requirements, compensation details, and employment decisions made through or in connection with HireGeneral.",
        "Employers must comply with applicable employment, labor, anti-discrimination, wage transparency, privacy, and recruiting laws.",
        "Employers may use applicant and candidate information only for legitimate recruiting, hiring, and related compliance purposes. Employers must protect that information, limit access to authorized personnel, honor applicable retention and deletion obligations, and must not use protected or demographic information to make unlawful employment decisions.",
        "HireGeneral does not control employer hiring decisions, interview processes, compensation offers, job requirements, working conditions, or employment outcomes.",
      ],
    },
    {
      title: "10. Job seeker responsibilities",
      body: [
        "Job seekers are responsible for keeping their profiles, resumes, application materials, work history, education history, skills, preferences, and contact information accurate and up to date.",
        "Applying to a job or interacting with an employer through HireGeneral does not guarantee an interview, offer, employment, compensation, or any particular hiring outcome.",
      ],
    },
    {
      title: "11. Third-party links and employer sites",
      body: [
        "HireGeneral may link to third-party websites, employer career pages, application tracking systems, payment processors, integrations, or other external services.",
        "We are not responsible for third-party websites, services, content, availability, privacy practices, or terms. If you choose to use a third-party service, you do so at your own risk.",
      ],
    },
    {
      title: "12. AI and automated features",
      body: [
        "HireGeneral may use automated tools, artificial intelligence, or machine learning features to support search, recommendations, job matching, profile suggestions, job descriptions, screening workflows, fraud detection, support, or platform improvement.",
        "AI and automated features may be incomplete, inaccurate, or inappropriate for a particular use. You are responsible for reviewing outputs before relying on them or using them in hiring, application, or business decisions.",
        "Recommendations, matches, rankings, summaries, or generated content do not guarantee job fit, candidate quality, employment, hiring success, or legal compliance.",
      ],
    },
    {
      title: "13. Paid services, billing, and cancellation",
      body: [
        "When you purchase a paid employer plan or feature, you authorize HireGeneral and its payment processor, Stripe, to charge the payment method you provide for the price, billing interval, taxes, and other amounts shown at checkout.",
        "Recurring subscriptions renew for the displayed billing interval until cancelled. You may manage or cancel an eligible subscription through the billing portal. Unless the checkout terms state otherwise, cancellation takes effect at the end of the current paid period and does not retroactively refund charges already incurred.",
        "Fees are non-refundable except where required by law or expressly stated at checkout. HireGeneral may change future pricing or plan features with advance notice where required, but a change will not alter charges already paid for the current billing period.",
      ],
    },
    {
      title: "14. Disclaimers",
      body: [
        "HireGeneral is provided on an “as is” and “as available” basis. We do not guarantee that the platform will be uninterrupted, error-free, secure, current, complete, or free of harmful components.",
        "We do not guarantee any specific hiring result, job placement, applicant volume, candidate quality, offer, interview, salary, employer response, or business outcome.",
        "To the fullest extent permitted by law, HireGeneral disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, and non-infringement.",
      ],
    },
    {
      title: "15. Limitation of liability",
      body: [
        "To the fullest extent permitted by law, HireGeneral and its owners, employees, contractors, service providers, partners, and affiliates will not be liable for indirect, incidental, consequential, special, punitive, exemplary, or similar damages, including lost profits, lost data, business interruption, reputational harm, or loss of goodwill.",
        "To the fullest extent permitted by law, HireGeneral’s total liability for claims arising from or related to the platform or these Terms will not exceed the greater of the amount you paid to HireGeneral for the service giving rise to the claim during the prior twelve months or one hundred dollars.",
      ],
    },
    {
      title: "16. Indemnification",
      body: [
        "You agree to defend, indemnify, and hold harmless HireGeneral and its owners, employees, contractors, service providers, partners, and affiliates from claims, damages, liabilities, losses, costs, and expenses arising from your content, your use of the platform, your violation of these Terms, your violation of law, or your violation of another person’s or organization’s rights.",
      ],
    },
    {
      title: "17. Dispute resolution",
      body: [
        "Before filing a formal claim, the complaining party must send a written notice describing the dispute, the facts supporting the claim, the requested resolution, and current contact information to legal@hiregeneral.com or the mailing address in the Contact section.",
        "The parties will attempt in good faith to resolve the dispute for 30 days after the notice is received. If it is not resolved, either party may pursue available remedies in court. Nothing in this section prevents either party from seeking urgent injunctive relief or using an eligible small-claims procedure.",
      ],
    },
    {
      title: "18. Governing law and venue",
      body: [
        "These Terms and disputes arising from them are governed by the laws of the State of Georgia, without regard to conflict-of-law rules, except where applicable law requires otherwise.",
        "Subject to any non-waivable rights under applicable law, state and federal courts serving Fulton County, Georgia will have exclusive jurisdiction and venue over disputes arising from these Terms or the platform.",
      ],
    },
    {
      title: "19. Suspension and termination",
      body: [
        "HireGeneral may suspend, restrict, or terminate access to the platform if we believe a user has violated these Terms, created risk for the platform or other users, engaged in unlawful activity, or used the services in a way that harms the marketplace.",
        "You may stop using HireGeneral at any time. Certain provisions of these Terms will continue to apply after termination where reasonably intended to survive, including provisions related to user content licenses, disclaimers, limitation of liability, indemnification, dispute resolution, and intellectual property.",
      ],
    },
    {
      title: "20. Assignment",
      body: [
        "HireGeneral may assign or transfer its rights and obligations under these Terms in connection with a merger, acquisition, financing, restructuring, sale of assets, or other business transaction.",
        "You may not assign or transfer your rights or obligations under these Terms without HireGeneral’s prior written consent.",
      ],
    },
    {
      title: "21. Severability and waiver",
      body: [
        "If any provision of these Terms is found invalid or unenforceable, that provision will be modified or limited to the extent necessary so the remaining Terms remain in effect.",
        "HireGeneral’s failure to enforce any provision of these Terms is not a waiver of our right to enforce that provision later.",
      ],
    },
    {
      title: "22. Entire agreement",
      body: [
        "These Terms, together with the Privacy Policy and any additional policies or agreements that apply to specific services, make up the agreement between you and HireGeneral regarding your use of the platform.",
      ],
    },
    {
      title: "23. Contact",
      body: [
        "For questions or formal notices about these Terms, contact HireGeneral LLC at legal@hiregeneral.com.",
        "Mailing address: HireGeneral LLC, 1165 Spring Wood Connector, Atlanta, GA 30328. General support is available at support@hiregeneral.com.",
      ],
    },
  ],
};
