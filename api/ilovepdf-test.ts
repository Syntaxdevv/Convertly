import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";

dotenv.config({ path: ".env.local" });

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      connected: false,
      message: "Method not allowed.",
    });
  }

  if (process.env.NODE_ENV === "production") {
    return response.status(404).json({
      success: false,
      connected: false,
      message: "Endpoint not available.",
    });
  }

  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  const secretKey = process.env.ILOVEPDF_SECRET_KEY;

  if (!publicKey || !secretKey) {
    console.error("iLoveAPI credentials are missing.");

    return response.status(500).json({
      success: false,
      connected: false,
      message: "iLoveAPI credentials are missing.",
    });
  }

  try {
    const api = new ILovePDFApi(publicKey, secretKey);

    const task = api.newTask("compress");

    await task.start();

    console.log("iLoveAPI authentication successful.");

    return response.status(200).json({
      success: true,
      connected: true,
      provider: "iLoveAPI",
      message: "iLoveAPI authentication successful.",
    });
  } catch (error: unknown) {
    const err = error as {
      name?: string;
      message?: string;
      stack?: string;
      errors?: unknown;
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    console.error("iLoveAPI AUTH DEBUG:", {
      name: err.name,
      message: err.message,
      errors: err.errors,
      status: err.response?.status,
      response: err.response?.data,
      stack: err.stack,
    });

    return response.status(502).json({
      success: false,
      connected: false,
      message: "iLoveAPI authentication failed. Check server logs.",
    });
  }
}
