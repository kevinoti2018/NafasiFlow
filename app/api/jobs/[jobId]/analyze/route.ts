/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/jobs/[jobId]/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateBody,
  handleZodError,
} from "@/lib/utils/validate";
import { jobIdParamSchema } from "@/lib/validations/job";
import { analyzeJobCVBodySchema } from "@/lib/validations/cv";
import { optimizeWithLLM } from "@/lib/utils/llmclient";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    validatedParams = await validateParams(await params, jobIdParamSchema);
    body = await validateBody(req, analyzeJobCVBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const { jobIds, cvId } = body;
  if (jobIds.length !== 1) {
    return NextResponse.json(
      { error: "Exactly one jobId required" },
      { status: 400 },
    );
  }
  const jobId = jobIds[0];
  if (jobId !== validatedParams.jobId) {
    return NextResponse.json({ error: "Job ID mismatch" }, { status: 400 });
  }

  const [job, cv] = await Promise.all([
    db.job.findFirst({ where: { id: jobId, userId: session.id } }),
    db.cVVersion.findFirst({ where: { id: cvId, userId: session.id } }),
  ]);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  // Run analysis
  const matchResult = await optimizeWithLLM("match", {
    cv: cv.profile as any,
    job: {
      title: job.title || "",
      company: job.company || "",
      description: job.rawContent,
    },
  });

  // Upsert analysis
  const analysis = await db.cVJobAnalysis.upsert({
    where: { cvVersionId_jobId: { cvVersionId: cv.id, jobId } },
    update: {
      matchScore: matchResult.matchScore,
      analysis: matchResult,
      rankSignal: matchResult.rankSignal,
      verdict: matchResult.verdict,
      analysisVersion: cv.analysisVersion,
    },
    create: {
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

  return NextResponse.json({ analysis });
}
