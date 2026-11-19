import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";
dotenv.config({ path: ".env.local" });

export default function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  response.status(200).json({
    success: true,
    message: "Convertly API is running.",
    services: {
      adobeConfigured: Boolean(
        process.env.PDF_SERVICES_CLIENT_ID &&
        process.env.PDF_SERVICES_CLIENT_SECRET &&
        process.env.PDF_SERVICES_ORGANIZATION_ID,
      ),
      backupConfigured: Boolean(process.env.PDFCONVERSIONAPI_KEY),
      usageLimitConfigured: Boolean(
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN,
      ),
    },
  });
}
