import dotenv from "dotenv";
import { Redis } from "@upstash/redis";
import { createHash, randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
dotenv.config({ path: ".env.local" });
export const redis = Redis.fromEnv();
export const DAILY_LIMIT = 3;

export function getClientIp(request: VercelRequest): string | null {
  const forwardedFor = request.headers["x-forwarded-for"];

  let ip: string | undefined;

  if (typeof forwardedFor === "string") {
    ip = forwardedFor.split(",")[0].trim();
  } else if (Array.isArray(forwardedFor)) {
    ip = forwardedFor[0]?.split(",")[0].trim();
  } else {
    const realIp = request.headers["x-real-ip"];

    ip = Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return ip?.trim() || null;
}

/**
 * Generate a daily usage key using Philippine time.
 */
export function getUsageInfo(ip: string) {
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
  const hashedIp = createHash("sha256").update(ip).digest("hex");

  return {
    key: `convertly:external-api:${date}:${hashedIp}`,
    expiresIn,
  };
}

/**
 * Generate a unique reservation token.
 */
export function createReservationToken(): string {
  return randomUUID();
}

/**
 * Atomically reserve one conversion slot.
 *
 * Returns:
 * - Current usage count when successful.
 * - -1 when the daily limit is reached.
 */
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

/**
 * Release a reserved slot when conversion fails.
 */
export async function releaseUsage(key: string, token: string): Promise<void> {
  await redis.srem(key, token);
}
