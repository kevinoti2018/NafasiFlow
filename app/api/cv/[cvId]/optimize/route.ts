/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cv/[cvId]/optimize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateBody,
  handleZodError,
} from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { z } from "zod";
import { optimizeWithLLM } from "@/lib/utils/llmclient";
import type { CVInput } from "@/lib/ai/prompts";

const optimizeBodySchema = z.object({
  jobId: z.string().optional(),
  type: z.enum(["general", "job"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams, body;
  try {
    validatedParams = await validateParams(await params, cvIdParamSchema);
    body = await validateBody(req, optimizeBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  const { jobId, type } = body;

  // Fetch original CV
  const originalCV = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!originalCV) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  // ✅ Cast profile to CVInput (it should match that structure)
  const profile = originalCV.profile as CVInput;

  let job = null;
  if (type === "job") {
    if (!jobId) {
      return NextResponse.json(
        { error: "jobId required for job‑tailored optimization" },
        { status: 400 },
      );
    }
    job = await db.job.findFirst({ where: { id: jobId, userId: session.id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
  }

  // Run AI optimization
  let optimizedProfile: CVInput;

  if (type === "general") {
    // Use optimizePrompt (restructure CV for ATS readability)
    const result = await optimizeWithLLM("optimize", {
      cv: profile,
      job: { title: "", company: "", description: "" }, // dummy job – but schema requires job
    });
    // The result contains restructuredCV
    optimizedProfile = (result as any).restructuredCV as CVInput;
  } else {
    // Use sellPrompt (job‑tailored rewrite)
    const result = await optimizeWithLLM("sell", {
      cv: profile,
      job: {
        title: job!.title || "",
        company: job!.company || "",
        description: job!.rawContent,
      },
      primaryChallenge: (job!.structuredData as any)?.painPoints
        ?.primaryChallenge,
      targetPersona: (job!.structuredData as any)?.idealCandidatePersona?.type,
    });
    // Transform the sell result into a CV profile structure
    const sellResult = result as any;
    optimizedProfile = {
      summary: sellResult.profileOptimization?.elevatorPitch,
      experience: profile.experience?.map((exp, idx) => ({
        role: exp.role,
        company: exp.company,
        duration: exp.duration,
        bullets:
          sellResult.experienceTransformations?.[idx]?.optimizedBullets ||
          exp.bullets,
      })),
      skills: profile.skills,
      education: profile.education,
      projects: profile.projects,
    };
  }

  // Create new CVVersion
  const newCV = await db.cVVersion.create({
    data: {
      userId: session.id,
      parentId: originalCV.id,
      profile: optimizedProfile as any, // Prisma accepts Json
      source: "optimized",
      atsFormatScore: originalCV.atsFormatScore,
      atsContentScore:
        type === "general"
          ? (optimizedProfile as any)?.optimizationSummary?.atsReadability ===
            "high"
            ? 85
            : 70
          : null,
      analysisVersion: originalCV.analysisVersion,
      originalFileUrl: originalCV.originalFileUrl,
      originalPublicId: originalCV.originalPublicId,
    },
  });

  return NextResponse.json({ cvVersion: newCV });
}
