// lib/utils/validate.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function validateQuery<T>(req: NextRequest, schema: ZodSchema<T>): T {
  const searchParams = Object.fromEntries(new URL(req.url).searchParams);
  return schema.parse(searchParams);
}

// ✅ FIX: Make validateParams async and await the params promise
export async function validateParams<T>(
  params: Promise<unknown> | unknown,
  schema: ZodSchema<T>,
): Promise<T> {
  // Resolve the params promise if it's a Promise
  const resolvedParams = params instanceof Promise ? await params : params;
  return schema.parse(resolvedParams);
}

export function handleZodError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.issues },
      { status: 400 },
    );
  }
  return null;
}
