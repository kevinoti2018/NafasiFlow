import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";

export async function DELETE() {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prisma will cascade delete all related records because of onDelete: Cascade in schema
  await db.user.delete({ where: { id: session.id } });

  return NextResponse.json({ success: true });
}
