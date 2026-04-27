/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateQuery, handleZodError } from "@/lib/utils/validate";
import { templateListQuerySchema } from "@/lib/validations/template";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { analyzeTemplate } from "@/lib/template/section-analyzer";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query;
  try {
    query = validateQuery(req, templateListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid query" }, { status: 400 })
    );
  }

  const { page, limit, type, isDefault } = query;
  const skip = (page - 1) * limit;

  // Show user's own templates + all system templates (isSystem: true)
  const where: any = {
    OR: [
      { userId: session.id }, // user's private templates
      { isSystem: true }, // system templates (shared)
    ],
  };
  if (type) where.type = type;
  if (isDefault !== undefined) where.isDefault = isDefault;

  const [templates, totalCount] = await Promise.all([
    db.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { cvVersions: true, applications: true } },
      },
    }),
    db.template.count({ where }),
  ]);

  return NextResponse.json({
    templates,
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

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true },
  });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const isDefault = formData.get("isDefault") === "true";
  // Only admins can set isSystem=true
  let isSystem = false;
  if (user?.role === "ADMIN") {
    isSystem = formData.get("isSystem") === "true";
  }

  if (!file || !name) {
    return NextResponse.json(
      { error: "file and name are required" },
      { status: 400 },
    );
  }

  // Only allow DOCX files for templates
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only DOCX files are allowed for templates" },
      { status: 400 },
    );
  }

  const templateType = "docx"; // only docx

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempDir = os.tmpdir();
  const tempPath = join(tempDir, `${Date.now()}-${file.name}`);
  await writeFile(tempPath, buffer);

  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadToCloudinary(tempPath, {
      folder: "templates",
      resource_type: "raw",
    });
  } finally {
    await unlink(tempPath).catch(() => {});
  }

  // Analyze the DOCX template to find sections
  const { foundSections, missingSections, rawText } =
    await analyzeTemplate(buffer);

  // If setting as default, unset other defaults for the same scope
  if (isDefault) {
    if (isSystem) {
      await db.template.updateMany({
        where: { isSystem: true, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      await db.template.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  // Build data object
  const data = {
    name,
    fileUrl: cloudinaryResult.secure_url,
    type: templateType,
    isDefault: isDefault || false,
    isSystem: isSystem || false,
    metadata: {
      publicId: cloudinaryResult.public_id,
      version: cloudinaryResult.version,
      format: cloudinaryResult.format,
      size: cloudinaryResult.bytes,
      foundSections,
      missingSections,
      rawText,
    },
    ...(isSystem ? {} : { userId: session.id }),
  };

  // @ts-ignore – Prisma type mismatch; data is correct for the database
  const template = await db.template.create({ data });

  return NextResponse.json({ template }, { status: 201 });
}
