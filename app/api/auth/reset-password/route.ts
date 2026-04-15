import bcrypt from "bcryptjs";
import { db } from "@/lib/utils/db";
import crypto from "crypto";
import { ZodError } from "zod";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const requestJson = await req.json();
    const { password, token } = resetPasswordSchema.parse(requestJson);

    // Hash the incoming token to match the database version
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await db.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gte: new Date() }, // Prisma handles Date objects directly
      },
      include: {
        passwordHistories: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Invalid or expired token. Please request a reset link again!",
        },
        { status: 404 },
      );
    }

    // Check if new password matches current password
    if (user.password) {
      const isMatchedCurrent = await bcrypt.compare(password, user.password);
      if (isMatchedCurrent) {
        return NextResponse.json(
          {
            message:
              "New password cannot be the same as your current password.",
          },
          { status: 400 },
        );
      }
    }

    // Check against the last 3 passwords in history
    const historyMatches = await Promise.all(
      user.passwordHistories.map((history) =>
        bcrypt.compare(password, history.passwordHash),
      ),
    );

    if (historyMatches.some((match) => match)) {
      return NextResponse.json(
        {
          message: "This password was used recently. Please choose a new one.",
        },
        { status: 400 },
      );
    }

    const salt = await bcrypt.genSalt(12); // Slightly stronger salt for the engine
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.$transaction(async (tx) => {
      // 1. Add to history
      await tx.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: hashedPassword,
        },
      });

      // 2. Update user credentials
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          isPasswordSet: true, // Ensuring this flag is correct
        },
      });

      // 3. Clean up old history (Keep only latest 3)
      const historyToDelete = await tx.passwordHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: 3,
      });

      if (historyToDelete.length > 0) {
        await tx.passwordHistory.deleteMany({
          where: { id: { in: historyToDelete.map((h) => h.id) } },
        });
      }
    });

    return NextResponse.json(
      { message: "Evolution secured. Password reset successfully." },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to process password change." },
      { status: 500 },
    );
  }
}
