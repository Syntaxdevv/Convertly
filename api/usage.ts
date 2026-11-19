import type { VercelRequest, VercelResponse } from "@vercel/node";

import { DAILY_LIMIT, getClientIp, getUsageInfo, redis } from "./_lib/usage";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const ip = getClientIp(request);

    if (!ip) {
      return response.status(400).json({
        success: false,
        message: "Unable to identify visitor.",
      });
    }

    const { key } = getUsageInfo(ip);

    const used = Number(await redis.scard(key));
    const remaining = Math.max(0, DAILY_LIMIT - used);

    return response.status(200).json({
      success: true,
      limit: DAILY_LIMIT,
      used,
      remaining,
      resetTimezone: "Asia/Manila",
    });
  } catch (error) {
    console.error("Usage API error:", error);

    return response.status(503).json({
      success: false,
      message: "Unable to check conversion usage.",
    });
  }
}
