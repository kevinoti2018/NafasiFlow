// lib/utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // 2 minutes (default 60s)
});

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
  [key: string]: any;
}

async function uploadWithRetry(
  filePath: string,
  options: any = {},
  retries = 2,
  delay = 1000,
): Promise<CloudinaryUploadResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          filePath,
          { ...options, resource_type: options.resource_type || "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );
      });
    } catch (error: any) {
      const isTimeout =
        error?.http_code === 499 || error?.message?.includes("timeout");
      if (attempt === retries || !isTimeout) throw error;
      console.log(
        `Upload attempt ${attempt} failed, retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
  throw new Error("Upload failed after retries");
}

export async function uploadToCloudinary(
  filePath: string,
  options: any = {},
): Promise<CloudinaryUploadResult> {
  return uploadWithRetry(filePath, options, 3, 1000);
}

export async function deleteFromCloudinary(
  publicId: string,
  options: any = {},
): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { ...options, resource_type: options.resource_type || "raw" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });
}
