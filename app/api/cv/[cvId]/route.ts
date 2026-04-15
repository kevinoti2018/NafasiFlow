// app/api/cv/[cvId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";

export async function GET(
  req: NextRequest,
  { params }: { params: { cvId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(params, cvIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid CV ID" }, { status: 400 })
    );
  }

  const cvVersion = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
    include: {
      applications: { orderBy: { createdAt: "desc" }, take: 5 },
      cvJobAnalyses: { orderBy: { matchScore: "desc" }, take: 10 },
      parent: true,
      children: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!cvVersion) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  return NextResponse.json({ cvVersion });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { cvId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(params, cvIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid CV ID" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
    include: { applications: true },
  });

  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  if (cv.applications.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete CV with existing applications" },
      { status: 400 },
    );
  }

  await db.cVVersion.delete({ where: { id: validatedParams.cvId } });
  return NextResponse.json({ success: true });
}
