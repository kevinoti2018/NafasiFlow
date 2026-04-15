// app/api/cv/retry-cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session"; // optional: use admin key or no auth for cron
import { db } from "@/lib/utils/db";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { getLocalFileBuffer, deleteLocalFile } from "@/lib/utils/local-storage";
import path from "path";

export async function POST(req: NextRequest) {
  // Optional: add a secret header for cron job security
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find CVs that failed to upload to Cloudinary
  const pendingCVs = await db.cVVersion.findMany({
    where: {
      uploadedToCloudinary: false,
      originalFileUrl: { not: null },
    },
    take: 10, // process in batches
  });

  const results = [];
  for (const cv of pendingCVs) {
    try {
      // localFilePath is the URL path (e.g., "/uploads/...")
      const localBuffer = await getLocalFileBuffer(cv.localFilePath!);
      // Re-upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(localBuffer, {
        upload_preset: "jobapp",
        folder: "cv-uploads",
        public_id: cv.id, // use CV id as public_id to avoid duplicates
      });
      // Update CV record
      await db.cVVersion.update({
        where: { id: cv.id },
        data: {
          originalFileUrl: cloudinaryResult.secure_url,
          originalPublicId: cloudinaryResult.public_id,
          uploadedToCloudinary: true,
          localFilePath: null,
        },
      });
      // Delete local file after successful upload
      await deleteLocalFile(cv.localFilePath!);
      results.push({ id: cv.id, status: "success" });
    } catch (err) {
      console.error(`Failed to upload CV ${cv.id}:`, err);
      results.push({ id: cv.id, status: "failed", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
