/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateQuery,
  handleZodError,
} from "@/lib/utils/validate";
import { jobIdParamSchema } from "@/lib/validations/job";
import { analysisListQuerySchema } from "@/lib/validations/analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams, query;
  try {
    validatedParams = await validateParams(resolvedParams, jobIdParamSchema);
    query = validateQuery(req, analysisListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const job = await db.job.findFirst({
    where: { id: validatedParams.jobId, userId: session.id },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { page, limit, minMatchScore, verdict } = query;
  const skip = (page - 1) * limit;
  const where: any = { jobId: validatedParams.jobId };
  if (minMatchScore) where.matchScore = { gte: minMatchScore };
  if (verdict) where.verdict = verdict;

  const [analyses, totalCount] = await Promise.all([
    db.cVJobAnalysis.findMany({
      where,
      orderBy: { matchScore: "desc" },
      skip,
      take: limit,
      include: {
        cvVersion: {
          select: {
            id: true,
            source: true,
            atsFormatScore: true,
            atsContentScore: true,
            createdAt: true,
          },
        },
        application: { select: { id: true, status: true } },
      },
    }),
    db.cVJobAnalysis.count({ where }),
  ]);

  return NextResponse.json({
    analyses,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
