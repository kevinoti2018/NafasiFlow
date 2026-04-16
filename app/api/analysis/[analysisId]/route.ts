// app/api/analysis/[analysisId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { analysisIdParamSchema } from "@/lib/validations/analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }, // ✅ params is a Promise
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    // ✅ Await params before validation
    validatedParams = await validateParams(await params, analysisIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 })
    );
  }

  const analysis = await db.cVJobAnalysis.findFirst({
    where: { id: validatedParams.analysisId, userId: session.id },
    include: {
      cvVersion: {
        select: {
          id: true,
          source: true,
          atsFormatScore: true,
          atsContentScore: true,
        },
      },
      job: {
        select: { id: true, title: true, company: true, normalizedTitle: true },
      },
      application: { select: { id: true, status: true } },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(await params, analysisIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 })
    );
  }

  const analysis = await db.cVJobAnalysis.findFirst({
    where: { id: validatedParams.analysisId, userId: session.id },
    include: { application: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  if (analysis.applicationId) {
    return NextResponse.json(
      { error: "Cannot delete analysis linked to an application" },
      { status: 400 },
    );
  }

  await db.cVJobAnalysis.delete({ where: { id: validatedParams.analysisId } });
  return NextResponse.json({ success: true });
}
