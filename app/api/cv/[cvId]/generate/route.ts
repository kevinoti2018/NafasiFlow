// app/api/cv/[cvId]/generate/route.ts
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

const generateBodySchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
});

export async function POST(
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

  // If the CV already has a generated PDF and we are not forcing regeneration, return that URL
  if (cv.generatedFileUrl && !body.forceRegenerate) {
    return NextResponse.json({ fileUrl: cv.generatedFileUrl, reused: true });
  }

  // Check if the profile is raw text (needs structuring)
  let profile = cv.profile as any;
  if (
    profile &&
    typeof profile === "object" &&
    "rawText" in profile &&
    !profile.summary &&
    !profile.experience
  ) {
    // Raw text – call AI to structure it
    console.log("CV profile is raw text, restructuring via AI...");
    try {
      const structured = await optimizeWithLLM("cvStructure", {
        rawText: profile.rawText,
      });
      profile = structured;
      // Update the database with the structured profile
      await db.cVVersion.update({
        where: { id: cv.id },
        data: { profile },
      });
    } catch (err) {
      console.error("AI restructuring failed, falling back to raw text", err);
      // Continue with raw text – PDF will be sparse
    }
  }

  // Generate PDF from the (now possibly structured) profile
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
