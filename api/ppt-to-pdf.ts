import dotenv from "dotenv";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CreatePDFJob,
  CreatePDFResult,
} from "@adobe/pdfservices-node-sdk";

import {
  createReservationToken,
  getClientIp,
  getUsageInfo,
  reserveUsage,
  releaseUsage,
} from "./_lib/usage";

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
        message:
          "Invalid PowerPoint upload. Please send the file as binary data.",
      });
    }

    const pptBuffer: Buffer = body;

    if (pptBuffer.length === 0) {
      return response.status(400).json({
        success: false,
        message: "The uploaded PowerPoint file is empty.",
      });
    }

    if (pptBuffer.length > MAX_FILE_SIZE) {
      return response.status(413).json({
        success: false,
        message: "PowerPoint file must not exceed 10 MB.",
      });
    }
    const isPPTX =
      pptBuffer.length >= 4 && pptBuffer[0] === 0x50 && pptBuffer[1] === 0x4b;

    const isPPT =
      pptBuffer.length >= 8 &&
      pptBuffer.subarray(0, 8).equals(Buffer.from("D0CF11E0A1B11AE1", "hex"));

    if (!isPPTX && !isPPT) {
      return response.status(400).json({
        success: false,
        message:
          "Invalid PowerPoint file. Only PPT and PPTX files are supported.",
      });
    }

    const mimeType = isPPTX ? MimeType.PPTX : MimeType.PPT;

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

    console.log("PowerPoint to PDF received:", pptBuffer.length, "bytes");

    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret,
    });

    const pdfServices = new PDFServices({
      credentials,
    });

    // Upload PowerPoint file to Adobe.
    const inputAsset = await pdfServices.upload({
      readStream: Readable.from(pptBuffer),
      mimeType,
    });

    console.log("PowerPoint uploaded to Adobe successfully.");

    const job = new CreatePDFJob({
      inputAsset,
    });

    const pollingURL = await pdfServices.submit({
      job,
    });

    const result = await pdfServices.getJobResult({
      pollingURL,
      resultType: CreatePDFResult,
    });

    const outputAsset = result.result?.asset;

    if (!outputAsset) {
      throw new Error(
        "Adobe PowerPoint to PDF conversion returned no output asset.",
      );
    }

    const output = await pdfServices.getContent({
      asset: outputAsset,
    });

    console.log("Adobe PowerPoint to PDF conversion completed.");

    response.setHeader("Content-Type", "application/pdf");

    response.setHeader(
      "Content-Disposition",
      'attachment; filename="convertly-presentation.pdf"',
    );

    response.setHeader("Cache-Control", "no-store");

    await pipeline(output.readStream, response);

    reservationKey = null;
    reservationToken = null;

    console.log("PowerPoint to PDF download completed.");
  } catch (error) {
    console.error("Adobe PowerPoint to PDF conversion error:", error);

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
        message: "PowerPoint to PDF conversion failed. Please try again.",
      });
    }
  }
}
