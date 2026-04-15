// lib/cv/format-analyzer.ts
export async function analyzeFormat(filePath: string, extractedText: string) {
  // This is a simplified example; in production you'd use libraries like pdf-parse, mammoth,
  // and run heuristics on the raw file structure.

  const issues = [];
  let atsFormatScore = 100;
  let parsingConfidence = 90;

  // Example heuristics (simulated)
  // Check for multi-column by analyzing line lengths
  const lines = extractedText.split("\n");
  const lineLengths = lines.map((l) => l.length);
  const avgLen = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
  const shortLines = lineLengths.filter((l) => l < avgLen * 0.5).length;
  if (shortLines > lines.length * 0.3) {
    issues.push({
      type: "layout",
      severity: "high",
      message: "Possible multi-column layout detected",
    });
    atsFormatScore -= 30;
    parsingConfidence -= 20;
  }

  // Check for tables (simplistic)
  if (extractedText.includes("+--") || extractedText.includes("|---")) {
    issues.push({
      type: "table",
      severity: "medium",
      message: "Tables detected, may cause parsing issues",
    });
    atsFormatScore -= 15;
  }

  // Check for standard headers
  const hasStandardHeaders = [
    "experience",
    "education",
    "skills",
    "summary",
  ].some((h) => extractedText.toLowerCase().includes(h));
  if (!hasStandardHeaders) {
    issues.push({
      type: "structure",
      severity: "medium",
      message: "Missing standard section headers",
    });
    atsFormatScore -= 20;
  }

  return {
    atsFormatScore: Math.max(0, atsFormatScore),
    parsingConfidence: Math.max(0, parsingConfidence),
    issues,
    parserUsed: "heuristic-v1",
  };
}
