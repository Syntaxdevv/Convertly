
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
    getDeviceId,
    getUsageInfo,
    reserveUsage,
    releaseUsage,
} from "./_lib/usage.js";

dotenv.config({ path: ".env.local" });

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const XLSX_MIME =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const XLS_MIME = "application/vnd.ms-excel";

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
                message: "Invalid Excel upload. Please send the file as binary data.",
            });
        }

        const excelBuffer: Buffer = body;

        if (excelBuffer.length === 0) {
            return response.status(400).json({
                success: false,
                message: "The uploaded Excel file is empty.",
            });
        }

        if (excelBuffer.length > MAX_FILE_SIZE) {
            return response.status(413).json({
                success: false,
                message: "Excel file must not exceed 10 MB.",
            });
        }

        const isXLSX =
            excelBuffer.length >= 4 &&
            excelBuffer[0] === 0x50 &&
            excelBuffer[1] === 0x4b;

        const isXLS =
            excelBuffer.length >= 8 &&
            excelBuffer.subarray(0, 8).equals(
                Buffer.from("D0CF11E0A1B11AE1", "hex"),
            );

        if (!isXLSX && !isXLS) {
            return response.status(400).json({
                success: false,
                message: "Invalid Excel file. Only XLS and XLSX files are supported.",
            });
        }

        const mimeType = isXLSX ? MimeType.XLSX : MimeType.XLS;

        const deviceId = getDeviceId(request);

        if (!deviceId) {
            return response.status(400).json({
                success: false,
                message: "Device ID is required.",
            });
        }

        const usage = getUsageInfo(deviceId);

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

        console.log("Excel to PDF received:", excelBuffer.length, "bytes");

        const credentials = new ServicePrincipalCredentials({
            clientId,
            clientSecret,
        });

        const pdfServices = new PDFServices({
            credentials,
        });

        const inputAsset = await pdfServices.upload({
            readStream: Readable.from(excelBuffer),
            mimeType,
        });

        console.log("Excel uploaded to Adobe successfully.");

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
                "Adobe Excel to PDF conversion returned no output asset.",
            );
        }

        const output = await pdfServices.getContent({
            asset: outputAsset,
        });

        console.log("Adobe Excel to PDF conversion completed.");

        response.setHeader("Content-Type", "application/pdf");

        response.setHeader(
            "Content-Disposition",
            'attachment; filename="convertly-document.pdf"',
        );

        response.setHeader("Cache-Control", "no-store");

        await pipeline(output.readStream, response);

        reservationKey = null;
        reservationToken = null;

        console.log("Excel to PDF download completed.");
    } catch (error) {
        console.error("Adobe Excel to PDF conversion error:", error);

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
                message: "Excel to PDF conversion failed. Please try again.",
            });
        }
    }
}
