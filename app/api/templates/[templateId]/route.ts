// app/api/templates/[templateId]/route.ts
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
  { params }: { params: { templateId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = validateParams(params, templateIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    );
  }

  const template = await db.template.findFirst({
    where: { id: validatedParams.templateId, userId: session.id },
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
  { params }: { params: { templateId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    validatedParams = validateParams(params, templateIdParamSchema);
    body = await validateBody(req, updateTemplateBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const existing = await db.template.findFirst({
    where: { id: validatedParams.templateId, userId: session.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

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
    data: body,
  });

  return NextResponse.json({ template });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = validateParams(params, templateIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    );
  }

  const template = await db.template.findFirst({
    where: { id: validatedParams.templateId, userId: session.id },
    include: { cvVersions: true, applications: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
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
