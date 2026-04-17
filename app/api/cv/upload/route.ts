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
import { optimizeWithLLM } from "@/lib/utils/llmclient";

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

  // Check for exact binary duplicate
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

  const warnings: string[] = [];

  try {
    const extractedText = await extractTextFromFile(tempPath);
    const normalizedText = normalizeText(extractedText);
    const contentHash = computeHash(normalizedText);

    // Format analysis (always runs)
    const formatAnalysis = await analyzeFormat(tempPath, extractedText);

    // Check for semantic duplicate
    const existingSemantic = await db.cVVersion.findFirst({
      where: { contentHash, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    let profile = null;
    let parentId = null;
    let contentAnalysis = null;

    if (existingSemantic) {
      // Reuse existing profile and scores
      profile = existingSemantic.profile;
      parentId = existingSemantic.id;
      contentAnalysis = {
        atsContentScore: existingSemantic.atsContentScore,
        impactScore: existingSemantic.impactScore,
        keywordCoverage: existingSemantic.keywordCoverage,
      };
    } else {
      // Run content analysis (AI) with fallback
      try {
        contentAnalysis = await analyzeContent(extractedText);
      } catch (aiError) {
        console.error("Content analysis failed:", aiError);
        warnings.push("Content analysis failed; using default scores.");
        contentAnalysis = {
          atsContentScore: 50,
          impactScore: 50,
          keywordCoverage: 50,
        };
      }

      // AI structuring of CV profile
      try {
        const structuredProfile = await optimizeWithLLM("cvStructure", {
          rawText: extractedText,
        });
        profile = structuredProfile;
      } catch (structError) {
        console.error("CV structuring failed:", structError);
        warnings.push("AI structuring failed; raw text will be stored.");
        profile = { rawText: extractedText };
      }
    }

    // Cloudinary upload with fallback
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
        public_id: `${uniqueId}_${safeFilename}`,
        resource_type: "raw",
      });
      originalFileUrl = cloudinaryResult.secure_url;
      originalPublicId = cloudinaryResult.public_id;
      uploadedToCloudinary = true;
    } catch (cloudinaryError) {
      console.warn(
        "Cloudinary upload failed, saving locally:",
        cloudinaryError,
      );
      warnings.push("Cloudinary upload failed; file stored locally.");
      const localUrl = await saveFileLocally(buffer, file.name);
      originalFileUrl = localUrl;
      localFilePath = localUrl;
      uploadedToCloudinary = false;
    }
    const originalFileName = path.parse(file.name).name;
    const friendlyName =
      originalFileName.length > 50
        ? originalFileName.slice(0, 47) + "..."
        : originalFileName;

    // Create CVVersion record
    const cvVersion = await db.cVVersion.create({
      data: {
        userId: user.id,
        name: friendlyName,
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
      {
        cvVersion,
        reused: !!existingSemantic,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { status: 201 },
    );
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
