// app/api/applications/[appId]/timeline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { validateParams, handleZodError } from "@/lib/utils/validate";
import { appIdParamSchema } from "@/lib/validations/application";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams;
  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, appIdParamSchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    );
  }

  const application = await db.application.findFirst({
    where: { id: validatedParams.appId, userId: session.id },
    select: { id: true },
  });
  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const timeline = await db.statusLog.findMany({
    where: { applicationId: validatedParams.appId },
    orderBy: { changedAt: "asc" },
  });

  return NextResponse.json({ timeline });
}
