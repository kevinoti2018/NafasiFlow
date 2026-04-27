// ===============================
// TYPES
// ===============================

export type CVInput = {
  summary?: string;
  experience?: Array<{
    role: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  // New fields for richer CV data
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  referees?: Array<{
    name: string;
    position?: string;
    company?: string;
    email?: string;
    phone?: string;
  }>;
  extracurricular?: Array<{
    activity: string;
    role?: string;
    description?: string;
  }>;
  rawText?: string; // temporary fallback
};

export type JobInput = {
  title: string;
  company: string;
  description: string;
  requirements?: string[];
  niceToHave?: string[];
};

interface StructuredJDParsed {
  normalizedTitle?: string;
  level?: string;
  function?: string;
}

interface StructuredJDPainPoints {
  primaryChallenge?: string;
  softSkillPriority?: string;
}

interface StructuredJD {
  parsed?: StructuredJDParsed;
  painPoints?: StructuredJDPainPoints;
  [key: string]: unknown;
}

export type PromptFn<T = Record<string, unknown>> = (input: T) => string;

// ===============================
// VERSION & SYSTEM CONFIG
// ===============================

export const PROMPT_VERSION = "v5.5";

export const SYSTEM_PROMPT = `
You are an elite ATS resume optimization engine with 10+ years of tech recruiting expertise.

Core Capabilities:
- Precise CV-Job alignment scoring with logical rationales.
- High-impact content rewriting using the Google XYZ formula.
- Extraction of implicit hiring manager "pain points" and "ideal personas."

Mechanical Rules (STRICT):
1. Response Format: Return ONLY raw, valid JSON.
2. No Decorations: No markdown, no preamble, no post-response explanation.
3. JSON Integrity:
   - Escape internal double quotes with backslash: \\"example\\"
   - All string content must be single-line; use \\n for internal line breaks.
   - Use null for missing data; use [] for empty arrays.
4. Grounding: NEVER invent numerical metrics (%, $, #) not in the CV. Use placeholders like "[X]%" or "[quantifiable impact]".
5. Logic Injection: Every score or transformation must include a "rationale" field explaining the decision based on JD requirements.
6. Token Awareness: If input exceeds ~6000 tokens, prioritize the most recent experience and skills.
`;
export const linkedinOptimizeSectionPrompt: PromptFn<{
  section: string;
  content: string;
}> = ({ section, content }) => `
${SYSTEM_PROMPT}

TASK: Optimize the following LinkedIn profile section (${section}) to be more impactful, engaging, and keyword‑rich.
Return a JSON object with the following structure:

{
  "original": string,
  "improved": string,
  "score": number,        // 0-100 for this section
  "reason": string,
  "keywords": string[]    // suggested keywords to include
}

Section: ${section}
Content:
${content || "Not provided"}
`;
// ===============================
// 1. MATCH PROMPT (Context-Aware)
// ===============================

export const matchPrompt: PromptFn<{
  cv: CVInput;
  job: JobInput;
  structuredJD?: StructuredJD;
}> = ({ cv, job, structuredJD }) => `
${SYSTEM_PROMPT}

TASK: Score alignment between CV and the ${structuredJD?.parsed?.normalizedTitle || job.title || "Job"}.
PRIMARY CHALLENGE TO ADDRESS: ${structuredJD?.painPoints?.primaryChallenge || "General Requirements (no structured JD provided)"}

OUTPUT SCHEMA:
{
  "matchScore": number,
  "rationale": string,
  "confidence": number,
  "eligibility": {
    "seniorityGap": -1 | 0 | 1,
    "isRemoteCompatible": boolean | null
  },
  "scoreBreakdown": {
    "skills": number,
    "experience": number,
    "seniority": number,
    "keywords": number
  },
  "criticalGaps": [
    { "gap": string, "impact": "high" | "medium", "fix": string }
  ],
  "recommendations": string[],
  "rankSignal": "top_10" | "top_20" | "not_recommended",
  "verdict": "proceed" | "consider" | "high_risk",
  "meta": { "version": "${PROMPT_VERSION}" }
}

RULES:
- isRemoteCompatible = null unless CV explicitly mentions remote work or location matches job's remote policy.
- seniorityGap: -1 = underqualified, 0 = match, 1 = overqualified (based on years of experience vs JD expectation).
- rankSignal & verdict thresholds: matchScore ≥80 → top_10/proceed; 60–79 → top_20/consider; <60 → not_recommended/high_risk.

CV: ${JSON.stringify(cv)}
JOB: ${JSON.stringify(job)}
`;

// ===============================
// 2. SELL PROMPT (The "Architect" Reframing)
// ===============================

export const sellPrompt: PromptFn<{
  cv: CVInput;
  job: JobInput;
  primaryChallenge?: string;
  targetPersona?: string;
}> = ({ cv, job, primaryChallenge, targetPersona }) => `
${SYSTEM_PROMPT}

TASK: Analyze CV experience at bullet level and selectively optimize ONLY weak bullets.

TARGET PERSONA: ${targetPersona || "Professional Developer"}
SOLVING CHALLENGE: ${primaryChallenge || "General role requirements"}

---

CORE OBJECTIVE:
- Diagnose ALL bullets
- Improve ONLY low-quality bullets
- Preserve strong bullets (minimal or no change)

---

BULLET ANALYSIS RULES (STRICT):
For EACH bullet:
- Extract action verb (first word)
- Detect:
  - hasMetrics (numbers, %, $, measurable outcomes)
  - hasTools (technologies mentioned)
- Score (0–10):
  - Strong verb → +2
  - Tools → +2
  - Metrics → +3
  - Clarity → +3

CLASSIFY:
- 0–3 → "weak"
- 4–6 → "average"
- 7–10 → "strong"

Identify issues:
["weak_verb", "no_metrics", "no_tools", "vague", "too_short"]

Provide rationale.

---

SELECTIVE REWRITE RULES:
- ONLY rewrite bullets with score ≤ 5
- DO NOT modify strong bullets (score ≥ 7)
- For average bullets (4–6), allow light refinement only if obvious

---

REWRITING RULES:
- Format:
  Action Verb + Task + Tools + Impact
- Use strong verbs (avoid: Responsible, Helped, Worked)
- DO NOT invent metrics
- Use placeholders if needed:
  "[X]%", "[quantifiable impact]", "improving efficiency"
- Include tools ONLY if present or clearly implied
- Avoid repeating verbs across rewritten bullets
- Max 20 words

---

OUTPUT SCHEMA:
{
  "positioning": {
    "angle": string,
    "rationale": string,
    "keyThemes": string[]
  },
  "profileOptimization": {
    "originalHeadline": string,
    "optimizedHeadline": string,
    "elevatorPitch": string
  },
  "experienceTransformations": [
    {
      "role": string,
      "originalBullets": string[],
      "bulletAnalysis": [
        {
          "original": string,
          "verb": string,
          "hasMetrics": boolean,
          "hasTools": boolean,
          "score": number,
          "classification": "weak" | "average" | "strong",
          "issues": string[],
          "rationale": string
        }
      ],
      "optimizedBullets": [
        {
          "original": string,
          "optimized": string,
          "changed": boolean
        }
      ],
      "injectedKeywords": string[]
    }
  ],
  "competencyMapping": [
    {
      "jobRequirement": string,
      "candidateEvidence": string,
      "relevance": "direct" | "transferable" | "implied"
    }
  ],
  "meta": { "version": "v6.1-selective" }
}

---

CRITICAL:
- If bullet score ≥ 7 → optimized = original, changed = false
- If bullet score ≤ 5 → MUST rewrite, changed = true

---

CV: ${JSON.stringify(cv)}
JOB: ${JSON.stringify(job)}
`;
// ===============================
// 3. OPTIMIZE PROMPT (Readability & Structure)
// ===============================

export const optimizePrompt: PromptFn<{
  cv: CVInput;
  job: JobInput;
}> = ({ cv, job }) => `
${SYSTEM_PROMPT}

TASK: Restructure CV for ATS readability. Categorize skills dynamically based on job description.

RULES:
- Infer skill categories from job requirements. If none are clear, use: "Technical Skills", "Tools & Platforms", "Soft Skills".
- Do not hardcode categories like "languages" unless explicitly mentioned in JD.

OUTPUT SCHEMA:
{
  "optimizationSummary": {
    "atsReadability": "high" | "medium" | "low",
    "rationale": string,
    "keyChanges": string[]
  },
  "restructuredCV": {
    "summary": string,
    "skillsSection": {
      // Dynamic keys – example:
      "Technical Skills": string[],
      "Tools & Platforms": string[],
      "Soft Skills": string[]
    },
    "experience": [
      {
        "role": string,
        "company": string,
        "priority": "high" | "medium" | "low",
        "bullets": string[]
      }
    ]
  },
  "keywordOptimization": {
    "inserted": string[],
    "keywordCoverage": number
  },
  "meta": { "version": "${PROMPT_VERSION}" }
}

CV: ${JSON.stringify(cv)}
JOB: ${JSON.stringify(job)}
`;

// ===============================
// 4. JD PROMPT (The Discovery Engine)
// ===============================

export const jdPrompt: PromptFn<{
  job: JobInput;
}> = ({ job }) => `
${SYSTEM_PROMPT}

TASK: Parse JD to extract technical requirements, the "Primary Pain Point," and the Ideal Candidate Persona.

OUTPUT SCHEMA:
{
  "parsed": {
    "normalizedTitle": string,
    "level": "junior" | "mid" | "senior" | "staff" | "principal" | null,
    "function": "frontend" | "backend" | "fullstack" | "devops" | "mobile" | "data" | "other"
  },
  "painPoints": {
    "primaryChallenge": string | null,
    "softSkillPriority": "leadership" | "autonomy" | "collaboration" | null
  },
  "idealCandidatePersona": {
    "type": string,
    "description": string
  },
  "companyDNA": "startup" | "scaleup" | "enterprise" | "legacy" | null,
  "requirements": {
    "mandatory": { "skills": string[], "experience": string | null },
    "preferred": { "skills": string[], "certifications": string[] }
  },
  "keywords": {
    "atsCritical": string[],
    "recruiterTriggers": string[]
  },
  "meta": { "version": "${PROMPT_VERSION}" }
}

JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description}
${job.requirements ? `\nREQUIREMENTS SECTION:\n${JSON.stringify(job.requirements)}` : ""}
${job.niceToHave ? `\nNICE TO HAVE:\n${JSON.stringify(job.niceToHave)}` : ""}
`;

// ===============================
// 5. CV STRUCTURE PROMPT (Convert raw text to structured CV)
// ===============================

export const cvStructurePrompt: PromptFn<{ rawText: string }> = ({
  rawText,
}) => `
${SYSTEM_PROMPT}

TASK: Extract structured CV data from the raw text below.
Return a JSON object matching the CVInput schema.

CVInput schema:
{
  summary?: string,
  experience?: Array<{ role: string, company: string, duration: string, bullets: string[] }>,
  skills?: string[],
  education?: Array<{ degree: string, institution: string, year: string }>,
  projects?: Array<{ name: string, description: string, technologies: string[] }>,
  contact?: {
    name?: string,
    email?: string,
    phone?: string,
    location?: string,
    linkedin?: string,
    github?: string
  },
  certifications?: Array<{ name: string, issuer: string, date?: string }>,
  referees?: Array<{ name: string, position?: string, company?: string, email?: string, phone?: string }>,
  extracurricular?: Array<{ activity: string, role?: string, description?: string }>
}

Rules:
- Infer as much as possible from the text.
- For missing fields, omit them or use empty arrays.
- Do not invent information.
- Use the exact schema field names.

Raw CV text:
${rawText.slice(0, 8000)}
`;

// ===============================
// 6. LINKEDIN PROFILE OPTIMIZATION PROMPT
// ===============================

export const linkedinOptimizeStructuredPrompt: PromptFn<{
  headline: string;
  about: string;
  experience: string;
  skills: string;
  certifications: string;
  education: string;
  volunteering: string;
}> = ({
  headline,
  about,
  experience,
  skills,
  certifications,
  education,
  volunteering,
}) => `
${SYSTEM_PROMPT}

TASK: Analyze the LinkedIn profile sections below and provide optimization suggestions.
Return a JSON object with the following structure:

{
  "score": number,
  "suggestions": [
    {
      "section": "headline" | "about" | "experience" | "skills" | "certifications" | "education" | "volunteering",
      "original": string,
      "improved": string,
      "reason": string
    }
  ],
  "missingSections": string[],
  "keywordGaps": string[],
  "actionableTips": string[]
}

Profile sections:

HEADLINE:
${headline || "Not provided"}

ABOUT:
${about || "Not provided"}

EXPERIENCE:
${experience || "Not provided"}

SKILLS:
${skills || "Not provided"}

CERTIFICATIONS:
${certifications || "Not provided"}

EDUCATION:
${education || "Not provided"}

VOLUNTEERING:
${volunteering || "Not provided"}
`;

// ===============================
// REGISTRY
// ===============================

export const prompts = {
  match: matchPrompt,
  sell: sellPrompt,
  optimize: optimizePrompt,
  jd: jdPrompt,
  cvStructure: cvStructurePrompt,
  linkedinOptimizeStructured: linkedinOptimizeStructuredPrompt,
  linkedinOptimizeSection: linkedinOptimizeSectionPrompt,
};

export type PromptType = keyof typeof prompts | "custom";
