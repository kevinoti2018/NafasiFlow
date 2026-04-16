// app/api/cv/[cvId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  handleZodError,
  validateBody,
} from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { z } from "zod";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams;
  try {
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
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
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  let validatedParams;
  try {
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
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

const updateCVBodySchema = z.object({
  name: z.string().optional(),
  profile: z.any().optional(), // CVInput structure
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    validatedParams = await validateParams(await params, cvIdParamSchema);
    body = await validateBody(req, updateCVBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const updated = await db.cVVersion.update({
    where: { id: cv.id },
    data: {
      name: body.name !== undefined ? body.name : cv.name,
      profile: body.profile !== undefined ? body.profile : cv.profile,
    },
  });

  return NextResponse.json({ cvVersion: updated });
}
