// lib/docx/inject-sections.ts
import PizZip from "pizzip";

// Helper to convert string to XML-safe
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export function injectMissingSections(
  templateBuffer: Buffer,
  missingSections: string[],
): Buffer {
  const zip = new PizZip(templateBuffer);
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) {
    throw new Error("Invalid DOCX: missing document.xml");
  }

  // Build the XML for new sections
  let newContent = "";
  for (const section of missingSections) {
    const heading = section.charAt(0).toUpperCase() + section.slice(1);
    newContent += `
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
        </w:pPr>
        <w:r>
          <w:t>${escapeXml(heading)}</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:r>
          <w:t>{{${section}}}</w:t>
        </w:r>
      </w:p>
    `;
  }

  // Find the last paragraph (or before </w:body>)
  const bodyEndIndex = documentXml.lastIndexOf("</w:body>");
  if (bodyEndIndex === -1) {
    throw new Error("Invalid document.xml: missing </w:body>");
  }
  const modifiedXml =
    documentXml.slice(0, bodyEndIndex) +
    newContent +
    documentXml.slice(bodyEndIndex);

  zip.file("word/document.xml", modifiedXml);
  return zip.generate({ type: "nodebuffer" });
}
