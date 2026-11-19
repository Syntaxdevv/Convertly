import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";
import { Readable } from "node:stream";
import JSZip from "jszip";

import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExtractPDFJob,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFResult,
} from "@adobe/pdfservices-node-sdk";

import {
  getClientIp,
  getUsageInfo,
  createReservationToken,
  reserveUsage,
  releaseUsage,
} from "./_lib/usage.js";

dotenv.config({ path: ".env.local" });

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  const clientId = process.env.PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return response.status(500).json({
      success: false,
      message: "PDF conversion service is not configured.",
    });
  }

  const pdfBuffer = Buffer.isBuffer(request.body)
    ? request.body
    : Buffer.from(request.body ?? "");

  if (pdfBuffer.length === 0) {
    return response.status(400).json({
      success: false,
      message: "Please upload a PDF file.",
    });
  }

  if (pdfBuffer.length > MAX_FILE_SIZE) {
    return response.status(413).json({
      success: false,
      message: "PDF file must not exceed 10 MB.",
    });
  }

  if (pdfBuffer.subarray(0, 5).toString() !== "%PDF-") {
    return response.status(400).json({
      success: false,
      message: "The uploaded file is not a valid PDF.",
    });
  }

  const ip = getClientIp(request);

  if (!ip) {
    return response.status(400).json({
      success: false,
      message: "Unable to identify your connection. Please try again.",
    });
  }

  let usageKey = "";
  let reservationToken = "";
  let reservationCreated = false;

  try {
    const usageInfo = getUsageInfo(ip);

    usageKey = usageInfo.key;
    reservationToken = createReservationToken();

    const reservation = await reserveUsage(
      usageKey,
      reservationToken,
      usageInfo.expiresIn,
    );

    if (reservation === -1) {
      return response.status(429).json({
        success: false,
        message:
          "You have reached your daily conversion limit. Please try again tomorrow.",
      });
    }

    reservationCreated = true;

    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret,
    });

    const pdfServices = new PDFServices({ credentials });

    const inputAsset = await pdfServices.upload({
      readStream: Readable.from(pdfBuffer),
      mimeType: MimeType.PDF,
    });

    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT],
    });

    const job = new ExtractPDFJob({
      inputAsset,
      params,
    });

    const pollingURL = await pdfServices.submit({ job });

    const result = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult,
    });

    const resourceAsset = result.result?.resource;

    if (!resourceAsset) {
      throw new Error("The extracted PDF content is unavailable.");
    }

    const outputAsset = await pdfServices.getContent({
      asset: resourceAsset,
    });

    const zipBuffer = await streamToBuffer(outputAsset.readStream);

    const zip = await JSZip.loadAsync(zipBuffer);

    const structuredDataFile = Object.values(zip.files).find(
      (entry) => !entry.dir && /(^|\/)structuredData\.json$/i.test(entry.name),
    );

    if (!structuredDataFile) {
      throw new Error("The extracted PDF text file could not be found.");
    }

    const structuredDataText = await structuredDataFile.async("text");
    const structuredData = JSON.parse(structuredDataText);

    const elements = Array.isArray(structuredData.elements)
      ? structuredData.elements
      : [];

    const extractedText = elements
      .map((element: { Text?: unknown }) =>
        typeof element.Text === "string" ? element.Text : "",
      )
      .filter((text: string) => text.trim().length > 0)
      .join("\n");

    if (!extractedText.trim()) {
      throw new Error(
        "No readable text was found in this PDF. It may contain scanned pages that require OCR.",
      );
    }

    const textBuffer = Buffer.from(extractedText, "utf-8");

    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="convertly-extracted-text.txt"',
    );
    response.setHeader("Content-Length", textBuffer.length);
    response.setHeader("Cache-Control", "no-store");

    return response.status(200).send(textBuffer);
  } catch (error) {
    if (reservationCreated) {
      try {
        await releaseUsage(usageKey, reservationToken);
      } catch (releaseError) {
        console.error("Failed to release usage reservation:", releaseError);
      }
    }

    console.error("PDF to TXT conversion error:", error);

    return response.status(502).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while extracting PDF text.",
    });
  }
}
