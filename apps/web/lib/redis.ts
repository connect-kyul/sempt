import Redis from "ioredis";
import type { ConnectionOptions } from "bullmq";

let redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return redis;
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true
  });

  redis.on("error", () => {
    // Redis is optional. Avoid leaking connection details in logs.
  });

  return redis;
}

export function getBullMqConnectionOptions(): ConnectionOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || "6379", 10),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname ? Number.parseInt(parsed.pathname.replace("/", ""), 10) || 0 : 0
  };
}
