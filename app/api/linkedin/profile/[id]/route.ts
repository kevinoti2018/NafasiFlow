import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";

const YOUR_USER_ID = "69dd795d23f7c08684a34c8f";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id || session.id !== YOUR_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const profile = await db.linkedInProfile.findFirst({
    where: { id, userId: session.id },
  });
  if (!profile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    name,
    headline,
    about,
    experience,
    skills,
    certifications,
    education,
    volunteering,
    analysisResult,
  } = body;

  const profile = await db.linkedInProfile.findFirst({
    where: { id, userId: session.id },
  });
  if (!profile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.linkedInProfile.update({
    where: { id },
    data: {
      name: name ?? profile.name,
      headline: headline ?? profile.headline,
      about: about ?? profile.about,
      experience: experience ?? profile.experience,
      skills: skills ?? profile.skills,
      certifications: certifications ?? profile.certifications,
      education: education ?? profile.education,
      volunteering: volunteering ?? profile.volunteering,
      analysisResult: analysisResult ?? profile.analysisResult,
    },
  });
  return NextResponse.json({ profile: updated });
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id || session.id !== YOUR_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.linkedInProfile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
