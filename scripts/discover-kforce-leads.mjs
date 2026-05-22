#!/usr/bin/env node

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const KFORCE_SEARCH_PAGE =
  "https://www.kforce.com/find-work/search-jobs/#/?t=software&l=%5B%5D";
const KFORCE_INDEX = "kforcewebjobentity";
const API_VERSION = "2016-09-01";
const DEFAULT_QUERY = "software";
const DEFAULT_LIMIT = 100;
const DEFAULT_TOP = 20;
const DEFAULT_OUTPUT = "data/kforce-leads.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {
    query: DEFAULT_QUERY,
    limit: DEFAULT_LIMIT,
    top: DEFAULT_TOP,
    json: false,
    candidatesOnly: false,
    write: false,
    output: DEFAULT_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
      continue;
    }

    if (arg === "--candidates-only") {
      args.candidatesOnly = true;
      continue;
    }

    if (arg === "--write") {
      args.write = true;
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      args.output = argv[index + 1] || args.output;
      index += 1;
      continue;
    }

    if (arg === "--query" || arg === "-q") {
      args.query = argv[index + 1] || args.query;
      index += 1;
      continue;
    }

    if (arg === "--limit" || arg === "-l") {
      args.limit = Number(argv[index + 1]) || args.limit;
      index += 1;
      continue;
    }

    if (arg === "--top" || arg === "-t") {
      args.top = Number(argv[index + 1]) || args.top;
      index += 1;
    }
  }

  args.limit = Math.min(Math.max(args.limit, 1), 500);
  args.top = Math.min(Math.max(args.top, 1), 50);
  args.outputPath = path.resolve(REPO_ROOT, args.output);
  return args;
}

function request(url, options = {}, redirects = 0) {
  const method = options.method || "GET";
  const body = options.body || "";
  const headers = {
    "User-Agent": "HireGeneralLeadDiscovery/1.0",
    Accept: "application/json,text/html",
    ...(options.headers || {}),
  };

  if (body && !headers["Content-Length"]) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location &&
        redirects < 5
      ) {
        resolve(
          request(
            absoluteUrl(url, res.headers.location),
            options,
            redirects + 1,
          ),
        );
        return;
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new Error(
              `Request failed ${res.statusCode} for ${url}: ${data.slice(
                0,
                300,
              )}`,
            ),
          );
          return;
        }
        resolve(data);
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function requestJson(url, options = {}) {
  const text = await request(url, options);
  return JSON.parse(text);
}

function absoluteUrl(baseUrl, maybeUrl) {
  return new URL(maybeUrl, baseUrl).toString();
}

function parseKforceAppScript(html) {
  const match = html.match(/["']([^"']*app\.min\.js[^"']*)["']/i);

  if (!match) {
    throw new Error("Could not find Kforce app bundle in search page.");
  }

  return absoluteUrl(KFORCE_SEARCH_PAGE, match[1]);
}

function parseKforceSearchConfig(js) {
  const configMatch = js.match(
    /url:"(https:\/\/[^"]+\.search\.windows\.net)",key:"([^"]+)"/,
  );

  if (!configMatch) {
    throw new Error("Could not find Kforce public search config.");
  }

  return {
    serviceUrl: configMatch[1],
    apiKey: configMatch[2],
  };
}

async function loadKforceSearchConfig() {
  const html = await request(KFORCE_SEARCH_PAGE, {
    headers: { Accept: "text/html" },
  });
  const appScriptUrl = parseKforceAppScript(html);
  const js = await request(appScriptUrl, {
    headers: { Accept: "application/javascript,text/javascript,*/*" },
  });

  return parseKforceSearchConfig(js);
}

async function fetchKforceJobs(config, query, limit) {
  const jobs = [];
  const batchSize = Math.min(limit, 50);

  for (let skip = 0; skip < limit; skip += batchSize) {
    const url = `${config.serviceUrl}/indexes/${KFORCE_INDEX}/docs/search?api-version=${API_VERSION}`;
    const body = JSON.stringify({
      count: true,
      select:
        "Industry, Title, Id, PostDate, Responsibilities, Skills, City, State, Zip, SalaryText, ReferenceCode, TypeCode, ClientIndustry",
      facets: ["Industry", "TypeCode", "ClientIndustry", "TKSkills"],
      filter: "Industry eq 'Technology'",
      queryType: "simple",
      search: query,
      searchFields:
        "Industry, Title, Responsibilities, Skills, City, State, Zip",
      highlight: "Responsibilities",
      searchMode: "any",
      skip,
      top: batchSize,
    });

    const data = await requestJson(url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "api-key": config.apiKey,
      },
    });

    jobs.push(...(data.value || []));
    if (!data.value || data.value.length < batchSize) break;
  }

  return jobs.slice(0, limit);
}

