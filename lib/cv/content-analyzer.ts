// lib/cv/content-analyzer.ts
import { optimizeWithLLM } from "@/lib/utils/llmclient";

// Helper: detect section by common heading synonyms
function hasSection(text: string, sectionName: string): boolean {
  const patterns: Record<string, RegExp[]> = {
    certifications: [
      /certification/i,
      /certifications/i,
      /certificates?/i,
      /credentials?/i,
      /licenses?/i,
      /professional certifications/i,
    ],
    referees: [
      /referees?/i,
      /references?/i,
      /recommenders?/i,
      /professional references/i,
    ],
    extracurricular: [
      /extracurricular/i,
      /activities?/i,
      /volunteer/i,
      /leadership/i,
      /community involvement/i,
      /clubs/i,
    ],
    projects: [
      /projects?/i,
      /portfolio/i,
      /side projects?/i,
      /personal projects/i,
      /github projects/i,
    ],
    skills: [
      /skills?/i,
      /competencies?/i,
      /expertise/i,
      /technologies?/i,
      /technical skills/i,
      /core competencies/i,
    ],
    education: [
      /education/i,
      /academic background/i,
      /degrees?/i,
      /qualifications?/i,
      /studied/i,
      /university/i,
      /college/i,
    ],
    summary: [
      /summary/i,
      /profile/i,
      /about me/i,
      /professional summary/i,
      /objective/i,
      /personal statement/i,
      /executive summary/i,
    ],
    contact: [
      /contact/i,
      /email/i,
      /phone/i,
      /linkedin/i,
      /github/i,
      /address/i,
      /telephone/i,
      /mobile/i,
    ],
  };
  const regexes = patterns[sectionName];
  if (!regexes) return false;
  return regexes.some((regex) => regex.test(text));
}

// Helper: detect contact info even without a heading (email, phone, location)
function hasContactInfo(text: string): boolean {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const locationRegex =
    /(?:address|location|city|country|nairobi|kenya|usa|uk)/i;
  return (
    emailRegex.test(text) || phoneRegex.test(text) || locationRegex.test(text)
  );
}

// Helper: detect summary (first substantial paragraph after name)
function hasSummary(text: string): boolean {
  const lines = text.split("\n").filter((l) => l.trim().length > 30);
  const firstLongLine = lines[0];
  return firstLongLine ? firstLongLine.length > 50 : false;
}

export async function analyzeContent(rawText: string) {
  const prompt = `
Analyze the following CV text and return a JSON object with:
- atsContentScore: 0-100 (overall quality)
- impactScore: 0-100 (action verbs, measurable results)
- keywordCoverage: 0-100 (industry keywords present)
- missingSections: array of strings listing any of these important sections that are missing OR not clearly identifiable: "contact", "certifications", "referees", "extracurricular", "projects", "skills", "education", "summary".

Be lenient:
- If contact details (email, phone, location) appear anywhere without a heading, consider "contact" as present.
- If a summary paragraph exists (even under headings like "Professional Summary", "Profile", "About Me"), consider "summary" as present.
- For other sections, look for standard headings or clear content blocks. Accept singular/plural variations (e.g., "Certification" counts as "certifications").

CV:
${rawText.slice(0, 3000)}
  `;

  const result = (await optimizeWithLLM("custom", {
    customPrompt: prompt,
  })) as any;
  let missingSections: string[] = result.missingSections ?? [];

  // Post‑processing overrides using synonym detection
  const allSections = [
    "certifications",
    "referees",
    "extracurricular",
    "projects",
    "skills",
    "education",
    "summary",
    "contact",
  ];
  for (const section of allSections) {
    if (missingSections.includes(section) && hasSection(rawText, section)) {
      missingSections = missingSections.filter((s) => s !== section);
    }
  }

  // Special overrides for contact and summary (they may appear without a heading)
  if (missingSections.includes("contact") && hasContactInfo(rawText)) {
    missingSections = missingSections.filter((s) => s !== "contact");
  }
  if (missingSections.includes("summary") && hasSummary(rawText)) {
    missingSections = missingSections.filter((s) => s !== "summary");
  }

  return {
    atsContentScore: result.atsContentScore ?? 70,
    impactScore: result.impactScore ?? 65,
    keywordCoverage: result.keywordCoverage ?? 60,
    missingSections,
  };
}
