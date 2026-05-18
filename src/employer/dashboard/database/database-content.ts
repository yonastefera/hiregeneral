export type ResumeExperience = {
  company: string;
  role: string;
  period: string;
  bullets: string[];
};

export type ResumeEducation = {
  school: string;
  degree: string;
  period: string;
};

export type ResumeMatch = {
  name: string;
  title: string;
  location: string;
  skills: string[];
  match: number;
  openToOffers: boolean;
  email: string;
  phone: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
};

export const jobMatchOptions = [
  "Senior Product Designer",
  "Staff Backend Engineer",
  "Growth Marketing Lead",
  "Customer Success Manager",
] as const;

export const resumeMatches: ResumeMatch[] = [
  {
    name: "Eleanor Park",
    title: "Principal Designer · ex-Airbnb",
    location: "Seattle, WA",
    skills: ["Figma", "Design Systems", "Mobile"],
    match: 97,
    openToOffers: true,
    email: "eleanor.park@hire.dev",
    phone: "+1 (206) 555-0142",
    summary:
      "Principal product designer with 12 years building consumer and enterprise software. Previously led design systems and growth surfaces at Airbnb.",
    experience: [
      {
        company: "Airbnb",
        role: "Principal Designer, Design Systems",
        period: "2020 — Present",
        bullets: [
          "Owned cross-platform DLS adopted by 400+ engineers.",
          "Shipped redesigned host onboarding (+18% activation).",
        ],
      },
      {
        company: "Square",
        role: "Senior Product Designer",
        period: "2016 — 2020",
        bullets: [
          "Led the merchant payments dashboard refresh.",
          "Drove accessibility audit covering 60 screens.",
        ],
      },
    ],
    education: [
      {
        school: "Rhode Island School of Design",
        degree: "BFA, Graphic Design",
        period: "2008 — 2012",
      },
    ],
  },
  {
    name: "Marcus Holloway",
    title: "Senior Backend Engineer · ex-Stripe",
    location: "Remote · US",
    skills: ["Go", "Postgres", "Kafka"],
    match: 94,
    openToOffers: true,
    email: "marcus.h@hire.dev",
    phone: "+1 (415) 555-0199",
    summary:
      "Backend engineer specializing in distributed systems, payments and reliability. 9 years across Stripe and Block.",
    experience: [
      {
        company: "Stripe",
        role: "Senior Backend Engineer, Payments",
        period: "2019 — Present",
        bullets: [
          "Authored the routing layer powering 2B+ requests/day.",
          "Cut p99 latency by 32% via async batching.",
        ],
      },
      {
        company: "Block",
        role: "Backend Engineer",
        period: "2016 — 2019",
        bullets: [
          "Built the merchant settlement ledger.",
          "Mentored 5 new hires.",
        ],
      },
    ],
    education: [
      {
        school: "Carnegie Mellon University",
        degree: "BS, Computer Science",
        period: "2012 — 2016",
      },
    ],
  },
  {
    name: "Sofia Reyes",
    title: "Growth Marketer · ex-Notion",
    location: "Brooklyn, NY",
    skills: ["SEO", "Lifecycle", "Paid"],
    match: 91,
    openToOffers: false,
    email: "sofia.reyes@hire.dev",
    phone: "+1 (917) 555-0167",
    summary:
      "Growth marketer who blends quantitative rigor with brand instincts. Drove acquisition for two Series C SaaS companies.",
    experience: [
      {
        company: "Notion",
        role: "Growth Marketing Lead",
        period: "2021 — Present",
        bullets: [
          "Owned organic acquisition (+42% YoY).",
          "Launched lifecycle program reaching 4M users.",
        ],
      },
    ],
    education: [
      {
        school: "NYU Stern",
        degree: "BS, Marketing",
        period: "2013 — 2017",
      },
    ],
  },
  {
    name: "Kai Tanaka",
    title: "Product Designer · ex-Linear",
    location: "Tokyo, JP",
    skills: ["Motion", "Brand", "UI"],
    match: 89,
    openToOffers: true,
    email: "kai@hire.dev",
    phone: "+81 (3) 5555-0143",
    summary:
      "Product designer focused on motion and craft. 6 years at Linear shipping UI for engineering tools.",
    experience: [
      {
        company: "Linear",
        role: "Product Designer",
        period: "2020 — Present",
        bullets: ["Designed the new Cycles UI.", "Led brand refresh in 2024."],
      },
    ],
    education: [
      {
        school: "Musashino Art University",
        degree: "BA, Visual Communication",
        period: "2014 — 2018",
      },
    ],
  },
  {
    name: "Aria Bennett",
    title: "Customer Success Lead · ex-Intercom",
    location: "Dublin, IE",
    skills: ["B2B SaaS", "Onboarding"],
    match: 86,
    openToOffers: true,
    email: "aria@hire.dev",
    phone: "+353 1 555 0118",
    summary:
      "Customer success leader scaling teams from 5 to 40 across mid-market and enterprise.",
    experience: [
      {
        company: "Intercom",
        role: "Customer Success Lead",
        period: "2019 — Present",
        bullets: [
          "Lifted NRR from 102% to 118%.",
          "Built playbooks adopted org-wide.",
        ],
      },
    ],
    education: [
      {
        school: "Trinity College Dublin",
        degree: "BA, Business & Economics",
        period: "2011 — 2015",
      },
    ],
  },
  {
    name: "Noah Williams",
    title: "Staff Frontend Engineer · ex-Vercel",
    location: "Remote · EU",
    skills: ["React", "TS", "Edge"],
    match: 84,
    openToOffers: false,
    email: "noah@hire.dev",
    phone: "+44 20 5555 0177",
    summary:
      "Staff engineer focused on frontend performance and edge compute. Contributor to Next.js.",
    experience: [
      {
        company: "Vercel",
        role: "Staff Frontend Engineer",
        period: "2021 — Present",
        bullets: [
          "Shipped streaming RSC support.",
          "Reduced TTI by 28% across templates.",
        ],
      },
    ],
    education: [
      {
        school: "University of Bristol",
        degree: "BSc, Computer Science",
        period: "2013 — 2016",
      },
    ],
  },
];
