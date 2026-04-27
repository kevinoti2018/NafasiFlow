// app/api/cv/[cvId]/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/session";
import { db } from "@/lib/utils/db";
import {
  validateParams,
  validateBody,
  handleZodError,
} from "@/lib/utils/validate";
import { cvIdParamSchema } from "@/lib/validations/cv";
import { z } from "zod";
import { generateCVPDF } from "@/lib/pdf/generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { optimizeWithLLM } from "@/lib/utils/llmclient";
import type { CVInput } from "@/lib/ai/prompts";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { downloadFile } from "@/lib/utils/download";
import { injectMissingSections } from "@/lib/docx/inject-sections";

const generateBodySchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
  templateId: z.string().nullable().optional(),
});

type GenerateBody = z.infer<typeof generateBodySchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const session = await getCurrentUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedParams: { cvId: string };
  let body: GenerateBody;

  try {
    const resolvedParams = await params;
    validatedParams = await validateParams(resolvedParams, cvIdParamSchema);
    body = await validateBody(req, generateBodySchema);
  } catch (error) {
    return (
      handleZodError(error) ??
      NextResponse.json({ error: "Invalid input" }, { status: 400 })
    );
  }

  console.log(
    `[Generate] cvId=${validatedParams.cvId} templateId=${body.templateId ?? "null"} userId=${session.id}`,
  );

  const cv = await db.cVVersion.findFirst({
    where: { id: validatedParams.cvId, userId: session.id },
  });
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  // Return cached PDF if not forcing regeneration
  if (cv.generatedFileUrl && !body.forceRegenerate) {
    console.log(`[Generate] Returning cached file: ${cv.generatedFileUrl}`);
    return NextResponse.json({ fileUrl: cv.generatedFileUrl, reused: true });
  }

  // ── Ensure structured profile ──────────────────────────────────────
  let profile: CVInput = cv.profile as CVInput;
  const isRawText =
    typeof profile === "object" &&
    "rawText" in profile &&
    !profile.summary &&
    !profile.experience?.length;

  if (isRawText) {
    console.log("[Generate] Profile is raw text — running AI restructuring…");
    try {
      const structured = await optimizeWithLLM("cvStructure", {
        rawText: (profile as { rawText: string }).rawText,
      });
      profile = structured as CVInput;
      await db.cVVersion.update({
        where: { id: cv.id },
        data: { profile },
      });
      console.log("[Generate] AI restructuring complete.");
    } catch (err) {
      console.error("[Generate] AI restructuring failed, using raw text.", err);
    }
  }

  // ── DOCX template path ─────────────────────────────────────────────
  if (body.templateId) {
    console.log(`[Generate] Looking up template id=${body.templateId}`);

    // Broaden lookup: user's own templates, system templates, or default templates
    const template = await db.template.findFirst({
      where: {
        id: body.templateId,
        OR: [{ userId: session.id }, { isSystem: true }, { isDefault: true }],
      },
    });

    if (!template) {
      console.error(
        `[Generate] Template ${body.templateId} not found for user ${session.id}`,
      );
      return NextResponse.json(
        {
          error:
            "Template not found. It may have been deleted or you don't have access.",
        },
        { status: 404 },
      );
    }

    if (template.type !== "docx") {
      return NextResponse.json(
        { error: "Only DOCX templates are supported for generation." },
        { status: 400 },
      );
    }

    console.log(
      `[Generate] Using template: "${template.name}" (id=${template.id}, system=${template.isSystem})`,
    );

    // Download template file
    const templateBuffer = await downloadFile(template.fileUrl);

    // Determine which CV sections exist
    const cvSections = [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
      "certifications",
      "referees",
      "extracurricular",
      "contact",
    ].filter((section) => {
      const value = (profile as any)[section];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object")
        return value && Object.keys(value).length > 0;
      return !!value;
    });

    const templateSections = (template.metadata as any)?.foundSections || [];
    const missingSections = cvSections.filter(
      (s) => !templateSections.includes(s),
    );

    console.log(`[Generate] CV sections: ${cvSections.join(", ")}`);
    console.log(`[Generate] Template sections: ${templateSections.join(", ")}`);
    console.log(
      `[Generate] Injecting missing sections: ${missingSections.join(", ") || "none"}`,
    );

    // Inject missing sections into template XML
    let finalBuffer = templateBuffer;
    if (missingSections.length > 0) {
      finalBuffer = injectMissingSections(templateBuffer, missingSections);
    }

    // Build template data object
    const data: any = {};

    if (profile.summary) data.summary = profile.summary;

    if (profile.skills) data.skills = profile.skills.join(", ");

    if (profile.education) {
      data.education = profile.education
        .map((edu) => `${edu.degree}, ${edu.institution} (${edu.year})`)
        .join("\n");
    }

    if (profile.projects) {
      data.projects = profile.projects
        .map((proj) => `${proj.name}: ${proj.description}`)
        .join("\n");
    }

    if (profile.certifications) {
      data.certifications = profile.certifications
        .map(
          (cert) =>
            `${cert.name} – ${cert.issuer}${cert.date ? ` (${cert.date})` : ""}`,
        )
        .join("\n");
    }

    if (profile.referees) {
      data.referees = profile.referees
        .map(
          (ref) =>
            `${ref.name}${ref.position ? `, ${ref.position}` : ""}${ref.company ? ` at ${ref.company}` : ""}`,
        )
        .join("\n");
    }

    if (profile.extracurricular) {
      data.extracurricular = profile.extracurricular
        .map(
          (act) =>
            `${act.activity}${act.role ? ` – ${act.role}` : ""}${act.description ? `: ${act.description}` : ""}`,
        )
        .join("\n");
    }

    if (profile.contact) {
      const contactLines = [
        profile.contact.name,
        profile.contact.email,
        profile.contact.phone,
        profile.contact.location,
        profile.contact.linkedin,
        profile.contact.github,
      ].filter(Boolean);
      if (contactLines.length) data.contact = contactLines.join(" | ");
    }

    // Experience array for docxtemplater loops
    data.experience =
      profile.experience?.map((exp) => ({
        role: exp.role,
        company: exp.company,
        duration: exp.duration,
        bullets: exp.bullets?.map((b) => `• ${b}`).join("\n") || "",
      })) || [];

    // Render via docxtemplater
    const zip = new PizZip(finalBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    try {
      doc.render(data);
    } catch (renderErr: any) {
      console.error("[Generate] Docxtemplater render error:", renderErr);
      return NextResponse.json(
        {
          error:
            "Failed to render template. The template may contain unsupported placeholders.",
        },
        { status: 500 },
      );
    }

    const generatedBuffer = doc.getZip().generate({ type: "nodebuffer" });

    // Save temp file and upload
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `${cv.id}-${Date.now()}.docx`);
    await writeFile(tempPath, generatedBuffer);

    let generatedFileUrl = "";
    let generatedPublicId = "";

    try {
      const uploadResult = await uploadToCloudinary(tempPath, {
        upload_preset: "jobapp",
        folder: "generated-cvs",
        public_id: `generated_${cv.id}_${Date.now()}`,
        resource_type: "raw",
      });
      generatedFileUrl = uploadResult.secure_url;
      generatedPublicId = uploadResult.public_id;
      console.log(`[Generate] Uploaded DOCX: ${generatedFileUrl}`);
    } finally {
      await unlink(tempPath).catch(() => {});
    }

    await db.cVVersion.update({
      where: { id: cv.id },
      data: { generatedFileUrl, generatedPublicId },
    });

    return NextResponse.json({ fileUrl: generatedFileUrl, reused: false });
  }

  // ── PDF fallback (no template selected) ───────────────────────────
  console.log(
    "[Generate] No templateId provided — falling back to PDF generation.",
  );

  const pdfBuffer = await generateCVPDF(profile);
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `${cv.id}-${Date.now()}.pdf`);
  await writeFile(tempPath, pdfBuffer);

  let generatedFileUrl = "";
  let generatedPublicId = "";

  try {
    const uploadResult = await uploadToCloudinary(tempPath, {
      upload_preset: "jobapp",
      folder: "generated-cvs",
      public_id: `generated_${cv.id}_${Date.now()}`,
      resource_type: "auto",
    });
    generatedFileUrl = uploadResult.secure_url;
    generatedPublicId = uploadResult.public_id;
    console.log(`[Generate] Uploaded PDF: ${generatedFileUrl}`);
  } finally {
    await unlink(tempPath).catch(() => {});
  }

  await db.cVVersion.update({
    where: { id: cv.id },
    data: { generatedFileUrl, generatedPublicId },
  });

  return NextResponse.json({ fileUrl: generatedFileUrl, reused: false });
}
