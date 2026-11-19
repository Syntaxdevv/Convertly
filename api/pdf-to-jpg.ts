import dotenv from "dotenv";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExportPDFToImagesParams,
  ExportPDFToImagesTargetFormat,
  ExportPDFToImagesOutputType,
  ExportPDFToImagesJob,
  ExportPDFToImagesResult,
} from "@adobe/pdfservices-node-sdk";

import {
  createReservationToken,
  getClientIp,
  getUsageInfo,
  reserveUsage,
  releaseUsage,
} from "./_lib/usage.js";

dotenv.config({ path: ".env.local" });

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    const clientId = process.env.PDF_SERVICES_CLIENT_ID;
    const clientSecret = process.env.PDF_SERVICES_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return response.status(500).json({
        success: false,
        message: "Adobe credentials are not configured.",
      });
    }

    const body = request.body;

    if (!Buffer.isBuffer(body)) {
      return response.status(400).json({
        success: false,
        message: "Invalid PDF upload. Please send the PDF as binary data.",
      });
    }

    const pdfBuffer: Buffer = body;

    if (pdfBuffer.length === 0) {
      return response.status(400).json({
        success: false,
        message: "The uploaded PDF is empty.",
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
        message: "Daily external API conversion limit reached.",
        limit: 3,
        remaining: 0,
      });
    }

    console.log("PDF to JPG received:", pdfBuffer.length, "bytes");

    // Adobe authentication.
    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret,
    });

    const pdfServices = new PDFServices({
      credentials,
    });

    const inputAsset = await pdfServices.upload({
      readStream: Readable.from(pdfBuffer),
      mimeType: MimeType.PDF,
    });

    console.log("PDF uploaded to Adobe successfully.");

    const params = new ExportPDFToImagesParams({
      targetFormat: ExportPDFToImagesTargetFormat.JPEG,
      outputType: ExportPDFToImagesOutputType.ZIP_OF_PAGE_IMAGES,
    });

    const job = new ExportPDFToImagesJob({
      inputAsset,
      params,
    });

    const pollingURL = await pdfServices.submit({
      job,
    });

    const result = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExportPDFToImagesResult,
    });

    const outputAssets = result.result?.assets;

    if (!outputAssets || outputAssets.length === 0) {
      throw new Error("Adobe PDF to JPG conversion returned no output assets.");
    }

    const output = await pdfServices.getContent({
      asset: outputAssets[0],
    });

    console.log("Adobe PDF to JPG conversion completed.");

    response.setHeader("Content-Type", "application/zip");

    response.setHeader(
      "Content-Disposition",
      'attachment; filename="convertly-jpg-images.zip"',
    );

    response.setHeader("Cache-Control", "no-store");

    await pipeline(output.readStream, response);

    reservationKey = null;
    reservationToken = null;

    console.log("PDF to JPG download completed.");
  } catch (error) {
    console.error("Adobe PDF to JPG conversion error:", error);

    if (reservationKey && reservationToken) {
      try {
        await releaseUsage(reservationKey, reservationToken);
      } catch (releaseError) {
        console.error("Failed to release usage reservation:", releaseError);
      }
    }

    if (!response.headersSent && !response.destroyed) {
      return response.status(502).json({
        success: false,
        message: "PDF to JPG conversion failed. Please try again.",
      });
    }
  }
}
