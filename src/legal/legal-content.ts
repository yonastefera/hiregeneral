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
  sections: LegalSection[];
};

export const privacyPolicyContent: LegalDocument = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  description:
    "This sample Privacy Policy explains how HireGeneral may collect, use, disclose, and protect information from job seekers, employers, recruiters, and visitors.",
  effectiveDate: "May 17, 2026",
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
        "We may use cookies, pixels, analytics tools, log files, and similar technologies to operate the platform, remember preferences, improve performance, protect against fraud, and understand how users interact with our services.",
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
        "With employers when a job seeker applies to a role, shares a profile, or interacts with an employer-controlled job post",
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
        "HireGeneral may use analytics and advertising technologies to understand platform usage, improve recommendations, measure campaign performance, and show relevant content.",
        "Depending on your settings and applicable law, you may be able to manage cookies, opt out of certain marketing communications, or adjust privacy preferences through your browser, device, email settings, or account controls.",
      ],
    },
    {
      title: "7. Your choices and rights",
      body: [
        "You may have choices regarding the personal information associated with your HireGeneral account. These choices may include updating profile information, changing communication preferences, adjusting candidate visibility, deleting your account, or requesting access, correction, or deletion of certain information.",
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
      ],
    },
    {
      title: "13. Retention of information",
      body: [
        "We generally retain personal information for as long as reasonably necessary to provide the platform, support hiring activity, comply with legal obligations, resolve disputes, maintain security, and enforce agreements.",
        "Retention periods may vary depending on the type of information, sensitivity of the information, user settings, account status, legal requirements, and operational needs.",
        "When information is no longer needed, we may delete it, anonymize it, aggregate it, or take other appropriate steps. Backup copies may persist for a limited period for business continuity and security purposes.",
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
        "Where we process sensitive information, we use it only for disclosed and permitted purposes, such as account security, authentication, service delivery, compliance, or other purposes allowed by applicable law.",
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
        "For privacy questions, requests, or complaints, contact HireGeneral at privacy@hiregeneral.com.",
        "This is placeholder contact information for now. Replace it with the final company legal contact, mailing address, and support email before launch.",
      ],
    },
  ],
};

