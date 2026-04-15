// app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateQuery, handleZodError } from "@/lib/utils/validate";
import { templateListQuerySchema } from "@/lib/validations/template";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

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
  const where: any = { userId: session.id };
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

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const isDefault = formData.get("isDefault") === "true";

  if (!file || !name) {
    return NextResponse.json(
      { error: "file and name are required" },
      { status: 400 },
    );
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF or DOCX files allowed" },
      { status: 400 },
    );
  }

  const templateType = file.type === "application/pdf" ? "pdf" : "docx";

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempPath = join("/tmp", `${Date.now()}-${file.name}`);
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

  if (isDefault) {
    await db.template.updateMany({
      where: { userId: session.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await db.template.create({
    data: {
      userId: session.id,
      name,
      fileUrl: cloudinaryResult.secure_url,
      type: templateType,
      isDefault: isDefault || false,
      metadata: {
        publicId: cloudinaryResult.public_id,
        version: cloudinaryResult.version,
        format: cloudinaryResult.format,
        size: cloudinaryResult.bytes,
      },
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
