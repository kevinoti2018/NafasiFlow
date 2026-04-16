/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cv/[cvId]/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateParams,
  handleZodError,
} from "@/lib/utils/validate";
import { cvIdParamSchema, analyzeCVBodySchema } from "@/lib/validations/cv";
import { optimizeWithLLM } from "@/lib/utils/llmclient";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolvedParams = await params;

  let validatedParams, body;
  try {
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
    body = await validateBody(req, analyzeCVBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const results = [];
  for (const jobId of body.jobIds) {
    const job = await db.job.findFirst({
      where: { id: jobId, userId: session.id },
    });
    if (!job) continue;

    const existing = await db.cVJobAnalysis.findUnique({
      where: { cvVersionId_jobId: { cvVersionId: cv.id, jobId } },
    });
    if (existing && existing.analysisVersion === cv.analysisVersion) {
      results.push({ jobId, analysis: existing, reused: true });
      continue;
    }

    const matchResult = await optimizeWithLLM("match", {
      cv: cv.profile as any,
      job: {
        title: job.title || "",
        company: job.company || "",
        description: job.rawContent,
      },
    });

    const analysis = await db.cVJobAnalysis.create({
      data: {
        userId: session.id,
        cvVersionId: cv.id,
        jobId,
        matchScore: matchResult.matchScore,
        analysis: matchResult,
        rankSignal: matchResult.rankSignal,
        verdict: matchResult.verdict,
        analysisVersion: cv.analysisVersion,
      },
    });
    results.push({ jobId, analysis, reused: false });
  }

  return NextResponse.json({ results });
}
