// app/api/cv/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateQuery, handleZodError } from "@/lib/utils/validate";
import { cvListQuerySchema } from "@/lib/validations/cv";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query;
  try {
    query = validateQuery(req, cvListQuerySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid query" }, { status: 400 })
    );
  }

  const { page, limit, source, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: any = { userId: session.id };
  if (source) where.source = source;

  const [cvVersions, totalCount] = await Promise.all([
    db.cVVersion.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            job: { select: { title: true, company: true } },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { applications: true, cvJobAnalyses: true } },
      },
    }),
    db.cVVersion.count({ where }),
  ]);

  return NextResponse.json({
    cvVersions,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