function textOf(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactJob(job) {
  const city = textOf(job.City);
  const state = textOf(job.State);
  const location = [city, state].filter(Boolean).join(", ");

  return {
    id: textOf(job.Id),
    title: textOf(job.Title),
    location,
    city,
    state,
    industry: textOf(job.ClientIndustry || job.Industry),
    jobType: textOf(job.TypeCode),
    postedAt: textOf(job.PostDate),
    referenceCode: textOf(job.ReferenceCode),
    responsibilities: textOf(job.Responsibilities),
    skills: textOf(job.Skills),
  };
}

function existingSourceCompanies() {
  const migrationDir = path.join(REPO_ROOT, "src", "lib", "migrations");
  if (!fs.existsSync(migrationDir)) return new Set();

  const companies = new Set();
  for (const filename of fs.readdirSync(migrationDir)) {
    if (!filename.endsWith(".sql")) continue;
    const sql = fs.readFileSync(path.join(migrationDir, filename), "utf8");
    const insertPattern =
      /\(\s*'((?:[^']|'')+)'\s*,\s*'[^']*'\s*,\s*'(?:greenhouse|lever|workday|oracle_hcm|ashby|rss|csv|scraper|successfactors|phenom)'/g;
    let match;
    while ((match = insertPattern.exec(sql))) {
      companies.add(match[1].replace(/''/g, "'").toLowerCase());
    }
  }

  return companies;
}

