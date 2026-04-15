// app/api/cv/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { db } from "@/lib/utils/db";
import {
  extractTextFromFile,
  normalizeText,
  computeHash,
} from "@/lib/cv/parser";
import { analyzeFormat } from "@/lib/cv/format-analyzer";
import { analyzeContent } from "@/lib/cv/content-analyzer";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { saveFileLocally } from "@/lib/utils/local-storage";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Check for exact binary duplicate (same file) for this user
  const existingExact = await db.cVVersion.findFirst({
    where: { fileHash, userId: user.id },
  });
  if (existingExact) {
    return NextResponse.json(
      {
        error: "This exact file has already been uploaded",
        cvVersion: existingExact,
      },
      { status: 409 },
    );
  }

  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `${Date.now()}-${file.name}`);
  await writeFile(tempPath, buffer);

  try {
    const extractedText = await extractTextFromFile(tempPath);
    const normalizedText = normalizeText(extractedText);
    const contentHash = computeHash(normalizedText);

    // Format analysis
    const formatAnalysis = await analyzeFormat(tempPath, extractedText);

    // Check for semantic duplicate (same content)
    const existingSemantic = await db.cVVersion.findFirst({
      where: { contentHash, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    let profile = null;
    let parentId = null;
    let contentAnalysis = null;

    if (existingSemantic) {
      // Reuse structured profile and content scores
      profile = existingSemantic.profile;
      parentId = existingSemantic.id;
      contentAnalysis = {
        atsContentScore: existingSemantic.atsContentScore,
        impactScore: existingSemantic.impactScore,
        keywordCoverage: existingSemantic.keywordCoverage,
      };
    } else {
      contentAnalysis = await analyzeContent(extractedText);
    }

    // --- Cloudinary upload with fallback to local storage ---
    let originalFileUrl = "";
    let originalPublicId = "";
    let uploadedToCloudinary = false;
    let localFilePath: string | null = null;
    const uniqueId = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const safeFilename = path
      .parse(file.name)
      .name.replace(/[^a-zA-Z0-9-_]/g, "_");
    try {
      const cloudinaryResult = await uploadToCloudinary(tempPath, {
        upload_preset: "jobapp",
        folder: "cv-uploads",
        public_id: `${uniqueId}_${safeFilename}`, // ← Must be unique, cannot exist
        resource_type: "raw",
      });
      originalFileUrl = cloudinaryResult.secure_url;
      originalPublicId = cloudinaryResult.public_id;
      uploadedToCloudinary = true;
    } catch (cloudinaryError) {
      console.warn(
        "Cloudinary upload failed, falling back to local storage:",
        cloudinaryError,
      );
      const localUrl = await saveFileLocally(buffer, file.name);
      originalFileUrl = localUrl;
      localFilePath = localUrl; // e.g., "/uploads/12345-my-cv.pdf"
      uploadedToCloudinary = false;
    }

    // Create CVVersion record
    const cvVersion = await db.cVVersion.create({
      data: {
        userId: user.id,
        parentId,
        fileHash,
        contentHash,
        profile: profile || { rawText: extractedText },
        originalFileUrl,
        originalPublicId,
        source: "upload",
        atsFormatScore: formatAnalysis.atsFormatScore,
        parsingConfidence: formatAnalysis.parsingConfidence,
        formatIssues: formatAnalysis.issues,
        parserUsed: formatAnalysis.parserUsed,
        atsContentScore: contentAnalysis.atsContentScore,
        impactScore: contentAnalysis.impactScore,
        keywordCoverage: contentAnalysis.keywordCoverage,
        analysisVersion: 1,
        lastAnalyzedAt: new Date(),
        uploadedToCloudinary,
        localFilePath,
      },
    });

    return NextResponse.json(
      { cvVersion, reused: !!existingSemantic },
      { status: 201 },
    );
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
