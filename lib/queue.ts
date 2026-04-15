import { db } from "./utils/db";
import { optimizeWithLLM } from "./utils/llmclient";

export async function queueJobAnalysis(jobId: string) {
  // For production, use BullMQ or similar. For simplicity, use setImmediate.
  setImmediate(async () => {
    try {
      const job = await db.job.findUnique({ where: { id: jobId } });
      if (!job) return;

      await db.job.update({
        where: { id: jobId },
        data: { analysisStatus: "processing" },
      });

      const structuredData = await optimizeWithLLM("jd", {
        job: {
          title: job.title || "",
          company: job.company || "",
          description: job.rawContent,
        },
      });

      await db.job.update({
        where: { id: jobId },
        data: {
          structuredData,
          analysisStatus: "completed",
          analyzedAt: new Date(),
          normalizedTitle: structuredData.parsed?.normalizedTitle,
          function: structuredData.parsed?.function,
          level: structuredData.parsed?.level,
        },
      });
    } catch (error) {
      console.error("Job analysis failed:", error);
      await db.job.update({
        where: { id: jobId },
        data: { analysisStatus: "failed" },
      });
    }
  });
}
