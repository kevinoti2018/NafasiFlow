import { db } from "@/lib/utils/db";
import { ActivateAccountSchema } from "@/lib/validations/auth";
import crypto from "crypto";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) => {
  const { token } = await params;

  try {
    // 1. Validate token format
    const parseResult = ActivateAccountSchema.safeParse({ token });
    if (!parseResult.success) {
      return renderStaticPage(
        {
          title: "Invalid Link",
          message:
            "This activation link is malformed. Please check the URL and try again.",
          type: "error",
          icon: "✕",
          action: { label: "Back to Login", link: "/login" },
        },
        400,
      );
    }

    const { token: validToken } = parseResult.data;

    // 2. Hash incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(validToken)
      .digest("hex");

    // 3. Find user
    const user = await db.user.findFirst({
      where: { activationToken: hashedToken },
    });

    if (!user) {
      return renderStaticPage(
        {
          title: "Link Not Found",
          message: "This activation link is invalid or has already been used.",
          type: "error",
          icon: "✕",
          action: { label: "Go to Login", link: "/login" },
        },
        404,
      );
    }

    // 4. Check Expiry
    if (user.activationExpiry && user.activationExpiry < new Date()) {
      return renderStaticPage(
        {
          title: "Link Expired",
          message: "For your security, activation links expire after 24 hours.",
          type: "error",
          icon: "⏱",
          action: {
            label: "Resend Activation Email",
            link: `/api/auth/resend-verification?email=${user.email}`,
          },
        },
        400,
      );
    }

    // 5. Activate User
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          activationToken: null,
          activationExpiry: null,
          isActive: true,
        },
      });

      // Optional: Add record to your EmailLog to track successful verification
      await tx.emailLog.create({
        data: {
          userId: user.id,
          recipient: user.email,
          subject: "Account Verified",
          type: "EMAIL_VERIFICATION",
          status: "DELIVERED",
          metadata: { verifiedAt: new Date().toISOString() },
        },
      });
    });

    return renderStaticPage(
      {
        title: "Account Verified!",
        message:
          "Your email has been confirmed. You're ready to start building your career momentum.",
        type: "success",
        icon: "✓",
        action: { label: "Go to Dashboard", link: "/dashboard" },
      },
      200,
    );
  } catch (error) {
    console.error("Activation error:", error);
    return renderStaticPage(
      {
        title: "Server Error",
        message: "An unexpected error occurred. Please try again later.",
        type: "error",
        icon: "!",
        action: { label: "Back to Login", link: "/login" },
      },
      500,
    );
  }
};

/**
 * Render the HTML Response with Emerald Branding
 */
function renderStaticPage(
  {
    title,
    message,
    type,
    icon,
    action,
  }: {
    title: string;
    message: string;
    type: "success" | "error";
    icon: string;
    action?: { label: string; link: string };
  },
  status: number,
) {
  // Emerald 500 (#10B981) for success, Rose 600 (#E11D48) for error
  const primaryColor = type === "success" ? "#10B981" : "#E11D48";
  const secondaryColor = type === "success" ? "#ECFDF5" : "#FFF1F2";

  return new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title} | Consistency</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          :root {
            --primary: ${primaryColor};
            --bg-icon: ${secondaryColor};
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: #F8FAFC;
            color: #0F172A;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh;
          }
          .container { width: 100%; max-width: 420px; padding: 20px; }
          .card {
            background: white;
            padding: 48px 32px;
            border-radius: 24px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            text-align: center;
            animation: popIn 0.4s ease-out;
          }
          .icon-wrapper {
            width: 64px; height: 64px; border-radius: 20px;
            margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
            font-size: 28px; background: var(--bg-icon); color: var(--primary);
          }
          h1 { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
          p { font-size: 15px; line-height: 1.6; color: #64748B; margin-bottom: 32px; }
          .button {
            display: block; width: 100%; background: var(--primary); color: white;
            padding: 14px; border-radius: 12px; text-decoration: none;
            font-weight: 600; transition: opacity 0.2s;
          }
          .button:hover { opacity: 0.9; }
          @keyframes popIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="icon-wrapper">${icon}</div>
            <h1>${title}</h1>
            <p>${message}</p>
            ${action ? `<a href="${action.link}" class="button">${action.label}</a>` : ""}
          </div>
        </div>
      </body>
    </html>
    `,
    { status, headers: { "Content-Type": "text/html" } },
  );
}
