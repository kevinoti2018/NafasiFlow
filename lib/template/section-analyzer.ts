// lib/template/section-analyzer.ts
import mammoth from "mammoth";

// Synonym patterns for each section
const SECTION_PATTERNS: Record<string, RegExp[]> = {
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

const IMPORTANT_SECTIONS = [
  "summary",
  "experience",
  "skills",
  "education",
  "certifications",
  "projects",
  "referees",
  "extracurricular",
];

export function detectSectionsFromText(text: string): {
  found: string[];
  missing: string[];
} {
  const found: string[] = [];
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (patterns.some((regex) => regex.test(text))) {
      found.push(section);
    }
  }
  const missing = IMPORTANT_SECTIONS.filter((s) => !found.includes(s));
  return { found, missing };
}

export async function analyzeTemplate(fileBuffer: Buffer): Promise<{
  foundSections: string[];
  missingSections: string[];
  rawText: string;
}> {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  const rawText = result.value;
  const { found, missing } = detectSectionsFromText(rawText);
  return { foundSections: found, missingSections: missing, rawText };
}
