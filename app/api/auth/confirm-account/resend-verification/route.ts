import { db } from "@/lib/utils/db";
import { EmailStatus, EmailType } from "@/lib/constants/auth";
import { ZodError, z } from "zod";
import crypto from "crypto";

const ResendVerificationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

// --- Core Logic: Aligned with Consistency Tracker Schema ---
const handleResend = async (email: string) => {
  const user = await db.user.findUnique({
    where: { email },
  });

  // Security: Generic response to prevent email enumeration
  const genericSuccess = {
    message: "If an unverified account exists, a new link has been dispatched.",
    status: 200,
  };

  if (!user) return { data: genericSuccess, status: 200 };
  if (user.isActive)
    return {
      data: { message: "Account already active. System access is open." },
      status: 400,
    };

  // 1. Check Cooldown using your EmailLog schema
  const lastEmailLog = await db.emailLog.findFirst({
    where: { userId: user.id, type: EmailType.EMAIL_VERIFICATION },
    orderBy: { createdAt: "desc" },
  });

  const COOLDOWN_SECONDS = 60;
  if (
    lastEmailLog &&
    Date.now() - new Date(lastEmailLog.createdAt).getTime() <
      COOLDOWN_SECONDS * 1000
  ) {
    const remaining = Math.ceil(
      COOLDOWN_SECONDS -
        (Date.now() - new Date(lastEmailLog.createdAt).getTime()) / 1000,
    );
    return {
      data: {
        message: `Rate limit hit. Please wait ${remaining}s before retrying.`,
      },
      status: 429,
    };
  }

  // 2. Generate New Credentials
  const newActivationToken = crypto.randomBytes(32).toString("hex");
  const newHashedToken = crypto
    .createHash("sha256")
    .update(newActivationToken)
    .digest("hex");
  const newActivationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 3. Atomic Transaction
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        activationToken: newHashedToken,
        activationExpiry: newActivationExpiry,
      },
    });

    await tx.emailLog.create({
      data: {
        userId: user.id,
        subject: "Account Activation",
        recipient: user.email,
        type: EmailType.EMAIL_VERIFICATION,
        status: EmailStatus.PENDING,
        metadata: { token: newActivationToken },
      },
    });
  });

  return {
    data: {
      message: "A fresh activation link has been dispatched to your terminal.",
    },
    status: 200,
  };
};

// --- GET: Handles the "Resend" button from the HTML Expired Page ---
export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ message: "Token is required" }, { status: 400 });
  }

  // Find user by the token currently in their browser
  const user = await db.user.findFirst({
    where: { activationToken: token }, // Note: If stored as hash, you'd need the raw email instead
    select: { email: true },
  });

  if (!user) {
    return new Response(
      renderStatusHTML("Invalid or used session token.", 400),
      {
        headers: { "Content-Type": "text/html" },
        status: 400,
      },
    );
  }

  const result = await handleResend(user.email);

  return new Response(renderStatusHTML(result.data.message, result.status), {
    headers: { "Content-Type": "text/html" },
    status: result.status,
  });
};

// --- POST: Handles AJAX calls from the Login/Register UI ---
export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { email } = ResendVerificationSchema.parse(body);
    const result = await handleResend(email);
    return Response.json(result.data, { status: result.status });
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 },
      );
    console.error("Resend Error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
};

function renderStatusHTML(message: string, status: number) {
  const isError = status >= 400;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
      </head>
      <body class="bg-[#F8FAFC] flex items-center justify-center min-h-screen p-6">
        <div class="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100 max-w-sm w-full text-center">
            <div class="text-6xl mb-6">${isError ? "⏱" : "✉️"}</div>
            <h1 class="text-2xl font-black text-slate-900 mb-4">${isError ? "Wait up!" : "Check Inbox"}</h1>
            <p class="text-slate-500 leading-relaxed mb-8">${message}</p>
            <a href="/login" class="block w-full py-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100">
                Back to Login
            </a>
        </div>
      </body>
    </html>`;
}
