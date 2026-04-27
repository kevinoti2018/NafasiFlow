import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await db.linkedInProfile.findFirst({
    where: { id, userId: session.id },
  });
  if (!profile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versions = await db.linkedInProfile.findMany({
    where: { OR: [{ parentId: id }, { id: profile.parentId || undefined }] },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ versions });
}
