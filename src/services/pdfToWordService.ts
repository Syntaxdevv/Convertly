import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PDFTextBlock {
  text: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface PDFEmbeddedImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  x: number;
  top: number;
  displayWidth: number;
  displayHeight: number;
}

export interface PDFWordPage {
  pageNumber: number;
  width: number;
  height: number;
  source: "digital" | "ocr";
  blocks: PDFTextBlock[];
  images: PDFEmbeddedImage[];
  pageImage: string;
}

export interface PDFConversionProgress {
  currentPage: number;
  totalPages: number;
  stage: "reading" | "ocr" | "images";
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_PAGES = 30;
const RENDER_SCALE = 1.5;

interface PDFImageObject {
  width?: number;
  height?: number;
  data?: ArrayLike<number> | null;
  bitmap?: ImageBitmap | null;
}

interface PDFObjectStore {
  get(
    id: string,
    callback?: (value: PDFImageObject) => void,
  ): PDFImageObject | undefined;
}

type Matrix = [number, number, number, number, number, number];

interface ImagePlacement {
  id: string;
  matrix: Matrix;
  inlineImage?: PDFImageObject;
}

interface OCRWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface OCRDataWithWords {
  text: string;
  words?: OCRWord[];
}

function multiplyMatrices(first: Matrix, second: Matrix): Matrix {
  const [a, b, c, d, e, f] = first;
  const [g, h, i, j, k, l] = second;

  return [
    a * g + c * h,
    b * g + d * h,
    a * i + c * j,
    b * i + d * j,
    a * k + c * l + e,
    b * k + d * l + f,
  ];
}

function getPdfImageObject(
  store: PDFObjectStore,
  id: string,
): Promise<PDFImageObject | null> {
  return new Promise((resolve) => {
    let completed = false;

    const finish = (value: PDFImageObject | null) => {
      if (completed) return;

      completed = true;
      resolve(value);
    };

    try {
      const result = store.get(id, (value) => {
        finish(value);
      });

      if (result) {
        finish(result);
      }
    } catch {
      finish(null);
    }
  });
}

function imageObjectToDataUrl(image: PDFImageObject): string | null {
  const width = image.width;
  const height = image.height;

  if (
    !width ||
    !height ||
    width <= 0 ||
    height <= 0 ||
    width * height > 25_000_000
  ) {
    return null;
  }

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  if (image.bitmap) {
    context.drawImage(image.bitmap, 0, 0, width, height);

    return canvas.toDataURL("image/png");
  }

  const data = image.data;

  if (!data || data.length === 0) {
    return null;
  }

  const pixelCount = width * height;
  const imageData = context.createImageData(width, height);

  if (data.length === pixelCount * 4) {
    for (let i = 0; i < pixelCount * 4; i++) {
      imageData.data[i] = Number(data[i]);
    }
  } else if (data.length === pixelCount * 3) {
    for (let i = 0; i < pixelCount; i++) {
      const sourceIndex = i * 3;
      const targetIndex = i * 4;

      imageData.data[targetIndex] = Number(data[sourceIndex]);
      imageData.data[targetIndex + 1] = Number(data[sourceIndex + 1]);
      imageData.data[targetIndex + 2] = Number(data[sourceIndex + 2]);
      imageData.data[targetIndex + 3] = 255;
    }
  }

  // Grayscale
  else if (data.length === pixelCount) {
    for (let i = 0; i < pixelCount; i++) {
      const gray = Number(data[i]);
      const targetIndex = i * 4;

      imageData.data[targetIndex] = gray;
      imageData.data[targetIndex + 1] = gray;
      imageData.data[targetIndex + 2] = gray;
      imageData.data[targetIndex + 3] = 255;
    }
  } else {
    return null;
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}
async function extractPageImages(
  page: any,
  pageHeight: number,
): Promise<PDFEmbeddedImage[]> {
  const images: PDFEmbeddedImage[] = [];

  const operatorList = await page.getOperatorList();

  const placements: ImagePlacement[] = [];
  const matrixStack: Matrix[] = [];

  let currentMatrix: Matrix = [1, 0, 0, 1, 0, 0];

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const operation = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];

    if (operation === pdfjsLib.OPS.save) {
      matrixStack.push([...currentMatrix] as Matrix);
      continue;
    }

    if (operation === pdfjsLib.OPS.restore) {
      const previous = matrixStack.pop();

      if (previous) {
        currentMatrix = previous;
      }

      continue;
    }

    if (operation === pdfjsLib.OPS.transform) {
      const values = args?.[0];

      if (Array.isArray(values) && values.length >= 6) {
        currentMatrix = multiplyMatrices(currentMatrix, [
          values[0],
          values[1],
          values[2],
          values[3],
          values[4],
          values[5],
        ]);
      }

      continue;
    }

    if (operation === pdfjsLib.OPS.paintImageXObject) {
      const imageId = args?.[0];

      if (typeof imageId === "string") {
        placements.push({
          id: imageId,
          matrix: [...currentMatrix] as Matrix,
        });
      }

      continue;
    }

    if (operation === pdfjsLib.OPS.paintInlineImageXObject) {
      const inlineImage = args?.[0];

      if (inlineImage && typeof inlineImage === "object") {
        placements.push({
          id: `inline-${i}`,
          matrix: [...currentMatrix] as Matrix,
          inlineImage: inlineImage as PDFImageObject,
        });
      }
    }
  }

