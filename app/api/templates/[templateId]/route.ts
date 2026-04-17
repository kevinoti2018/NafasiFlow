/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateBody,
  validateParams,
  handleZodError,
} from "@/lib/utils/validate";
import {
  templateIdParamSchema,
  updateTemplateBodySchema,
} from "@/lib/validations/template";
import { deleteFromCloudinary } from "@/lib/utils/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(
      resolvedParams,
      templateIdParamSchema,
    );
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    );
  }

  // Allow access if the template belongs to the user OR it's a system template
  const template = await db.template.findFirst({
    where: {
      id: validatedParams.templateId,
      OR: [{ userId: session.id }, { isSystem: true }],
    },
    include: {
      cvVersions: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, source: true },
      },
      applications: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, job: { select: { title: true } } },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(
      resolvedParams,
      templateIdParamSchema,
    );
    body = await validateBody(req, updateTemplateBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  // Only allow editing if the user owns the template (system templates cannot be edited by regular users)
  const existing = await db.template.findFirst({
    where: { id: validatedParams.templateId, userId: session.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Template not found or access denied" },
      { status: 404 },
    );
  }

  // Build update data with explicit type
  const updateData: { name?: string; isDefault?: boolean } = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;

  // If setting as default, unset others for the same user (or for system templates? but system templates are not editable by non-owners)
  if (body.isDefault === true) {
    await db.template.updateMany({
      where: {
        userId: session.id,
        isDefault: true,
        id: { not: validatedParams.templateId },
      },
      data: { isDefault: false },
    });
  }

  const template = await db.template.update({
    where: { id: validatedParams.templateId },
    data: updateData,
  });

  return NextResponse.json({ template });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(
      resolvedParams,
      templateIdParamSchema,
    );
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    );
  }

  // Only allow deletion if the user owns the template
  const template = await db.template.findFirst({
    where: { id: validatedParams.templateId, userId: session.id },
    include: { cvVersions: true, applications: true },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template not found or access denied" },
      { status: 404 },
    );
  }

  if (template.cvVersions.length > 0 || template.applications.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete template used by CVs or applications" },
      { status: 400 },
    );
  }

  const publicId = (template.metadata as any)?.publicId;
  if (publicId) {
    await deleteFromCloudinary(publicId, { resource_type: "raw" }).catch(
      console.error,
    );
  }

  await db.template.delete({ where: { id: validatedParams.templateId } });
  return NextResponse.json({ success: true });
}
