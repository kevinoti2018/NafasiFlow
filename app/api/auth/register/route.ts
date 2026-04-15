import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/utils/db";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate Input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName } = result.data;

    // 2. Check for Existing User
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "This email is already registered. Access session instead.",
        },
        { status: 409 },
      );
    }

    // 3. Hash Password & Create User
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        isPasswordSet: true,
        isActive: true,
        role: "USER",
      },
    });

    // 4. Initialize Evolution (Future: Trigger Welcome Email/Verification here)
    return NextResponse.json(
      {
        message: "Evolution initialized. Welcome to the engine.",
        user: { email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]:", error);
    return NextResponse.json(
      { message: "Internal system error during initialization." },
      { status: 500 },
    );
  }
}
