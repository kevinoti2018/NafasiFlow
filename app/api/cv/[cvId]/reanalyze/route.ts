// app/api/cv/[cvId]/reanalyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { analyzeFormat } from "@/lib/cv/format-analyzer";
import { analyzeContent } from "@/lib/cv/content-analyzer";
import { downloadFile } from "@/lib/utils/download";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { extractTextFromFile } from "@/lib/cv/parser";
import mammoth from "mammoth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(await params, cvIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid CV ID" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  if (!cv.originalFileUrl) {
    return NextResponse.json(
      { error: "No original file to re-analyze" },
      { status: 400 },
    );
  }

  // Download the file from Cloudinary (or local storage)
  const fileBuffer = await downloadFile(cv.originalFileUrl, 60000, 3);
  const tempDir = os.tmpdir();
  const tempPath = path.join(
    tempDir,
    `${Date.now()}-reanalyze-${cv.id}.${cv.originalFileUrl.split(".").pop() || "pdf"}`,
  );
  await writeFile(tempPath, fileBuffer);

  try {
    // Try to extract text – if it fails with a PDF error, fallback to DOCX extraction
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(tempPath);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("Invalid PDF structure") ||
        errorMessage.includes("PDF")
      ) {
        console.log("PDF extraction failed, trying DOCX fallback...");
        const result = await mammoth.extractRawText({ path: tempPath });
        extractedText = result.value;
      } else {
        throw err;
      }
    }

    const [formatAnalysis, contentAnalysis] = await Promise.all([
      analyzeFormat(tempPath, extractedText),
      analyzeContent(extractedText),
    ]);

    const updated = await db.cVVersion.update({
      where: { id: cv.id },
      data: {
        atsFormatScore: formatAnalysis.atsFormatScore,
        parsingConfidence: formatAnalysis.parsingConfidence,
        formatIssues: formatAnalysis.issues,
        parserUsed: formatAnalysis.parserUsed,
        atsContentScore: contentAnalysis.atsContentScore,
        impactScore: contentAnalysis.impactScore,
        keywordCoverage: contentAnalysis.keywordCoverage,
        missingSections: contentAnalysis.missingSections,
        analysisVersion: { increment: 1 },
        lastAnalyzedAt: new Date(),
      },
    });

    return NextResponse.json({ cvVersion: updated });
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
