// app/api/applications/[appId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateBody,
  handleZodError,
} from "@/lib/utils/validate";
import {
  appIdParamSchema,
  updateApplicationBodySchema,
} from "@/lib/validations/application";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, appIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    );
  }

  const application = await db.application.findFirst({
    where: { id: validatedParams.appId, userId: session.id },
    include: {
      job: true,
      cvVersion: true,
      template: true,
      cvJobAnalysis: true,
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, appIdParamSchema);
    body = await validateBody(req, updateApplicationBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const oldApp = await db.application.findFirst({
    where: { id: validatedParams.appId, userId: session.id },
    select: { status: true },
  });
  if (!oldApp) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  // ✅ Use UncheckedUpdateInput to allow scalar fields like templateId
  const updateData: Prisma.ApplicationUncheckedUpdateInput = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.templateId !== undefined) updateData.templateId = body.templateId;
  if (body.appliedAt !== undefined)
    updateData.appliedAt = new Date(body.appliedAt);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const application = await db.application.update({
    where: { id: validatedParams.appId },
    data: updateData,
  });

  if (body.status && body.status !== oldApp.status) {
    await db.statusLog.create({
      data: {
        applicationId: validatedParams.appId,
        status: body.status,
        changedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ application });
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, appIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    );
  }

  const application = await db.application.findFirst({
    where: { id: validatedParams.appId, userId: session.id },
  });
  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  // Only allow deletion if status is 'saved' or 'rejected'
  if (application.status !== "saved" && application.status !== "rejected") {
    return NextResponse.json(
      { error: "Cannot delete application in progress" },
      { status: 400 },
    );
  }

  // Delete the associated CVJobAnalysis records (if any)
  await db.cVJobAnalysis.deleteMany({
    where: { applicationId: validatedParams.appId },
  });

  // Delete the application
  await db.application.delete({ where: { id: validatedParams.appId } });
  return NextResponse.json({ success: true });
}
