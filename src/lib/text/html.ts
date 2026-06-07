function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&bull;/gi, "•")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeAllowedJobHtml(input: string) {
  return cleanupStructuredJobHtml(
    input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\s*(h2|h3|p|ul|ol|li|br|strong|b)\b[^>]*>/gi, "<$1>")
      .replace(/<\s*\/\s*(h2|h3|p|ul|ol|li|strong|b)\s*>/gi, "</$1>")
      .replace(/<br\s*\/?>/gi, "<br>")
      .replace(/<[^>]+>/g, " ")
      .replace(/<b>/gi, "<strong>")
      .replace(/<\/b>/gi, "</strong>")
      .replace(
        /<(h2|h3|p|ul|ol|li|br|strong)>/gi,
        (_, tag: string) => `<${tag.toLowerCase()}>`,
      )
      .replace(
        /<\/(h2|h3|p|ul|ol|li|strong)>/gi,
        (_, tag: string) => `</${tag.toLowerCase()}>`,
      )
      .replace(/[ \t]+/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function cleanupStructuredJobHtml(input: string) {
  return input.replace(
    /<h2>(Benefits|Pay Range|Qualifications|Requirements|Responsibilities|Skills)<\/h2>\s*<p>([^<]*)<\/p>/gi,
    (match: string, heading: string, body: string) => {
      const text = htmlToText(body).trim();

      if (/^(?:,|[a-z]\b|are\b|for\b|including\b|is\b|that\b)/i.test(text)) {
        return `<p>${body}</p>`;
      }

      return match;
    },
  );
}

const INLINE_JOB_HEADING_PATTERN =
  /\b(About (?:the )?(?:role|team|position)|Job Description|Pay Range|Benefits|What You(?:'|’)ll Do|What You'll Do|Responsibilities|Candidate Profile|Required Qualifications|Minimum Qualifications|Basic Qualifications|Preferred Qualifications|Desired Qualifications|Qualifications|Requirements|Desired Skills|Skills|Join the Journey|EEO Statement|Equal Opportunity|Posting End Date)\b(:?)/gi;

const GENERIC_INLINE_HEADING_LABELS = new Set([
  "benefits",
  "pay range",
  "qualifications",
  "requirements",
  "responsibilities",
  "skills",
]);

function isMostlyUppercase(value: string) {
  const letters = value.replace(/[^a-z]/gi, "");

  return letters.length > 1 && letters === letters.toUpperCase();
}

function shouldPromoteInlineHeading(
  label: string,
  colon: string,
  offset: number,
  fullText: string,
) {
  const normalized = label.toLowerCase();

  if (!GENERIC_INLINE_HEADING_LABELS.has(normalized)) {
    return true;
  }

  const previousNewline = fullText.lastIndexOf("\n", offset - 1);
  const linePrefix = fullText.slice(previousNewline + 1, offset).trim();

  return Boolean(colon) || linePrefix.length === 0 || isMostlyUppercase(label);
}

function normalizeJobPostingText(input: string) {
  return htmlToText(input)
    .replace(/\r/g, "\n")
    .replace(/\s*•\s*/g, "\n• ")
    .replace(
      INLINE_JOB_HEADING_PATTERN,
      (
        match: string,
        label: string,
        colon: string,
        offset: number,
        fullText: string,
      ) =>
        shouldPromoteInlineHeading(label, colon, offset, fullText)
          ? `\n\n${label}\n`
          : match,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function flushList(items: string[], blocks: string[]) {
  if (items.length === 0) return;

  blocks.push(
    `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
  );
  items.length = 0;
}

function splitHeadingAndBody(value: string) {
  const match = value.match(
    /^(About (?:the )?(?:role|team|position)|Job Description|Pay Range|Benefits|What You(?:'|’)ll Do|What You'll Do|Responsibilities|Candidate Profile|Required Qualifications|Minimum Qualifications|Basic Qualifications|Preferred Qualifications|Desired Qualifications|Qualifications|Requirements|Desired Skills|Skills|Join the Journey|EEO Statement|Equal Opportunity|Posting End Date)\s*:?\s*([\s\S]*)$/i,
  );

  if (!match) {
    return {
      heading: null,
      body: value,
    };
  }

  return {
    heading: match[1],
    body: match[2]?.trim() ?? "",
  };
}

function textToStructuredJobHtml(input: string) {
  const text = normalizeJobPostingText(input);
  const blocks: string[] = [];
  const listItems: string[] = [];

  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.startsWith("•")) {
        listItems.push(line.replace(/^•\s*/, "").trim());
        continue;
      }

      flushList(listItems, blocks);

      const { heading, body } = splitHeadingAndBody(line);

      if (heading) {
        blocks.push(`<h2>${escapeHtml(heading)}</h2>`);

        if (body) {
          if (body.startsWith("•")) {
            listItems.push(body.replace(/^•\s*/, "").trim());
          } else {
            blocks.push(`<p>${escapeHtml(body)}</p>`);
          }
        }

        continue;
      }

      blocks.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  flushList(listItems, blocks);

  return blocks.join("");
}

export function sanitizeJobPostingHtml(input: string | null | undefined) {
  if (!input) return "";

  const hasTags = /<\/?[a-z][\s\S]*>/i.test(input);

  if (!hasTags) {
    return textToStructuredJobHtml(input);
  }

  const normalized = normalizeAllowedJobHtml(input);

  if (!normalized || !htmlToText(normalized)) {
    return textToStructuredJobHtml(input);
  }

  const hasUsefulStructure = /<(h2|h3|ul|ol|li|strong)\b/i.test(normalized);

  if (!hasUsefulStructure && htmlToText(normalized).length > 700) {
    return textToStructuredJobHtml(normalized);
  }

  return normalized;
}

export function htmlToText(input: string | null | undefined) {
  if (!input) return "";

  const decoded = decodeHtmlEntities(decodeHtmlEntities(input));

  return decoded
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanTextArray(items: string[] | null | undefined) {
  return (items ?? []).map(htmlToText).filter(Boolean);
}
