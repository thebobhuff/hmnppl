import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text;
  }

  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (
    file.type.startsWith("text/") ||
    file.name.match(/\.(txt|md|markdown|json|csv|xml|html?|log)$/i)
  ) {
    return buffer.toString("utf-8");
  }

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File);

    const extracted = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        text: await extractText(file),
      })),
    );

    return NextResponse.json({ files: extracted });
  } catch (error) {
    console.error("File extraction failed:", error);
    return NextResponse.json(
      { error: "Failed to extract file contents" },
      { status: 500 },
    );
  }
}
