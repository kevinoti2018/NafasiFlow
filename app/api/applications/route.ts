// app/api/applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateQuery,
  handleZodError,
} from "@/lib/utils/validate";
import {
  createApplicationBodySchema,
  applicationListQuerySchema,
} from "@/lib/validations/application";
import { optimizeWithLLM } from "@/lib/utils/llmclient";
import { Prisma } from "@prisma/client";
import { CVInput } from "@/lib/ai/prompts";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query;
  try {
    query = validateQuery(req, applicationListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid query" }, { status: 400 })
    );
  }

  const { page, limit, status, jobId, cvVersionId } = query;
  const skip = (page - 1) * limit;
  const where: Prisma.ApplicationWhereInput = { userId: session.id };
  if (status) where.status = status;
  if (jobId) where.jobId = jobId;
  if (cvVersionId) where.cvVersionId = cvVersionId;

  const [applications, totalCount] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        job: { select: { title: true, company: true, normalizedTitle: true } },
        cvVersion: {
          select: {
            id: true,
            source: true,
            atsFormatScore: true,
            atsContentScore: true,
          },
        },
        template: { select: { id: true, name: true } },
        cvJobAnalysis: {
          select: { matchScore: true, rankSignal: true, verdict: true },
        },
        statusHistory: { orderBy: { changedAt: "desc" }, take: 1 },
      },
    }),
    db.application.count({ where }),
  ]);

  return NextResponse.json({
    applications,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await validateBody(req, createApplicationBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    );
  }

  const { jobId, cvVersionId, templateId } = body;

  const [job, cvVersion] = await Promise.all([
    db.job.findFirst({ where: { id: jobId, userId: session.id } }),
    db.cVVersion.findFirst({ where: { id: cvVersionId, userId: session.id } }),
  ]);
  if (!job || !cvVersion) {
    return NextResponse.json({ error: "Job or CV not found" }, { status: 404 });
  }

  const existing = await db.application.findFirst({
    where: { jobId, cvVersionId, userId: session.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Application already exists", applicationId: existing.id },
      { status: 409 },
    );
  }

  let analysis = await db.cVJobAnalysis.findUnique({
    where: { cvVersionId_jobId: { cvVersionId, jobId } },
  });
  if (!analysis) {
    const matchResult = await optimizeWithLLM("match", {
      cv: cvVersion.profile as CVInput,
      job: {
        title: job.title || "",
        company: job.company || "",
        description: job.rawContent,
      },
    });
    analysis = await db.cVJobAnalysis.create({
      data: {
        userId: session.id,
        cvVersionId,
        jobId,
        matchScore: matchResult.matchScore,
        analysis: matchResult,
        rankSignal: matchResult.rankSignal,
        verdict: matchResult.verdict,
        analysisVersion: cvVersion.analysisVersion,
      },
    });
  }

  const application = await db.application.create({
    data: {
      userId: session.id,
      jobId,
      cvVersionId,
      templateId: templateId || null,
      matchScore: analysis.matchScore,
      aiInsightsSnapshot: analysis.analysis as Prisma.InputJsonValue,
      analysisVersion: cvVersion.analysisVersion,
      status: "saved",
    },
  });

  await db.cVJobAnalysis.update({
    where: { id: analysis.id },
    data: { applicationId: application.id },
  });

  await db.statusLog.create({
    data: {
      applicationId: application.id,
      status: "saved",
      changedAt: new Date(),
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
