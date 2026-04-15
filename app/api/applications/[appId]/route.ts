// app/api/applications/[appId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateParams,
  handleZodError,
} from "@/lib/utils/validate";
import {
  appIdParamSchema,
  updateApplicationBodySchema,
} from "@/lib/validations/application";

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(params, appIdParamSchema);
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
      statusHistory: { orderBy: { changedAt: "desc" } },
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
  { params }: { params: { appId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    validatedParams = await validateParams(params, appIdParamSchema);
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

  const { status, templateId, appliedAt } = body;
  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (templateId !== undefined) updateData.templateId = templateId;
  if (appliedAt !== undefined) updateData.appliedAt = new Date(appliedAt);

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

  if (status && status !== oldApp.status) {
    await db.statusLog.create({
      data: {
        applicationId: validatedParams.appId,
        status,
        changedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ application });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(params, appIdParamSchema);
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

  if (application.status !== "saved" && application.status !== "rejected") {
    return NextResponse.json(
      { error: "Cannot delete application in progress" },
      { status: 400 },
    );
  }

  await db.cVJobAnalysis.updateMany({
    where: { applicationId: validatedParams.appId },
    data: { applicationId: null },
  });

  await db.application.delete({ where: { id: validatedParams.appId } });
  return NextResponse.json({ success: true });
}
