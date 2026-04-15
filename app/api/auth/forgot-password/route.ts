import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import crypto from "crypto";
import { EmailStatus, EmailType } from "@/lib/constants/auth";

export const POST = async (req: Request) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    /**
     * Ghost response: prevents account enumeration by returning success
     * even if the email isn't in our database.
     */
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been dispatched." },
        { status: 200 },
      );
    }

    // 1. Generate secure tokens
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiry for 1 Hour from now
    const expiry = new Date(Date.now() + 3600000);

    await db.$transaction(async (tx) => {
      // 2. Update User with secure reset hash
      await tx.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: expiry,
        },
      });

      // 3. Queue Email Log using our strictly typed Enums
      await tx.emailLog.create({
        data: {
          userId: user.id,
          recipient: user.email,
          subject: "Reset your Consistency Password",
          type: EmailType.PASSWORD_RESET,
          status: EmailStatus.QUEUED,
          metadata: {
            token: resetToken, // The raw token to be sent in the URL
            firstName: user.firstName || "User",
          },
        },
      });
    });

    return NextResponse.json({
      message: "Recovery link dispatched. Please check your inbox.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]:", error);
    return NextResponse.json(
      { message: "Internal System Error during recovery dispatch." },
      { status: 500 },
    );
  }
};
