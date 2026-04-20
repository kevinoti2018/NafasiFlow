// lib/cv/content-analyzer.ts
import { optimizeWithLLM } from "@/lib/utils/llmclient";

export async function analyzeContent(rawText: string) {
  const prompt = `
Analyze the following CV text and return a JSON object with:
- atsContentScore: 0-100 (overall quality)
- impactScore: 0-100 (action verbs, measurable results)
- keywordCoverage: 0-100 (industry keywords present)
- missingSections: array of strings listing any of these important sections that are missing: "contact", "certifications", "referees", "extracurricular", "projects", "skills", "education", "summary"

CV:
${rawText.slice(0, 3000)}
  `;

  const result = (await optimizeWithLLM("custom", {
    customPrompt: prompt,
  })) as any;
  return {
    atsContentScore: result.atsContentScore ?? 70,
    impactScore: result.impactScore ?? 65,
    keywordCoverage: result.keywordCoverage ?? 60,
    missingSections: result.missingSections ?? [],
  };
}
