import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { getLocalFileBuffer, deleteLocalFile } from "@/lib/utils/local-storage";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingCVs = await db.cVVersion.findMany({
    where: {
      uploadedToCloudinary: false,
      originalFileUrl: { not: null },
      localFilePath: { not: null },
    },
    take: 10,
  });

  const results = [];
  for (const cv of pendingCVs) {
    let tempPath: string | null = null;
    try {
      const localBuffer = await getLocalFileBuffer(cv.localFilePath!);
      const tempDir = os.tmpdir();
      tempPath = path.join(tempDir, `retry-${cv.id}-${Date.now()}.pdf`);
      await writeFile(tempPath, localBuffer);
      const cloudinaryResult = await uploadToCloudinary(tempPath, {
        upload_preset: "jobapp",
        folder: "cv-uploads",
        public_id: cv.id,
        resource_type: "auto",
      });
      await db.cVVersion.update({
        where: { id: cv.id },
        data: {
          originalFileUrl: cloudinaryResult.secure_url,
          originalPublicId: cloudinaryResult.public_id,
          uploadedToCloudinary: true,
          localFilePath: null,
        },
      });
      await deleteLocalFile(cv.localFilePath!);
      results.push({ id: cv.id, status: "success" });
    } catch (err) {
      console.error(`Failed to upload CV ${cv.id}:`, err);
      results.push({ id: cv.id, status: "failed", error: String(err) });
    } finally {
      if (tempPath) await unlink(tempPath).catch(() => {});
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
