import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { isPasswordSet: true, password: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If user has no password set, allow setting a new password (no current password required)
  if (!user.isPasswordSet) {
    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    const { newPassword } = parsed.data;
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: session.id },
      data: { password: hashed, isPasswordSet: true },
    });
    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    });
  }

  // Existing password flow
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const isValid = await bcrypt.compare(currentPassword, user.password!);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: session.id },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
