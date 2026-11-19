import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  createReservationToken,
  getClientIp,
  getUsageInfo,
  redis,
  releaseUsage,
  reserveUsage,
} from "./_lib/usage.js";

dotenv.config({ path: ".env.local" });

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const API_URL = "https://api.pdfconversionapi.com/v2/convert/docx/to/pdf";

interface ConversionFile {
  FileName: string;
  FileExt: string;
  FileSize: number;
  FileData: string;
}

interface ConversionResponse {
  Files?: ConversionFile[];
  Code?: number;
  Message?: string;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  let reservationKey: string | null = null;
  let reservationToken: string | null = null;

  try {
    const apiKey = process.env.PDFCONVERSIONAPI_KEY;

    if (!apiKey) {
      return response.status(500).json({
        success: false,
        message: "PDFConversionAPI key is not configured.",
      });
    }

    const body = request.body;

    if (!Buffer.isBuffer(body)) {
      return response.status(400).json({
        success: false,
        message: "Please upload a DOCX file as binary data.",
      });
    }

    const docxBuffer: Buffer = body;

    if (docxBuffer.length === 0) {
      return response.status(400).json({
        success: false,
        message: "The uploaded file is empty.",
      });
    }

    if (docxBuffer.length > MAX_FILE_SIZE) {
      return response.status(413).json({
        success: false,
        message: "DOCX file must not exceed 10 MB.",
      });
    }

    if (docxBuffer[0] !== 0x50 || docxBuffer[1] !== 0x4b) {
      return response.status(400).json({
        success: false,
        message: "Invalid DOCX file.",
      });
    }

    const ip = getClientIp(request);

    if (!ip) {
      return response.status(400).json({
        success: false,
        message: "Unable to identify visitor.",
      });
    }

    const usage = getUsageInfo(ip);

    reservationKey = usage.key;
    reservationToken = createReservationToken();

    const used = await reserveUsage(
      reservationKey,
      reservationToken,
      usage.expiresIn,
    );

    if (used === -1) {
      reservationKey = null;
      reservationToken = null;

      return response.status(429).json({
        success: false,
        message: "Daily conversion limit reached.",
        limit: 3,
        remaining: 0,
      });
    }

    const fileBytes = new Uint8Array(docxBuffer);

    const fileBlob = new Blob([fileBytes.buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const formData = new FormData();

    formData.append("File", fileBlob, "convertly-document.docx");

    // Send DOCX to PDFConversionAPI.
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });

    const responseText = await apiResponse.text();

    let result: ConversionResponse;

    try {
      result = JSON.parse(responseText) as ConversionResponse;
    } catch {
      throw new Error("Invalid response from PDFConversionAPI.");
    }

    if (!apiResponse.ok) {
      throw new Error(
        result.Message || "The document conversion service failed.",
      );
    }

    const convertedFile = result.Files?.[0];

    if (!convertedFile || typeof convertedFile.FileData !== "string") {
      throw new Error("PDFConversionAPI returned no converted file.");
    }

    const pdfBuffer = Buffer.from(convertedFile.FileData, "base64");

    if (
      pdfBuffer.length === 0 ||
      pdfBuffer.subarray(0, 5).toString() !== "%PDF-"
    ) {
      throw new Error("The conversion service returned an invalid PDF.");
    }

    reservationKey = null;
    reservationToken = null;

    response.setHeader("Content-Type", "application/pdf");

    response.setHeader(
      "Content-Disposition",
      'attachment; filename="convertly-document.pdf"',
    );

    response.setHeader("Content-Length", pdfBuffer.length);

    response.setHeader("Cache-Control", "no-store");

    return response.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Word to PDF conversion error:", error);

    if (reservationKey && reservationToken) {
      try {
        await releaseUsage(reservationKey, reservationToken);
      } catch (releaseError) {
        console.error("Failed to release usage reservation:", releaseError);
      }
    }

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return response.status(504).json({
        success: false,
        message: "Conversion timed out. Please try again.",
      });
    }

    return response.status(502).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Word to PDF conversion failed.",
    });
  }
}
