// app/api/templates/[templateId]/reanalyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { templateIdParamSchema } from "@/lib/validations/template";
import { downloadFile } from "@/lib/utils/download";
import { analyzeTemplate } from "@/lib/template/section-analyzer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(await params, templateIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    );
  }

  const template = await db.template.findFirst({
    where: {
      id: validatedParams.templateId,
      OR: [{ userId: session.id }, { isSystem: true }],
    },
  });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  if (template.type !== "docx") {
    return NextResponse.json(
      { error: "Only DOCX templates can be re‑analyzed" },
      { status: 400 },
    );
  }

  // Download the file from Cloudinary
  const fileBuffer = await downloadFile(template.fileUrl);
  const { foundSections, missingSections, rawText } =
    await analyzeTemplate(fileBuffer);

  // Update metadata
  const updatedMetadata = {
    ...(template.metadata as any),
    foundSections,
    missingSections,
    rawText,
    lastAnalyzedAt: new Date().toISOString(),
  };

  const updated = await db.template.update({
    where: { id: template.id },
    data: { metadata: updatedMetadata },
  });

  return NextResponse.json({ template: updated });
}
