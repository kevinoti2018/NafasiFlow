/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateParams,
  handleZodError,
} from "@/lib/utils/validate";
import {
  jobIdParamSchema,
  updateJobBodySchema,
  patchJobBodySchema,
} from "@/lib/validations/job";
import { normalizeText, computeHash } from "@/lib/cv/parser";
import { queueJobAnalysis } from "@/lib/queue";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams;
  try {
    validatedParams = await validateParams(resolvedParams, jobIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    );
  }

  const job = await db.job.findFirst({
    where: { id: validatedParams.jobId, userId: session.id },
    include: {
      applications: { orderBy: { createdAt: "desc" }, take: 10 },
      cvJobAnalyses: { orderBy: { matchScore: "desc" }, take: 10 },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams, body;
  try {
    validatedParams = await validateParams(resolvedParams, jobIdParamSchema);
    body = await validateBody(req, updateJobBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const existingJob = await db.job.findFirst({
    where: { id: validatedParams.jobId, userId: session.id },
  });
  if (!existingJob) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { title, company, rawContent } = body;
  const normalized = normalizeText(rawContent);
  const contentHash = computeHash(normalized);

  const duplicate = await db.job.findFirst({
    where: { contentHash, id: { not: validatedParams.jobId } },
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error: "Job with same content already exists",
        duplicateId: duplicate.id,
      },
      { status: 409 },
    );
  }

  const updatedJob = await db.job.update({
    where: { id: validatedParams.jobId },
    data: {
      title: title || null,
      company: company || null,
      rawContent,
      contentHash,
      analysisStatus: "pending",
      analysisVersion: { increment: 1 },
      structuredData: null,
      analyzedAt: null,
      normalizedTitle: null,
      function: null,
      level: null,
    },
  });

  await queueJobAnalysis(updatedJob.id);
  return NextResponse.json({ job: updatedJob, reanalyzing: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams, body;
  try {
    validatedParams = await validateParams(resolvedParams, jobIdParamSchema);
    body = await validateBody(req, patchJobBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const { title, company, jobStatus } = body;
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (company !== undefined) updateData.company = company;
  if (jobStatus !== undefined) updateData.jobStatus = jobStatus;
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const result = await db.job.updateMany({
    where: { id: validatedParams.jobId, userId: session.id },
    data: updateData,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams;
  try {
    validatedParams = await validateParams(resolvedParams, jobIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    );
  }

  const job = await db.job.findFirst({
    where: { id: validatedParams.jobId, userId: session.id },
    include: { applications: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.applications.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete job with existing applications" },
      { status: 400 },
    );
  }

  await db.job.delete({ where: { id: validatedParams.jobId } });
  return NextResponse.json({ success: true });
}
