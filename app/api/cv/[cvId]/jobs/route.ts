/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cv/[cvId]/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateQuery,
  handleZodError,
} from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { analysisListQuerySchema } from "@/lib/validations/analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolvedParams = await params;
  let validatedParams, query;
  try {
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
    query = validateQuery(req, analysisListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
    select: { id: true },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const { page, limit, minMatchScore, verdict } = query;
  const skip = (page - 1) * limit;
  const where: any = { cvVersionId: validatedParams.cvId };
  if (minMatchScore) where.matchScore = { gte: minMatchScore };
  if (verdict) where.verdict = verdict;

  const [analyses, totalCount] = await Promise.all([
    db.cVJobAnalysis.findMany({
      where,
      orderBy: { matchScore: "desc" },
      skip,
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            normalizedTitle: true,
            function: true,
            level: true,
          },
        },
        // application: { select: { id: true, status: true } },
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
