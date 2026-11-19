import dotenv from "dotenv";
import { Redis } from "@upstash/redis";
import { createHash, randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

dotenv.config({ path: ".env.local" });

export const redis = Redis.fromEnv();
export const DAILY_LIMIT = 3;

export function getDeviceId(request: VercelRequest): string | null {
  const deviceId = request.headers["x-convertly-device-id"];

  if (typeof deviceId !== "string") {
    return null;
  }

  const trimmedDeviceId = deviceId.trim();

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(trimmedDeviceId)) {
    return null;
  }

  return trimmedDeviceId;
}

export function getUsageInfo(deviceId: string) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [year, month, day] = date.split("-").map(Number);

  const nextMidnight = Date.UTC(year, month - 1, day + 1, -8, 0, 0);

  const expiresIn = Math.max(
    60,
    Math.ceil((nextMidnight - Date.now()) / 1000) + 60,
  );

  const hashedDeviceId = createHash("sha256").update(deviceId).digest("hex");

  return {
    key: `convertly:external-api:${date}:${hashedDeviceId}`,
    expiresIn,
  };
}

export function createReservationToken(): string {
  return randomUUID();
}

export async function reserveUsage(
  key: string,
  token: string,
  expiresIn: number,
): Promise<number> {
  const script = `
        local count = redis.call("SCARD", KEYS[1])

        if count >= tonumber(ARGV[1]) then
            return -1
        end

        redis.call("SADD", KEYS[1], ARGV[2])
        redis.call("EXPIRE", KEYS[1], tonumber(ARGV[3]))

        return redis.call("SCARD", KEYS[1])
    `;

  const result = await redis.eval(
    script,
    [key],
    [DAILY_LIMIT, token, expiresIn],
  );

  return Number(result);
}

export async function releaseUsage(key: string, token: string): Promise<void> {
  await redis.srem(key, token);
}
