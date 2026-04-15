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

  // Download the file from Cloudinary
  const fileBuffer = await downloadFile(cv.originalFileUrl);
  const tempPath = path.join(
    os.tmpdir(),
    `${Date.now()}-reanalyze-${cv.id}.pdf`,
  );
  await writeFile(tempPath, fileBuffer);

  try {
    const extractedText = await extractTextFromFile(tempPath);
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
        analysisVersion: { increment: 1 },
        lastAnalyzedAt: new Date(),
      },
    });

    return NextResponse.json({ cvVersion: updated });
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
