// app/api/jobs/[jobId]/retry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { queueJobAnalysis } from "@/lib/queue";
import { validateParams } from "@/lib/utils/validate";
import { jobIdParamSchema } from "@/lib/validations/job";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await validateParams(await params, jobIdParamSchema);

  const job = await db.job.findFirst({
    where: { id: jobId, userId: session.id },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Reset analysis status and trigger re‑analysis
  await db.job.update({
    where: { id: jobId },
    data: {
      analysisStatus: "pending",
      analysisVersion: { increment: 1 },
      structuredData: null,
      analyzedAt: null,
    },
  });

  await queueJobAnalysis(jobId);

  return NextResponse.json({ success: true });
}