  // Resolve and convert extracted images
  for (const placement of placements) {
    let imageObject: PDFImageObject | null = null;

    if (placement.inlineImage) {
      imageObject = placement.inlineImage;
    } else {
      const store = (
        placement.id.startsWith("g_") ? page.commonObjs : page.objs
      ) as PDFObjectStore;

      imageObject = await getPdfImageObject(store, placement.id);
    }

    if (!imageObject) {
      continue;
    }

    const dataUrl = imageObjectToDataUrl(imageObject);

    if (!dataUrl) {
      continue;
    }

    const [a, b, c, d, e, f] = placement.matrix;

    const displayWidth = Math.sqrt(a * a + b * b);
    const displayHeight = Math.sqrt(c * c + d * d);

    if (
      !Number.isFinite(displayWidth) ||
      !Number.isFinite(displayHeight) ||
      displayWidth <= 0 ||
      displayHeight <= 0
    ) {
      continue;
    }

    const x = e;
    const top = pageHeight - f - displayHeight;

    images.push({
      id: placement.id,
      dataUrl,
      width: imageObject.width || 0,
      height: imageObject.height || 0,
      x,
      top,
      displayWidth,
      displayHeight,
    });
  }

  return images;
}

export async function analyzePdfForWord(
  file: File,
  onProgress?: (progress: PDFConversionProgress) => void,
): Promise<PDFWordPage[]> {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Please upload a valid PDF file.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDF file is too large. Maximum allowed size is 25 MB.");
  }

  if (file.size === 0) {
    throw new Error("The selected PDF file is empty.");
  }

  let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

  let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

  const results: PDFWordPage[] = [];

  try {
    const fileData = new Uint8Array(await file.arrayBuffer());

    loadingTask = pdfjsLib.getDocument({
      data: fileData,
      isOffscreenCanvasSupported: false,
    });

    const pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PAGES) {
      throw new Error(
        `This PDF contains ${pdf.numPages} pages. Maximum allowed is ${MAX_PAGES} pages.`,
      );
    }

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      onProgress?.({
        currentPage: pageNumber,
        totalPages: pdf.numPages,
        stage: "reading",
      });

      const viewport = page.getViewport({
        scale: 1,
      });

      const renderViewport = page.getViewport({
        scale: RENDER_SCALE,
      });

      const canvas = document.createElement("canvas");

      canvas.width = Math.ceil(renderViewport.width);
      canvas.height = Math.ceil(renderViewport.height);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(`Unable to render PDF page ${pageNumber}.`);
      }

      await page.render({
        canvas,
        canvasContext: context,
        viewport: renderViewport,
      }).promise;

      const pageImage = canvas.toDataURL("image/png");

      const textContent = await page.getTextContent();

      const blocks: PDFTextBlock[] = [];

      for (const item of textContent.items) {
        if (!("str" in item)) {
          continue;
        }

        const text = item.str.trim();

        if (!text) {
          continue;
        }

        const transform = item.transform;

        const x = transform[4];
        const y = transform[5];

        const fontSize = Math.abs(transform[3]) || 10;

        blocks.push({
          text,
          x,
          top: viewport.height - y,
          width: item.width || 0,
          height: item.height || fontSize,
          fontSize,
        });
      }

      let source: "digital" | "ocr" = "digital";

      const extractedText = blocks
        .map((block) => block.text)
        .join(" ")
        .trim();

      if (extractedText.length < 20) {
        source = "ocr";

        onProgress?.({
          currentPage: pageNumber,
          totalPages: pdf.numPages,
          stage: "ocr",
        });

        if (!ocrWorker) {
          ocrWorker = await createWorker("eng");
        }

        const recognition = await ocrWorker.recognize(canvas);

        const ocrData = recognition.data as unknown as OCRDataWithWords;

        blocks.length = 0;

        const ocrWords = ocrData.words ?? [];

        if (ocrWords.length > 0) {
          const scale = 1 / RENDER_SCALE;

          for (const word of ocrWords) {
            const text = word.text.trim();

            if (!text) {
              continue;
            }

            const wordWidth = (word.bbox.x1 - word.bbox.x0) * scale;

            const wordHeight = (word.bbox.y1 - word.bbox.y0) * scale;

            blocks.push({
              text,
              x: word.bbox.x0 * scale,
              top: word.bbox.y0 * scale,
              width: wordWidth,
              height: wordHeight,
              fontSize: Math.max(8, wordHeight),
            });
          }
        } else {
          const lines = ocrData.text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

          lines.forEach((line, index) => {
            blocks.push({
              text: line,
              x: 0,
              top: index * 14,
              width: viewport.width,
              height: 14,
              fontSize: 11,
            });
          });
        }
      }
      onProgress?.({
        currentPage: pageNumber,
        totalPages: pdf.numPages,
        stage: "images",
      });

      const images = await extractPageImages(page, viewport.height);

      blocks.sort((a, b) => {
        const verticalDifference = a.top - b.top;

        if (Math.abs(verticalDifference) > 3) {
          return verticalDifference;
        }

        return a.x - b.x;
      });

      results.push({
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        source,
        blocks,
        images,
        pageImage,
      });

      canvas.width = 0;
      canvas.height = 0;

      page.cleanup();
    }

    return results;
  } catch (error) {
    console.error("PDF analysis error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to analyze this PDF file.");
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate();
    }

    if (loadingTask) {
      await loadingTask.destroy();
    }
  }
}
