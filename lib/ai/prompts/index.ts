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
  rawText?: string;
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
  [key: string]: unknown; // allow other fields from the JD analysis
}
export type PromptFn<T = Record<string, unknown>> = (input: T) => string;

// ===============================
// VERSION & SYSTEM CONFIG
// ===============================

export const PROMPT_VERSION = "v5.4";

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

TASK: Rewrite CV experience using the Google XYZ formula.
TARGET PERSONA: ${targetPersona || "Professional Developer"}
SOLVING CHALLENGE: ${primaryChallenge || "General role requirements"}

RULES:
- Align "optimizedHeadline" to the specific persona.
- Each bullet in "experienceTransformations" must bridge the gap between candidate history and the "SOLVING CHALLENGE".
- Include competencyMapping to show explicit evidence for JD requirements.

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
      "optimizedBullets": string[],
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
  "meta": { "version": "${PROMPT_VERSION}" }
}

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
  projects?: Array<{ name: string, description: string, technologies: string[] }>
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
// REGISTRY
// ===============================

export const prompts = {
  match: matchPrompt,
  sell: sellPrompt,
  optimize: optimizePrompt,
  jd: jdPrompt,
  cvStructure: cvStructurePrompt,
};

export type PromptType = keyof typeof prompts | "custom";
