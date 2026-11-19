import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface ExtractedPDFPage {
  pageNumber: number;
  lines: string[];
}

export async function extractPdfText(file: File): Promise<ExtractedPDFPage[]> {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Please upload a valid PDF file.");
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error("PDF file must not exceed 25 MB.");
  }

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  if (pdf.numPages > 100) {
    throw new Error("Maximum of 100 PDF pages allowed.");
  }

  const pages: ExtractedPDFPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const lines: string[] = [];
    let currentLine = "";

    for (const item of textContent.items) {
      if (!("str" in item)) {
        continue;
      }

      const text = item.str;

      if (text) {
        currentLine += text;

        if (item.hasEOL) {
          const trimmedLine = currentLine.trim();

          if (trimmedLine) {
            lines.push(trimmedLine);
          }

          currentLine = "";
        } else {
          currentLine += " ";
        }
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    pages.push({
      pageNumber,
      lines,
    });
  }

  return pages;
}
