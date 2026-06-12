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
  return input
    .replace(
      /<p>\s*<strong>\s*([^<]{3,90}?)\s*<\/strong>\s*<\/p>/gi,
      (_match: string, heading: string) => `<h2>${heading.trim()}</h2>`,
    )
    .replace(
      /<p>\s*<strong>\s*([^<]{3,90}?)\s*<\/strong>\s*<br>\s*([\s\S]*?)<\/p>/gi,
      (_match: string, heading: string, body: string) =>
        `<h2>${heading.trim()}</h2><p>${body.trim()}</p>`,
    )
    .replace(
      /<(h2|h3)>([^<]+)<\/\1>\s*<p>\s*<strong>\s*([^<]+)\s*<\/strong>\s*<\/p>/gi,
      (match: string, tag: string, heading: string, label: string) =>
        heading.trim().toLowerCase() === label.trim().toLowerCase()
          ? `<${tag}>${heading}</${tag}>`
          : match,
    )
    .replace(
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

const ACTION_ITEM_START_PATTERN =
  /\s+(?=(?:Architect|Automate|Build|Champion|Coach|Collaborate|Communicate|Contribute|Create|Define|Deliver|Design|Develop|Drive|Enable|Ensure|Establish|Evaluate|Exhibit|Experience|Facilitate|Familiarity|Hands-on|Health Benefits|Identify|Implement|Improve|Influence|Knowledge|Lead|Leads|Manage|Manages|Mentor|Minimum|Partner|Preferred|Prioritize|Promote|Provide|Proven|Responsible|Strong|Support|Translate|Travel Perks|Wellness Programs|Work)\b)/g;

const READABLE_PARAGRAPH_START_PATTERN =
  /\s+(?=(?:At [A-Z][A-Za-z& ]{2,40},|Because\b|Core [A-Z][A-Za-z ]{2,50}\b|In this role\b|Joining\b|Technical [A-Z][A-Za-z ]{2,50}\b|The (?:ideal|successful) candidate\b|This (?:is|role)\b|We (?:are|need|want|will)\b|You(?:'|’)ll\b|You will\b)\b)/g;

function splitActionItemText(text: string) {
  return text
    .replace(ACTION_ITEM_START_PATTERN, "\n")
    .split(/\n+/)
    .map((item) => item.trim().replace(/^[•\-]\s*/, ""))
    .filter((item) => item.length >= 24);
}

function splitInlineBulletText(text: string) {
  return text
    .split(/[•●]/)
    .map((item) => item.trim().replace(/^[\-–—]\s*/, ""))
    .filter((item) => item.length >= 8);
}

function splitReadableParagraphText(text: string) {
  return text
    .replace(READABLE_PARAGRAPH_START_PATTERN, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 80);
}

function splitLongTextParagraph(body: string): string {
  const text = htmlToText(body).trim();
  const inlineBulletItems = splitInlineBulletText(text);

  if (inlineBulletItems.length >= 2) {
    return `<ul>${inlineBulletItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>`;
  }

  if (text.length < 650) return `<p>${body}</p>`;

  const colonSegments = text
    .replace(/\s+([A-Z][A-Za-z0-9/&()'’ -]{2,70}):\s+/g, "\n\n$1:\n")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (colonSegments.length > 1) {
    return colonSegments
      .map((segment) => {
        const headingMatch = segment.match(
          /^([A-Z][A-Za-z0-9/&()'’ -]{2,70}):\s*([\s\S]*)$/,
        );

        if (headingMatch) {
          const [, heading, rest] = headingMatch;
          const content = rest.trim();

          return [
            `<h3>${escapeHtml(heading)}</h3>`,
            content ? splitLongTextParagraph(escapeHtml(content)) : "",
          ].join("");
        }

        return splitLongTextParagraph(escapeHtml(segment));
      })
      .join("");
  }

  const actionItems = splitActionItemText(text);

  if (
    actionItems.length >= 4 &&
    actionItems.join(" ").length >= text.length * 0.72
  ) {
    return `<ul>${actionItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>`;
  }

  const readableParagraphs = splitReadableParagraphText(text);

  if (
    readableParagraphs.length >= 3 &&
    readableParagraphs.join(" ").length >= text.length * 0.7
  ) {
    return readableParagraphs
      .map((item) => splitLongTextParagraph(escapeHtml(item)))
      .join("");
  }

  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length < 5) return `<p>${escapeHtml(text)}</p>`;

  const paragraphs: string[] = [];
  const sentencesPerParagraph = text.length > 1400 ? 2 : 3;

  for (
    let index = 0;
    index < sentences.length;
    index += sentencesPerParagraph
  ) {
    paragraphs.push(
      sentences.slice(index, index + sentencesPerParagraph).join(" "),
    );
  }

  return paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function stripApplicationTail(text: string) {
  const match = text.match(
    /\b(?:Apply now|Start apply|Start application|Apply with LinkedIn|Start apply with LinkedIn)\b/i,
  );

  if (match?.index !== undefined && match.index > 1000) {
    return text.slice(0, match.index).trim();
  }

  return text;
}

function splitLongParagraphs(input: string) {
  return input.replace(/<p>([\s\S]*?)<\/p>/gi, (_match, body: string) =>
    splitLongTextParagraph(body),
  );
}

const INLINE_JOB_HEADING_PATTERN =
  /\b(About (?:the )?(?:role|job|team|position)|About Job|Job Description|Be part of something groundbreaking|Who we are|Pay Range|Benefits|Enjoy benefits that take care of what matters|What You(?:'|’)ll Do|What You'll Do|How You(?:'|’)ll Make an Impact|How You'll Make an Impact|How you will create impact|Your responsibilities include|Responsibilities|Candidate Profile|What is needed to be successful|Required Qualifications|Minimum Qualifications|Basic Qualifications|Preferred Qualifications|Desired Qualifications|Qualifications|Requirements|Desired Skills|Skills|Technical Mastery|Communication Excellence|Welcome to a culture of inclusion|Equal Opportunity|Join the Journey|EEO Statement|Posting End Date)\b(:?)/gi;

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
  return stripApplicationTail(htmlToText(input))
    .replace(/\r/g, "\n")
    .replace(/\bCreate job alert\b/gi, " ")
    .replace(/^[\s\S]{0,2500}?(?=\b(?:Job Description|Intro)\b)/i, "")
    .replace(/\s*[•●]\s*/g, "\n• ")
    .replace(
      /(^|[.!?]\s+)([A-Z][A-Za-z0-9/&()'’ -]{2,80}):\s+/g,
      (_match: string, prefix: string, heading: string) =>
        `${prefix}\n\n${heading.trim()}\n`,
    )
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
    /^(About (?:the )?(?:role|job|team|position)|About Job|Job Description|Be part of something groundbreaking|Who we are|Pay Range|Benefits|Enjoy benefits that take care of what matters|What You(?:'|’)ll Do|What You'll Do|How You(?:'|’)ll Make an Impact|How You'll Make an Impact|How you will create impact|Your responsibilities include|Responsibilities|Candidate Profile|What is needed to be successful|Required Qualifications|Minimum Qualifications|Basic Qualifications|Preferred Qualifications|Desired Qualifications|Qualifications|Requirements|Desired Skills|Skills|Technical Mastery|Communication Excellence|Welcome to a culture of inclusion|Equal Opportunity|Join the Journey|EEO Statement|Posting End Date)\s*:?\s*([\s\S]*)$/i,
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
            blocks.push(splitLongTextParagraph(escapeHtml(body)));
          }
        }

        continue;
      }

      blocks.push(splitLongTextParagraph(escapeHtml(line)));
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

  return splitLongParagraphs(normalized);
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