const MARKET_SIGNALS = [
  {
    companies: [
      "Bank of America",
      "Truist Financial Corporation",
      "Wells Fargo",
    ],
    reason: "banking and financial technology",
    industryPatterns: [/bank/i, /financial services/i, /consumer lending/i],
    patterns: [/capital markets/i, /payments?/i],
    metros: [/charlotte/i, /richmond/i, /atlanta/i, /new york/i],
  },
  {
    companies: ["JPMorgan Chase", "Citi", "Morgan Stanley", "Goldman Sachs"],
    reason: "capital markets and enterprise finance",
    industryPatterns: [/financial services/i, /bank/i, /investment/i],
    patterns: [
      /capital markets/i,
      /low-latency trading/i,
      /wealth management/i,
    ],
    metros: [/new york/i, /jersey city/i, /tampa/i, /dallas/i, /plano/i],
  },
  {
    companies: ["Visa", "Mastercard", "FIS", "Fiserv", "Global Payments"],
    reason: "payments and fintech",
    industryPatterns: [/financial services/i, /bank/i, /payment/i],
    patterns: [
      /payment/i,
      /card processing/i,
      /merchant/i,
      /fraud/i,
      /fintech/i,
    ],
    metros: [/atlanta/i, /san francisco/i, /austin/i, /jacksonville/i],
  },
  {
    companies: [
      "UnitedHealth Group",
      "CVS Health",
      "The Cigna Group",
      "Humana",
    ],
    reason: "healthcare technology",
    industryPatterns: [/healthcare/i, /health insurance/i, /health services/i],
    patterns: [/clinical/i, /claims/i, /payer/i, /provider/i],
    metros: [/minneapolis/i, /hartford/i, /louisville/i, /phoenix/i, /remote/i],
  },
  {
    companies: [
      "Cardinal Health",
      "McKesson Corporation",
      "Thermo Fisher Scientific",
    ],
    reason: "healthcare distribution and life sciences technology",
    industryPatterns: [
      /biotechnology/i,
      /pharmaceutical/i,
      /healthcare/i,
      /medical/i,
    ],
    patterns: [/life sciences/i, /medical device/i, /pharma/i],
    metros: [/columbus/i, /irving/i, /dallas/i, /nashville/i],
  },
  {
    companies: [
      "Delta Air Lines",
      "American Airlines",
      "United Airlines",
      "Southwest Airlines",
    ],
    reason: "airline and travel technology",
    industryPatterns: [/airline/i, /travel/i, /transportation/i],
    patterns: [/reservation/i, /crew/i, /flight operations/i],
    metros: [/atlanta/i, /dallas/i, /fort worth/i, /chicago/i, /denver/i],
  },
  {
    companies: ["Home Depot", "Lowe's", "Target", "Best Buy", "Starbucks"],
    reason: "retail and customer commerce platforms",
    industryPatterns: [/retail/i, /consumer goods/i],
    patterns: [
      /commerce platform/i,
      /supply chain/i,
      /point of sale/i,
      /\bpos\b/i,
    ],
    metros: [/atlanta/i, /charlotte/i, /minneapolis/i, /seattle/i],
  },
  {
    companies: ["Marriott International", "Hilton", "Hyatt"],
    reason: "hospitality and booking platforms",
    industryPatterns: [/hospitality/i, /hotel/i, /travel/i],
    patterns: [/booking platform/i, /reservation system/i],
    metros: [/bethesda/i, /mclean/i, /chicago/i, /dallas/i],
  },
  {
    companies: [
      "CBRE",
      "JLL",
      "Cortland",
      "AvalonBay Communities",
      "Related Group",
    ],
    reason: "real estate and property management software",
    industryPatterns: [/real estate/i, /property management/i, /construction/i],
    patterns: [/property management/i, /facilities/i],
    metros: [/miami/i, /atlanta/i, /dallas/i, /chicago/i, /new york/i],
  },
  {
    companies: ["AT&T", "Verizon", "T-Mobile", "Lumen"],
    reason: "telecom and network platforms",
    industryPatterns: [/telecom/i, /communications/i],
    patterns: [/wireless/i, /fiber/i, /5g/i, /network platform/i],
    metros: [/dallas/i, /bedminster/i, /seattle/i, /denver/i],
  },
  {
    companies: ["Amazon", "Microsoft", "Costco", "Starbucks"],
    reason: "Seattle-area technology hiring",
    patterns: [],
    metros: [/seattle/i, /bellevue/i, /redmond/i],
    requirePattern: false,
    requireMetro: true,
    baseScore: 1,
    metroWeight: 2,
  },
  {
    companies: [
      "Cox Communications",
      "Equifax",
      "NCR Voyix",
      "UPS",
      "Southern Company",
    ],
    reason: "Atlanta enterprise technology hiring",
    patterns: [],
    metros: [/atlanta/i, /alpharetta/i, /sandy springs/i],
    requirePattern: false,
    requireMetro: true,
    baseScore: 1,
    metroWeight: 2,
  },
  {
    companies: [
      "Kaseya",
      "Ryder",
      "Lennar",
      "Royal Caribbean Group",
      "Citadel Securities",
    ],
    reason: "South Florida technology hiring",
    patterns: [],
    metros: [/miami/i, /fort lauderdale/i, /boca raton/i],
    requirePattern: false,
    requireMetro: true,
    baseScore: 1,
    metroWeight: 2,
  },
  {
    companies: [
      "Capital One",
      "Toyota",
      "McKesson Corporation",
      "Charles Schwab",
      "AT&T",
    ],
    reason: "Dallas and Plano technology hiring",
    patterns: [],
    metros: [/dallas/i, /plano/i, /irving/i, /coppell/i, /fort worth/i],
    requirePattern: false,
    requireMetro: true,
    baseScore: 1,
    metroWeight: 2,
  },
  {
    companies: [
      "Discover",
      "AbbVie",
      "Grainger",
      "McDonald's",
      "United Airlines",
    ],
    reason: "Chicago-area technology hiring",
    patterns: [],
    metros: [/chicago/i, /deerfield/i, /northbrook/i],
    requirePattern: false,
    requireMetro: true,
    baseScore: 1,
    metroWeight: 2,
  },
];

