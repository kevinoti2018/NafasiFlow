/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateQuery,
  handleZodError,
} from "@/lib/utils/validate";
import { createJobBodySchema, jobListQuerySchema } from "@/lib/validations/job";
import { normalizeText, computeHash } from "@/lib/cv/parser";
import { queueJobAnalysis } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query;
  try {
    query = validateQuery(req, jobListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid query" }, { status: 400 })
    );
  }

  const { page, limit, status, jobStatus } = query;
  const skip = (page - 1) * limit;
  const where: any = { userId: session.id };
  if (status) where.analysisStatus = status;
  if (jobStatus) where.jobStatus = jobStatus;

  const [jobs, totalCount] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { applications: true, cvJobAnalyses: true } },
      },
    }),
    db.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
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
    body = await validateBody(req, createJobBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    );
  }

  const { title, company, rawContent } = body;
  const normalized = normalizeText(rawContent);
  const contentHash = computeHash(normalized);

  const existing = await db.job.findUnique({ where: { contentHash } });
  if (existing) {
    return NextResponse.json({
      job: existing,
      reused: true,
      structuredData: existing.structuredData,
    });
  }

  const job = await db.job.create({
    data: {
      userId: session.id,
      title: title || null,
      company: company || null,
      rawContent,
      contentHash,
      analysisStatus: "pending",
    },
  });

  await queueJobAnalysis(job.id);
  return NextResponse.json({ job, reused: false }, { status: 202 });
}
