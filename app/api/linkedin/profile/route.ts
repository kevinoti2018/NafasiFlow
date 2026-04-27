import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";

export async function GET() {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profiles = await db.linkedInProfile.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const {
    parentId,
    name,
    headline,
    about,
    experience,
    skills,
    certifications,
    education,
    volunteering,
  } = body;
  const profile = await db.linkedInProfile.create({
    data: {
      userId: session.id,
      parentId: parentId || null,
      name: name || null,
      headline: headline || null,
      about: about || null,
      experience: experience || null,
      skills: skills || null,
      certifications: certifications || null,
      education: education || null,
      volunteering: volunteering || null,
      version: parentId ? { increment: 1 } : 1,
    },
  });
  return NextResponse.json({ profile }, { status: 201 });
}
