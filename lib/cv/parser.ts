// lib/cv/parser.ts
import { readFile } from "fs/promises";
import crypto from "crypto";
import path from "path";
import { extractText } from "unpdf";
import mammoth from "mammoth";

// ===============================
// PDF extraction (using unpdf)
// ===============================
async function extractFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  const result = await extractText(uint8Array);
  // result.text may be string or array; handle both
  if (typeof result.text === "string") return result.text;
  if (Array.isArray(result.text)) return result.text.join("\n");
  return String(result.text || "");
}

// ===============================
// DOCX extraction (mammoth)
// ===============================
async function extractFromDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value; // already a string
}

// ===============================
// TXT extraction
// ===============================
async function extractFromTXT(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return content;
}

// ===============================
// Main extraction dispatcher
// ===============================
export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return extractFromPDF(filePath);
    case ".docx":
      return extractFromDOCX(filePath);
    case ".txt":
      return extractFromTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ===============================
// Normalization (safe for any input)
// ===============================
export function normalizeText(text: unknown): string {
  // Convert to string
  let str = "";
  if (typeof text === "string") {
    str = text;
  } else if (Array.isArray(text)) {
    str = text.join(" ");
  } else if (text !== null && text !== undefined) {
    str = String(text);
  }
  return str
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

// ===============================
// Hashing
// ===============================
export function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ===============================
// Combined processor
// ===============================
export async function processCVFile(filePath: string): Promise<{
  rawText: string;
  normalizedText: string;
  contentHash: string;
  fileHash: string;
}> {
  const rawText = await extractTextFromFile(filePath);
  const normalizedText = normalizeText(rawText);
  const contentHash = computeHash(normalizedText);
  const fileBuffer = await readFile(filePath);
  const fileHash = computeFileHash(fileBuffer);
  return { rawText, normalizedText, contentHash, fileHash };
}
