// lib/utils/local-storage.ts
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR =
  process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), "public/uploads");

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);
  // Return public URL path
  return `/uploads/${fileName}`;
}

export async function getLocalFileBuffer(fileUrl: string): Promise<Buffer> {
  // fileUrl is like "/uploads/filename.pdf"
  const localPath = path.join(process.cwd(), "public", fileUrl);
  return readFile(localPath);
}

export async function deleteLocalFile(fileUrl: string): Promise<void> {
  try {
    const localPath = path.join(process.cwd(), "public", fileUrl);
    await unlink(localPath);
  } catch (e) {
    // ignore if file doesn't exist
  }
}
