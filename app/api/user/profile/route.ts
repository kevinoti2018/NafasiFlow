import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      isPasswordSet: true,
    },
  });
  return NextResponse.json({ user: dbUser });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.parse(body);

  // Use Prisma's generated type for update data
  const updateData: Prisma.UserUpdateInput = {};
  if (parsed.firstName !== undefined) updateData.firstName = parsed.firstName;
  if (parsed.lastName !== undefined) updateData.lastName = parsed.lastName;
  if (parsed.email !== undefined) updateData.email = parsed.email;

  const updated = await db.user.update({
    where: { id: session.id },
    data: updateData,
    select: { firstName: true, lastName: true, email: true, image: true },
  });
  return NextResponse.json({ user: updated });
}