function jobHaystack(job) {
  return [
    job.title,
    job.location,
    job.industry,
    job.jobType,
    job.responsibilities,
    job.skills,
  ]
    .join(" ")
    .toLowerCase();
}

function scoreJobForSignal(job, signal) {
  const haystack = jobHaystack(job);
  const industry = job.industry.toLowerCase();
  const location = job.location.toLowerCase();
  const industryMatches = (signal.industryPatterns || []).filter((pattern) =>
    pattern.test(industry),
  );
  const patternMatches = signal.patterns.filter((pattern) =>
    pattern.test(haystack),
  );
  const metroMatches = signal.metros.filter((pattern) =>
    pattern.test(location),
  );
  const requirePattern = signal.requirePattern ?? true;
  const requireMetro = signal.requireMetro ?? false;

  if (
    requirePattern &&
    patternMatches.length === 0 &&
    industryMatches.length === 0
  ) {
    return null;
  }

  if (requireMetro && metroMatches.length === 0) {
    return null;
  }

  if (
    industryMatches.length === 0 &&
    patternMatches.length === 0 &&
    metroMatches.length === 0
  ) {
    return null;
  }

  const score =
    (signal.baseScore ?? 0) +
    industryMatches.length * (signal.industryWeight ?? 10) +
    patternMatches.length * (signal.patternWeight ?? 6) +
    metroMatches.length * (signal.metroWeight ?? 2);

  return {
    score,
    reasons: [
      signal.reason,
      ...metroMatches.map((pattern) => `location matches ${pattern.source}`),
      ...industryMatches
        .slice(0, 2)
        .map((pattern) => `client industry matches ${pattern.source}`),
      ...patternMatches
        .slice(0, 2)
        .map((pattern) => `text matches ${pattern.source}`),
    ],
  };
}

function inferLeads(jobs, existingCompanies) {
  const leads = new Map();

  for (const job of jobs) {
    for (const signal of MARKET_SIGNALS) {
      const match = scoreJobForSignal(job, signal);
      if (!match) continue;

      for (const company of signal.companies) {
        const key = company.toLowerCase();
        const current = leads.get(key) ?? {
          company,
          inCurrentPool: existingCompanies.has(key),
          score: 0,
          reasons: new Map(),
          exampleJobs: [],
        };

        current.score += match.score;
        for (const reason of match.reasons) {
          current.reasons.set(reason, (current.reasons.get(reason) || 0) + 1);
        }
        if (current.exampleJobs.length < 3) {
          current.exampleJobs.push({
            title: job.title,
            location: job.location || "Unknown",
            clientIndustry: job.industry || "Unknown",
          });
        }
        leads.set(key, current);
      }
    }
  }

  return [...leads.values()]
    .map((lead) => ({
      ...lead,
      reasons: [...lead.reasons.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([reason]) => reason),
    }))
    .sort((a, b) => b.score - a.score);
}