export const termsContent: LegalDocument = {
  eyebrow: "Terms",
  title: "Terms & Conditions",
  description:
    "These sample Terms explain the basic rules for using HireGeneral as a job seeker, employer, recruiter, company representative, or visitor.",
  effectiveDate: "May 17, 2026",
  sections: [
    {
      title: "1. Acceptance of terms",
      body: [
        "These Terms & Conditions govern your access to and use of HireGeneral, including our job marketplace, employer tools, candidate profiles, job posts, company pages, applications, dashboards, communications, and related services.",
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
      title: "13. Disclaimers",
      body: [
        "HireGeneral is provided on an “as is” and “as available” basis. We do not guarantee that the platform will be uninterrupted, error-free, secure, current, complete, or free of harmful components.",
        "We do not guarantee any specific hiring result, job placement, applicant volume, candidate quality, offer, interview, salary, employer response, or business outcome.",
        "To the fullest extent permitted by law, HireGeneral disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, and non-infringement.",
      ],
    },
    {
      title: "14. Limitation of liability",
      body: [
        "To the fullest extent permitted by law, HireGeneral and its owners, employees, contractors, service providers, partners, and affiliates will not be liable for indirect, incidental, consequential, special, punitive, exemplary, or similar damages, including lost profits, lost data, business interruption, reputational harm, or loss of goodwill.",
        "To the fullest extent permitted by law, HireGeneral’s total liability for claims arising from or related to the platform or these Terms will not exceed the greater of the amount you paid to HireGeneral for the service giving rise to the claim during the prior twelve months or one hundred dollars.",
      ],
    },
    {
      title: "15. Indemnification",
      body: [
        "You agree to defend, indemnify, and hold harmless HireGeneral and its owners, employees, contractors, service providers, partners, and affiliates from claims, damages, liabilities, losses, costs, and expenses arising from your content, your use of the platform, your violation of these Terms, your violation of law, or your violation of another person’s or organization’s rights.",
      ],
    },
    {
      title: "16. Dispute resolution",
      body: [
        "If a dispute arises, we encourage you to contact HireGeneral first so we can try to resolve the issue informally.",
        "Before filing a formal claim, you agree to send a written notice describing the dispute, the facts supporting your claim, your requested resolution, and your contact information. HireGeneral may also send you a similar notice if we have a dispute with you.",
        "The parties agree to attempt in good faith to resolve the dispute informally before pursuing arbitration, small claims court, or other legal proceedings where permitted by law.",
      ],
    },
    {
      title: "17. Arbitration procedures",
      body: [
        "Where permitted by law, disputes that are not resolved through the informal dispute process may be resolved through binding individual arbitration or, where available, small claims court.",
        "Any arbitration would be conducted by a neutral arbitrator under rules selected in the final legal version of these Terms. The arbitrator may decide issues related to the dispute, the scope of the arbitration agreement, and the relief available, except where applicable law requires a court to decide a particular issue.",
        "Arbitration is generally more streamlined than court litigation. The parties may have more limited discovery and more limited appellate review than they would in court.",
      ],
    },
    {
      title: "18. Class action and jury trial waiver",
      body: [
        "To the fullest extent permitted by law, you and HireGeneral agree that disputes will be resolved only on an individual basis and not as part of a class, collective, consolidated, representative, or private attorney general action.",
        "To the fullest extent permitted by law, you and HireGeneral waive the right to a jury trial for disputes arising out of or related to these Terms or the platform.",
        "If any part of this section is found unenforceable for a particular claim or remedy, that claim or remedy may proceed only as required by applicable law, and the remaining enforceable portions will continue to apply.",
      ],
    },
    {
      title: "19. Mass arbitration procedures",
      body: [
        "If multiple similar arbitration demands are filed by the same or coordinated counsel, the final legal version of these Terms may require staged or bellwether procedures designed to manage those disputes efficiently and fairly.",
        "These procedures may include batching similar claims, delaying the filing or processing of later claims, tolling applicable limitations periods, and using a process administrator or arbitrator to manage procedural issues.",
        "This placeholder section should be reviewed carefully by legal counsel before launch.",
      ],
    },
    {
      title: "20. Arbitration opt-out",
      body: [
        "The final legal version of these Terms may allow users to opt out of arbitration within a specified period after accepting the Terms by sending written notice to a designated legal contact.",
        "If HireGeneral offers an arbitration opt-out, the final Terms should state the exact deadline, required contact information, email or mailing address, and information the user must include in the opt-out notice.",
      ],
    },
    {
      title: "21. Governing law and jurisdiction",
      body: [
        "The final legal version of these Terms should identify the governing law and the courts or forum where disputes may be brought when arbitration does not apply.",
        "For this placeholder version, any governing law, venue, and jurisdiction language should be confirmed by legal counsel based on HireGeneral’s business entity, operating location, and user base.",
      ],
    },
    {
      title: "22. Waiver of jury trial",
      body: [
        "To the extent a dispute is not subject to arbitration and to the extent permitted by applicable law, you and HireGeneral waive the right to a jury trial in any action, suit, or proceeding arising from or related to these Terms or the platform.",
      ],
    },
    {
      title: "23. Class action waiver",
      body: [
        "To the extent a dispute is not subject to arbitration and to the extent permitted by applicable law, you agree not to bring or participate in a class, collective, consolidated, representative, or private attorney general action against HireGeneral related to your use of the platform.",
      ],
    },
    {
      title: "24. Suspension and termination",
      body: [
        "HireGeneral may suspend, restrict, or terminate access to the platform if we believe a user has violated these Terms, created risk for the platform or other users, engaged in unlawful activity, or used the services in a way that harms the marketplace.",
        "You may stop using HireGeneral at any time. Certain provisions of these Terms will continue to apply after termination where reasonably intended to survive, including provisions related to user content licenses, disclaimers, limitation of liability, indemnification, dispute resolution, and intellectual property.",
      ],
    },
    {
      title: "25. Assignment",
      body: [
        "HireGeneral may assign or transfer its rights and obligations under these Terms in connection with a merger, acquisition, financing, restructuring, sale of assets, or other business transaction.",
        "You may not assign or transfer your rights or obligations under these Terms without HireGeneral’s prior written consent.",
      ],
    },
    {
      title: "26. Severability and waiver",
      body: [
        "If any provision of these Terms is found invalid or unenforceable, that provision will be modified or limited to the extent necessary so the remaining Terms remain in effect.",
        "HireGeneral’s failure to enforce any provision of these Terms is not a waiver of our right to enforce that provision later.",
      ],
    },
    {
      title: "27. Entire agreement",
      body: [
        "These Terms, together with the Privacy Policy and any additional policies or agreements that apply to specific services, make up the agreement between you and HireGeneral regarding your use of the platform.",
      ],
    },
    {
      title: "28. Contact",
      body: [
        "For questions about these Terms, contact HireGeneral at legal@hiregeneral.com.",
        "This is placeholder contact information. Replace it with HireGeneral’s final legal contact, company address, and support email before launch.",
      ],
    },
  ],
};
