// lib/pdf/generator.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CVInput } from "@/lib/ai/prompts";

export async function generateCVPDF(profile: CVInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;
  const margin = 50;
  const lineHeight = 16;

  const addText = (text: string, size: number, isBold = false, indent = 0) => {
    const usedFont = isBold ? boldFont : font;
    page.drawText(text, {
      x: margin + indent,
      y,
      size,
      font: usedFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  };

  // Header
  addText("Curriculum Vitae", 24, true);
  y -= 10;

  // Summary
  if (profile.summary) {
    addText("Professional Summary", 14, true);
    const summaryLines = wrapText(profile.summary, font, 12, 500);
    for (const line of summaryLines) {
      addText(line, 12, false, 10);
    }
    y -= 5;
  }

  // Experience
  if (profile.experience?.length) {
    addText("Work Experience", 14, true);
    for (const exp of profile.experience) {
      addText(`${exp.role} at ${exp.company}`, 12, true);
      addText(exp.duration, 10, false);
      for (const bullet of exp.bullets) {
        const bulletLines = wrapText(`• ${bullet}`, font, 10, 480);
        for (const line of bulletLines) {
          addText(line, 10, false, 15);
        }
      }
      y -= 5;
    }
  }

  // Skills
  if (profile.skills?.length) {
    addText("Skills", 14, true);
    const skillsText = profile.skills.join(", ");
    const skillLines = wrapText(skillsText, font, 11, 500);
    for (const line of skillLines) {
      addText(line, 11, false, 10);
    }
    y -= 5;
  }

  // Education
  if (profile.education?.length) {
    addText("Education", 14, true);
    for (const edu of profile.education) {
      addText(edu.degree, 12, true);
      addText(`${edu.institution}, ${edu.year}`, 11, false);
    }
    y -= 5;
  }

  // Projects
  if (profile.projects?.length) {
    addText("Projects", 14, true);
    for (const proj of profile.projects) {
      addText(proj.name, 12, true);
      const descLines = wrapText(proj.description, font, 11, 500);
      for (const line of descLines) {
        addText(line, 11, false, 10);
      }
      if (proj.technologies?.length) {
        addText(`Technologies: ${proj.technologies.join(", ")}`, 10, false);
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
