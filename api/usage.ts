import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DAILY_LIMIT, getDeviceId, getUsageInfo, redis } from "./_lib/usage.js";

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
    const deviceId = getDeviceId(request);

    if (!deviceId) {
      return response.status(400).json({
        success: false,
        message: "Device ID is required.",
      });
    }

    const { key } = getUsageInfo(deviceId);
    const used = await redis.scard(key);
    const remaining = Math.max(0, DAILY_LIMIT - used);

    return response.status(200).json({
      success: true,
      limit: DAILY_LIMIT,
      used,
      remaining,
      resetTimezone: "Asia/Manila",
    });
  } catch {
    return response.status(500).json({
      success: false,
      message: "Unable to load conversion usage.",
    });
  }
}
