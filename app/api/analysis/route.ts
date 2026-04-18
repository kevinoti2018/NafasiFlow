// app/api/analyses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateQuery, handleZodError } from "@/lib/utils/validate";
import { z } from "zod";

const analysesListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  minMatchScore: z.coerce.number().int().min(0).max(100).optional(),
  verdict: z.enum(["proceed", "consider", "high_risk"]).optional(),
  jobId: z.string().optional(),
  cvId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query;
  try {
    query = validateQuery(req, analysesListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid query" }, { status: 400 })
    );
  }

  const { page, limit, minMatchScore, verdict, jobId, cvId } = query;
  const skip = (page - 1) * limit;

  const where: any = { userId: session.id };
  if (minMatchScore !== undefined) where.matchScore = { gte: minMatchScore };
  if (verdict) where.verdict = verdict;
  if (jobId) where.jobId = jobId;
  if (cvId) where.cvVersionId = cvId;

  const [analyses, totalCount] = await Promise.all([
    db.cVJobAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        job: { select: { id: true, title: true, company: true } },
        cvVersion: { select: { id: true, name: true, source: true } },
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
