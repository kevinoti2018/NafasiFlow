// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.id;

  // Parallel queries for performance
  const [
    totalCVs,
    totalJobs,
    totalApplications,
    totalAnalyses,
    recentAnalyses,
    recentApplications,
    avgMatchScore,
    topCVs,
  ] = await Promise.all([
    db.cVVersion.count({ where: { userId } }),
    db.job.count({ where: { userId } }),
    db.application.count({ where: { userId } }),
    db.cVJobAnalysis.count({ where: { userId } }),
    db.cVJobAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        job: { select: { title: true, company: true } },
        cvVersion: { select: { name: true } },
      },
    }),
    db.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        job: { select: { title: true, company: true } },
        cvVersion: { select: { name: true } },
      },
    }),
    db.cVJobAnalysis.aggregate({
      where: { userId },
      _avg: { matchScore: true },
    }),
    db.cVVersion.findMany({
      where: { userId },
      orderBy: { atsFormatScore: "desc" },
      take: 3,
      select: { name: true, atsFormatScore: true, atsContentScore: true },
    }),
  ]);

  const avgScore = Math.round(avgMatchScore._avg.matchScore || 0);

  return NextResponse.json({
    totals: {
      cvs: totalCVs,
      jobs: totalJobs,
      applications: totalApplications,
      analyses: totalAnalyses,
    },
    averages: {
      matchScore: avgScore,
    },
    recent: {
      analyses: recentAnalyses,
      applications: recentApplications,
    },
    topCVs,
  });
}
