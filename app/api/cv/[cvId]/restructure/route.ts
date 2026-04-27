// app/api/cv/[cvId]/restructure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { optimizeWithLLM } from "@/lib/utils/llmclient";
import { extractTextFromFile, normalizeText } from "@/lib/cv/parser";
import { downloadFile } from "@/lib/utils/download";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    validatedParams = await validateParams(await params, cvIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid CV ID" }, { status: 400 })
    );
  }

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  // Need raw text – either from profile.rawText or download original file
  let rawText: string | undefined = undefined;
  // Safely check if profile is an object with rawText
  if (cv.profile && typeof cv.profile === "object" && "rawText" in cv.profile) {
    rawText = (cv.profile as { rawText?: string }).rawText;
  }
  if (!rawText && cv.originalFileUrl) {
    // Download file and extract text
    const buffer = await downloadFile(cv.originalFileUrl);
    const tempPath = path.join(os.tmpdir(), `${cv.id}-restructure.pdf`);
    await writeFile(tempPath, buffer);
    try {
      rawText = await extractTextFromFile(tempPath);
    } finally {
      await unlink(tempPath).catch(() => {});
    }
  }
  if (!rawText) {
    return NextResponse.json(
      { error: "Cannot restructure: no text source" },
      { status: 400 },
    );
  }

  // Cast the result to Prisma.InputJsonValue
  const structuredProfile = (await optimizeWithLLM("cvStructure", {
    rawText,
  })) as Prisma.InputJsonValue;

  await db.cVVersion.update({
    where: { id: cv.id },
    data: { profile: structuredProfile },
  });

  return NextResponse.json({ success: true });
}