function leadConfidence(score) {
  if (score >= 180) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function loadExistingNotebook(outputPath) {
  if (!fs.existsSync(outputPath)) return new Map();

  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const leads = Array.isArray(existing.leads) ? existing.leads : [];

  return new Map(
    leads
      .filter((lead) => lead && typeof lead.company === "string")
      .map((lead) => [lead.company.toLowerCase(), lead]),
  );
}

function buildNotebook({ args, jobs, leads }) {
  const generatedAt = new Date().toISOString();
  const existingLeads = loadExistingNotebook(args.outputPath);

  return {
    generatedAt,
    source: "kforce_public_search",
    query: args.query,
    sampledJobs: jobs.length,
    filter: {
      candidatesOnly: args.candidatesOnly,
      top: args.top,
    },
    purpose:
      "Offline lead intelligence only. Use these signals to decide which direct company career boards to investigate. Do not publish or ingest Kforce agency postings.",
    statusLegend: {
      candidate: "New company to investigate.",
      researching: "Someone is checking the direct career board.",
      confirmed_direct_source:
        "Official company career source found; ready for job_sources migration.",
      added_to_pool: "Official company source has been added to HireGeneral.",
      rejected: "Not useful, blocked, duplicated, or not a good fit.",
    },
    leads: leads.slice(0, args.top).map((lead) => {
      const existing = existingLeads.get(lead.company.toLowerCase());
      const previousStatus = existing?.status;
      const defaultStatus = lead.inCurrentPool ? "added_to_pool" : "candidate";

      return {
        company: lead.company,
        status: previousStatus || defaultStatus,
        confidence: leadConfidence(lead.score),
        score: lead.score,
        inCurrentPool: lead.inCurrentPool,
        signals: lead.reasons,
        exampleAgencyRoles: lead.exampleJobs,
        directCareerUrl: existing?.directCareerUrl || null,
        notes: existing?.notes || "",
        firstSeenAt: existing?.firstSeenAt || generatedAt,
        lastSeenAt: generatedAt,
        nextAction: lead.inCurrentPool
          ? "No action needed unless the existing direct source is stale."
          : "Verify the official company career board and add only direct-source jobs.",
      };
    }),
  };
}

function writeNotebook(notebook, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(notebook, null, 2)}\n`);
}

function printTable(leads, jobs, args) {
  console.log("");
  console.log("Kforce lead discovery");
  console.log("=====================");
  console.log(`Query: ${args.query}`);
  console.log(`Public Kforce jobs sampled: ${jobs.length}`);
  if (args.candidatesOnly) {
    console.log("Filter: new candidate companies only");
  }
  if (args.write) {
    console.log(`Output: ${path.relative(REPO_ROOT, args.outputPath)}`);
  }
  console.log(
    "Purpose: identify likely direct employer career boards to pursue. This does not claim Kforce disclosed an end client.",
  );
  console.log("");

  for (const [index, lead] of leads.slice(0, args.top).entries()) {
    const status = lead.inCurrentPool ? "already in pool" : "candidate";
    console.log(`${index + 1}. ${lead.company} (${status})`);
    console.log(`   score: ${lead.score}`);
    console.log(`   why: ${lead.reasons.join("; ")}`);
    for (const example of lead.exampleJobs) {
      console.log(
        `   example: ${example.title} | ${example.location} | ${example.clientIndustry}`,
      );
    }
    console.log("");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await loadKforceSearchConfig();
  const rawJobs = await fetchKforceJobs(config, args.query, args.limit);
  const jobs = rawJobs.map(compactJob);
  const existingCompanies = existingSourceCompanies();
  const inferredLeads = inferLeads(jobs, existingCompanies);
  const leads = args.candidatesOnly
    ? inferredLeads.filter((lead) => !lead.inCurrentPool)
    : inferredLeads;
  const notebook = buildNotebook({ args, jobs, leads });

  if (args.write) {
    writeNotebook(notebook, args.outputPath);
  }

  if (args.json) {
    console.log(JSON.stringify(notebook, null, 2));
    return;
  }

  printTable(leads, jobs, args);
  if (args.write) {
    console.log(
      `Saved lead notebook to ${path.relative(REPO_ROOT, args.outputPath)}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
