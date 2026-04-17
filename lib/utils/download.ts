// lib/utils/download.ts
export async function downloadFile(
  url: string,
  timeoutMs: number = 30000,
  retries: number = 2,
): Promise<Buffer> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      lastError = err as Error;
      console.warn(`Download attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt)); // exponential backoff
      }
    }
  }
  throw new Error(
    `Download failed after ${retries} attempts: ${lastError?.message}`,
  );
}
