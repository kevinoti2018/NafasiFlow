import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { optimizeWithLLM } from "@/lib/utils/llmclient";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    section,
    headline,
    about,
    experience,
    skills,
    certifications,
    education,
    volunteering,
  } = body;

  // Single section optimization
  if (section) {
    const validSections = [
      "headline",
      "about",
      "experience",
      "skills",
      "certifications",
      "education",
      "volunteering",
    ];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }
    const content = body[section];
    if (!content) {
      return NextResponse.json(
        { error: `No content provided for section: ${section}` },
        { status: 400 },
      );
    }

    try {
      const result = await optimizeWithLLM("linkedinOptimizeSection", {
        section,
        content,
      });
      // ✅ Ensure result is an object before spreading
      const responseData = {
        success: true,
        section,
        ...(typeof result === "object" && result !== null ? result : {}),
      };
      return NextResponse.json(responseData);
    } catch (error) {
      console.error(
        `LinkedIn optimization error for section ${section}:`,
        error,
      );
      return NextResponse.json(
        { error: "Failed to optimize section" },
        { status: 500 },
      );
    }
  }

  // Full profile optimization (original)
  if (
    !headline &&
    !about &&
    !experience &&
    !skills &&
    !certifications &&
    !education &&
    !volunteering
  ) {
    return NextResponse.json(
      { error: "At least one section must be provided" },
      { status: 400 },
    );
  }

  try {
    const result = await optimizeWithLLM("linkedinOptimizeStructured", {
      headline: headline || "",
      about: about || "",
      experience: experience || "",
      skills: skills || "",
      certifications: certifications || "",
      education: education || "",
      volunteering: volunteering || "",
    });
    // ✅ Same safety check here
    const responseData = {
      success: true,
      ...(typeof result === "object" && result !== null ? result : {}),
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("LinkedIn optimization error:", error);
    return NextResponse.json(
      { error: "Failed to analyze profile" },
      { status: 500 },
    );
  }
}
