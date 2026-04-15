// lib/cv/content-analyzer.ts
import { optimizeWithLLM } from "@/lib/utils/llmclient";

export async function analyzeContent(rawText: string) {
  const prompt = `
Analyze the following CV text and return a JSON object with:
- atsContentScore: 0-100 (overall quality)
- impactScore: 0-100 (action verbs, measurable results)
- keywordCoverage: 0-100 (industry keywords present)

CV:
${rawText.slice(0, 3000)}
  `;

  // Use 'custom' prompt type and pass the prompt as customPrompt
  const result = (await optimizeWithLLM("custom", {
    customPrompt: prompt,
  })) as any;

  return {
    atsContentScore: result.atsContentScore ?? 70,
    impactScore: result.impactScore ?? 65,
    keywordCoverage: result.keywordCoverage ?? 60,
  };
}
