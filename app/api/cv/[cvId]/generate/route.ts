import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateBody,
  handleZodError,
} from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { z } from "zod";
import { generateCVPDF } from "@/lib/pdf/generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { optimizeWithLLM } from "@/lib/utils/llmclient";
import type { CVInput } from "@/lib/ai/prompts";

const generateBodySchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
  templateId: z.string().nullable().optional(),
});

type GenerateBody = z.infer<typeof generateBodySchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams: { cvId: string };
  let body: GenerateBody;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
    body = await validateBody(req, generateBodySchema);
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

  // If we have a cached PDF and not forcing regeneration, return it
  if (cv.generatedFileUrl && !body.forceRegenerate) {
    return NextResponse.json({ fileUrl: cv.generatedFileUrl, reused: true });
  }

  // Prepare profile (ensure it's a structured CVInput)
  let profile: CVInput = cv.profile as CVInput;
  const isRawText =
    typeof profile === "object" &&
    "rawText" in profile &&
    !profile.summary &&
    !profile.experience?.length;

  if (isRawText) {
    console.log("CV profile is raw text, restructuring via AI...");
    try {
      const structured = await optimizeWithLLM("cvStructure", {
        rawText: (profile as { rawText: string }).rawText,
      });
      profile = structured as CVInput;
      await db.cVVersion.update({
        where: { id: cv.id },
        data: { profile },
      });
    } catch (err) {
      console.error("AI restructuring failed, falling back to raw text", err);
      // Keep raw text – PDF will be sparse
    }
  }

  // Determine template style from templateId
  let templateStyle: "modern" | "classic" | "minimal" = "modern";
  if (body.templateId) {
    const template = await db.template.findFirst({
      where: {
        id: body.templateId,
        OR: [{ userId: session.id }, { isSystem: true }],
      },
    });
    if (template) {
      const nameLower = template.name.toLowerCase();
      if (nameLower.includes("classic")) templateStyle = "classic";
      else if (nameLower.includes("minimal")) templateStyle = "minimal";
      else templateStyle = "modern";
    }
  }

  // Generate PDF
  const pdfBuffer = await generateCVPDF(profile);

  // Save temp file
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `${cv.id}-${Date.now()}.pdf`);
  await writeFile(tempPath, pdfBuffer);

  let generatedFileUrl = "";
  let generatedPublicId = "";
  try {
    const uploadResult = await uploadToCloudinary(tempPath, {
      upload_preset: "jobapp",
      folder: "generated-cvs",
      public_id: `generated_${cv.id}_${Date.now()}`,
      resource_type: "auto",
    });
    generatedFileUrl = uploadResult.secure_url;
    generatedPublicId = uploadResult.public_id;
  } finally {
    await unlink(tempPath).catch(() => {});
  }

  // Update CV record
  await db.cVVersion.update({
    where: { id: cv.id },
    data: { generatedFileUrl, generatedPublicId },
  });

  return NextResponse.json({ fileUrl: generatedFileUrl, reused: false });
}
